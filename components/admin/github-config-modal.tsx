"use client";

import { useState, useEffect } from "react";
import { getGitHubConfig, saveGitHubConfig, clearGitHubConfig, testGitHubConnection, GitHubConfig } from "lib/github";

export function GitHubConfigModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [config, setConfig] = useState<GitHubConfig>({
    owner: "tranminhphu7425",
    repo: "commerce",
    branch: "main",
    token: "",
  });

  const [activeConfig, setActiveConfig] = useState<GitHubConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const current = getGitHubConfig();
    if (current) {
      setActiveConfig(current);
      setConfig(current);
    }
  }, []);

  const handleTest = async () => {
    if (!config.token.trim()) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập GitHub Personal Access Token!" });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ type: "info", text: "Đang kiểm tra kết nối tới GitHub..." });

    const res = await testGitHubConnection(config);
    setIsTesting(false);
    if (res.success) {
      setStatusMessage({ type: "success", text: res.message });
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const handleSave = async () => {
    if (!config.token.trim()) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập Token trước khi lưu!" });
      return;
    }

    setIsTesting(true);
    const res = await testGitHubConnection(config);
    setIsTesting(false);

    if (!res.success) {
      setStatusMessage({ type: "error", text: `Không thể lưu: ${res.message}` });
      return;
    }

    saveGitHubConfig(config);
    setActiveConfig(config);
    setStatusMessage({ type: "success", text: "Đã lưu cấu hình kết nối GitHub thành công!" });
    setTimeout(() => {
      setIsOpen(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    if (confirm("Bạn có chắc muốn hủy kết nối GitHub trên trình duyệt này?")) {
      clearGitHubConfig();
      setActiveConfig(null);
      setConfig({ owner: "tranminhphu7425", repo: "commerce", branch: "main", token: "" });
      setStatusMessage(null);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white ${activeConfig ? "bg-green-600" : "bg-neutral-500"}`}>
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Tự động đồng bộ với GitHub</h3>
              {activeConfig ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  🟢 Đã kết nối ({activeConfig.owner}/{activeConfig.repo})
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  🟡 Lưu cục bộ (Chưa dán GitHub Token)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-0.5">
              {activeConfig
                ? "Mọi thay đổi sản phẩm & tải ảnh từ trang này sẽ được tự động commit trực tiếp lên GitHub Repository!"
                : "Nhập GitHub Access Token để mọi chỉnh sửa sản phẩm tự động cập nhật lên GitHub mà không cần server."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeConfig && (
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-600 hover:underline px-3 py-2"
            >
              Hủy kết nối
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            {activeConfig ? "Cấu hình GitHub" : "Kết nối GitHub"}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      {isOpen && (
        <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold block mb-1">GitHub Username/Org *</label>
              <input
                type="text"
                value={config.owner}
                onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                placeholder="tranminhphu7425"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Tên Repository *</label>
              <input
                type="text"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                placeholder="commerce"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Nhánh (Branch)</label>
              <input
                type="text"
                value={config.branch}
                onChange={(e) => setConfig({ ...config, branch: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                placeholder="main"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold block">GitHub Personal Access Token (PAT) *</label>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-orange-600 hover:underline font-semibold flex items-center gap-1"
              >
                📖 {showInstructions ? "Ẩn hướng dẫn tạo Token" : "Cách lấy Token (Xem chi tiết)"}
              </button>
            </div>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="github_pat_... hoặc ghp_..."
            />
          </div>

          {/* Instructions drawer */}
          {showInstructions && (
            <div className="mb-6 rounded-xl bg-orange-50 dark:bg-orange-950/30 p-4 border border-orange-200 dark:border-orange-900 text-xs text-neutral-800 dark:text-orange-200 space-y-3">
              <p className="font-bold text-sm text-orange-900 dark:text-orange-300">📌 Hướng dẫn tạo Token có quyền ĐĂNG/SỬA SẢN PHẨM (Chỉ cần tạo 1 lần):</p>
              
              <div className="space-y-2">
                <p className="font-bold text-orange-800 dark:text-orange-300">👉 Cách 1: Dùng Classic Token (Dễ nhất - Khuyên dùng):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Truy cập link: <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">github.com/settings/tokens/new (Tokens Classic)</a>.</li>
                  <li>Đặt Note: <code>Commerce Admin</code>.</li>
                  <li>Tick chọn duy nhất 1 ô: <strong>repo</strong> (Full control of private repositories).</li>
                  <li>Cuối trang bấm <strong>Generate token</strong> -&gt; Sao chép mã <code>ghp_...</code> dán vào đây.</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2 border-t border-orange-200/60 dark:border-orange-900/60">
                <p className="font-bold text-orange-800 dark:text-orange-300">👉 Cách 2: Dùng Fine-grained Token (Cấu hình quyền chi tiết):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Truy cập link: <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer" className="text-orange-600 underline font-bold">github.com/settings/tokens (Fine-grained)</a>.</li>
                  <li>Mục <strong>Repository access</strong>: Chọn <strong>Only select repositories</strong> -&gt; Chọn repo <code>{config.repo || "commerce"}</code>.</li>
                  <li>Mục <strong>Permissions</strong> -&gt; <strong>Repository permissions</strong> -&gt; Tìm <strong>Contents</strong> và bắt buộc chọn <strong>Access: Read and write</strong> (Nếu chỉ chọn Read-only sẽ bị lỗi Resource not accessible).</li>
                  <li>Bấm <strong>Generate token</strong> -&gt; Sao chép mã <code>github_pat_...</code> dán vào đây.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-lg text-xs font-semibold ${
              statusMessage.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300" :
              statusMessage.type === "error" ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300" :
              "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              🔍 Kiểm tra kết nối
            </button>
            <button
              type="button"
              disabled={isTesting}
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isTesting ? "Đang xử lý..." : "💾 Lưu & Kích hoạt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
