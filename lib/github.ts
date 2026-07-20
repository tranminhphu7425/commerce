export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
}

const STORAGE_KEY = "commerce_github_config";

export function getGitHubConfig(): GitHubConfig | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveGitHubConfig(config: GitHubConfig): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("github-config-updated"));
  }
}

export function clearGitHubConfig(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("github-config-updated"));
  }
}

// UTF-8 friendly Base64 helper
function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function base64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str.replace(/\n/g, "")), (c: string) =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      )
      .join("")
  );
}

/**
 * Verify if GitHub token and repo configuration are valid
 */
export async function testGitHubConnection(config: GitHubConfig): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      if (data.permissions && data.permissions.push === false) {
        return {
          success: false,
          message: "❌ Token này chỉ có quyền ĐỌC (Read-only), thiếu quyền GHI (Write). Vui lòng cấp quyền 'Read and write' cho Contents khi tạo Token!",
        };
      }
      return { success: true, message: `Kết nối & Cấp quyền GHI thành công tới GitHub Repository: ${config.owner}/${config.repo}` };
    } else if (res.status === 401) {
      return { success: false, message: "Token không hợp lệ hoặc đã hết hạn." };
    } else if (res.status === 404) {
      return { success: false, message: "Không tìm thấy Repository hoặc Token không có quyền truy cập." };
    } else {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.message || "Lỗi khi kiểm tra kết nối GitHub." };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Không thể kết nối tới GitHub API." };
  }
}

/**
 * Upload an image file directly to GitHub repo: public/images/products/{filename}
 */
export async function uploadImageToGitHub(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const config = getGitHubConfig();
  if (!config || !config.token) {
    return { success: false, error: "Chưa cấu hình GitHub Token" };
  }

  try {
    // 1. Sanitize file name
    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.]+/g, "-");
    const filename = `${timestamp}-${cleanFileName}`;
    const filePath = `public/images/products/${filename}`;

    // 2. Convert file to Base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64Content = btoa(binary);

    // 3. Commit image to public/images/products/
    const urlPublic = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
    const res = await fetch(urlPublic, {
      method: "PUT",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `upload(image): add product image ${filename}`,
        content: base64Content,
        branch: config.branch || "main",
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.message || "Lỗi khi upload ảnh lên GitHub" };
    }

    // 4. Also commit image to docs/images/products/ (so GitHub Pages serving /docs updates image immediately)
    const docsFilePath = `docs/images/products/${filename}`;
    const urlDocs = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${docsFilePath}`;
    await fetch(urlDocs, {
      method: "PUT",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `upload(image): add product image to docs ${filename}`,
        content: base64Content,
        branch: config.branch || "main",
      }),
    }).catch(() => {});

    // Relative image path for Next.js app
    const imageUrl = `/commerce/images/products/${filename}`;
    return { success: true, url: imageUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi gửi request upload ảnh" };
  }
}

/**
 * Sync store data (products) directly to GitHub repo data/store.json
 */
export async function syncStoreToGitHub(
  updater: (store: any) => any,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const config = getGitHubConfig();
  if (!config || !config.token) {
    return { success: false, error: "Chưa cấu hình GitHub Token" };
  }

  try {
    const filePath = "data/store.json";
    const branch = config.branch || "main";
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${branch}`;

    // 1. Get current store.json from GitHub
    const getRes = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Cache-Control": "no-cache",
      },
    });

    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      return { success: false, error: `Không thể đọc data/store.json từ GitHub: ${err.message || getRes.statusText}` };
    }

    const fileData = await getRes.json();
    const currentSha = fileData.sha;
    const currentJsonString = base64ToUtf8(fileData.content);
    const currentStore = JSON.parse(currentJsonString);

    // 2. Apply updates
    const updatedStore = updater(currentStore);
    const updatedJsonString = JSON.stringify(updatedStore, null, 2);
    const base64UpdatedContent = utf8ToBase64(updatedJsonString);

    // 3. Put updated store.json back to GitHub
    const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`;
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64UpdatedContent,
        sha: currentSha,
        branch: branch,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return { success: false, error: `Không thể cập nhật store.json trên GitHub: ${err.message || putRes.statusText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi đồng bộ dữ liệu với GitHub" };
  }
}
