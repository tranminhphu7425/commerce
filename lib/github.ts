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
          message: "❌ Mã kết nối này chỉ có quyền ĐỌC (Read-only), thiếu quyền GHI (Write). Vui lòng cấp thêm quyền GHI khi tạo Mã kết nối!",
        };
      }
      return { success: true, message: "Kết nối và kích hoạt đồng bộ dữ liệu thành công!" };
    } else if (res.status === 401) {
      return { success: false, message: "Mã kết nối không hợp lệ hoặc đã hết hạn." };
    } else if (res.status === 404) {
      return { success: false, message: "Không tìm thấy máy chủ lưu trữ hoặc mã kết nối không có quyền truy cập." };
    } else {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.message || "Lỗi khi kiểm tra kết nối máy chủ." };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Không thể kết nối tới máy chủ lưu trữ." };
  }
}

/**
 * Upload an image file directly to GitHub repo: public/images/products/{filename}
 */
export async function uploadImageToGitHub(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const config = getGitHubConfig();
  if (!config || !config.token) {
    return { success: false, error: "Chưa cấu hình Mã liên kết" };
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
      return { success: false, error: errorData.message || "Lỗi khi tải ảnh lên máy chủ" };
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
    }).catch(() => { });

    // Relative image path for Next.js app
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/commerce";
    const imageUrl = `${basePath}/images/products/${filename}`;
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
    return { success: false, error: "Chưa cấu hình Mã liên kết" };
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
      },
    });

    if (!getRes.ok) {
      const err = await getRes.json().catch(() => ({}));
      return { success: false, error: `Không thể tải dữ liệu sản phẩm từ máy chủ: ${err.message || getRes.statusText}` };
    }

    const fileData = await getRes.json();
    const currentSha = fileData.sha;
    const currentJsonString = base64ToUtf8(fileData.content);
    const currentStore = JSON.parse(currentJsonString);

    // 2. Apply updates
    const updatedStore = updater(currentStore);
    const updatedJsonString = JSON.stringify(updatedStore, null, 2);
    const base64UpdatedContent = utf8ToBase64(updatedJsonString);

    // 3. Put updated store.json back to GitHub (data/store.json)
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
      return { success: false, error: `Không thể cập nhật dữ liệu sản phẩm lên máy chủ: ${err.message || putRes.statusText}` };
    }

    // 4. Helper to commit file to extra path (public/data/store.json and docs/data/store.json)
    const syncExtraPath = async (targetPath: string) => {
      try {
        const getExtraUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${targetPath}?ref=${branch}`;
        const extraRes = await fetch(getExtraUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `token ${config.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        let extraSha: string | undefined = undefined;
        if (extraRes.ok) {
          const extraData = await extraRes.json();
          extraSha = extraData.sha;
        }

        const putExtraUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${targetPath}`;
        await fetch(putExtraUrl, {
          method: "PUT",
          headers: {
            Authorization: `token ${config.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `${commitMessage} (sync ${targetPath})`,
            content: base64UpdatedContent,
            ...(extraSha ? { sha: extraSha } : {}),
            branch: branch,
          }),
        });
      } catch {
        // ignore background extra sync errors
      }
    };

    await syncExtraPath("public/data/store.json");
    await syncExtraPath("docs/data/store.json");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi đồng bộ dữ liệu với máy chủ" };
  }
}

export interface FileToCommit {
  path: string;
  content?: string; // Base64 encoded or UTF-8 text string (optional if isDelete is true)
  isBase64?: boolean;
  isDelete?: boolean;
}

/**
 * Commit multiple files (Add, Modify, Delete) in ONE SINGLE GIT COMMIT to GitHub
 * Prevents multiple GitHub Actions deployment triggers.
 */
export async function commitMultipleFilesToGitHub(
  files: FileToCommit[],
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const config = getGitHubConfig();
  if (!config || !config.token) {
    return { success: false, error: "Chưa cấu hình Mã liên kết" };
  }

  const { owner, repo, token, branch = "main" } = config;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  try {
    // 1. Get latest commit SHA on branch
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers, cache: "no-store" }
    );
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}));
      return { success: false, error: `Không thể kết nối nhánh máy chủ: ${err.message || refRes.statusText}` };
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get tree SHA of latest commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers, cache: "no-store" }
    );
    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}));
      return { success: false, error: `Không thể lấy thông tin phiên bản dữ liệu: ${err.message || commitRes.statusText}` };
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create Blobs for each file (or mark for deletion if isDelete is true)
    const treeItems: { path: string; mode: string; type: string; sha: string | null }[] = [];

    for (const file of files) {
      if (file.isDelete) {
        treeItems.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: null,
        });
        continue;
      }

      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: file.content || "",
            encoding: file.isBase64 ? "base64" : "utf-8",
          }),
        }
      );
      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}));
        return { success: false, error: `Lỗi đóng gói tệp tin ${file.path}: ${err.message || blobRes.statusText}` };
      }
      const blobData = await blobRes.json();

      treeItems.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      });
    }

    // 4. Create new Tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );
    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}));
      return { success: false, error: `Lỗi sắp xếp cấu trúc dữ liệu: ${err.message || treeRes.statusText}` };
    }
    const treeData = await treeRes.json();

    // 5. Create new Commit
    const newCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );
    if (!newCommitRes.ok) {
      const err = await newCommitRes.json().catch(() => ({}));
      return { success: false, error: `Lỗi tạo phiên bản dữ liệu mới: ${err.message || newCommitRes.statusText}` };
    }
    const newCommitData = await newCommitRes.json();

    // 6. Update reference (branch HEAD)
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: false,
        }),
      }
    );
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      return { success: false, error: `Lỗi cập nhật máy chủ: ${err.message || updateRefRes.statusText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi đồng bộ dữ liệu lên máy chủ" };
  }
}
