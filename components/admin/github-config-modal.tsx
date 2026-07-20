"use client";

import { clearGitHubConfig, getGitHubConfig, GitHubConfig, saveGitHubConfig, testGitHubConnection } from "lib/github";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function GitHubStatusButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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
    const syncConfig = () => {
      const current = getGitHubConfig();
      setActiveConfig(current);
      if (current) setConfig(current);
      else setConfig({ owner: "tranminhphu7425", repo: "commerce", branch: "main", token: "" });
    };
    syncConfig();
    window.addEventListener("github-config-updated", syncConfig);
    return () => window.removeEventListener("github-config-updated", syncConfig);
  }, []);

  const handleDisconnect = () => {
    if (confirm("Bạn có chắc muốn hủy liên kết không?")) {
      clearGitHubConfig();
      setActiveConfig(null);
      setConfig({ owner: "tranminhphu7425", repo: "commerce", branch: "main", token: "" });
      setStatusMessage(null);
      setIsOpen(false);
    }
  };

  // Only display GitHubStatusButton on Admin pages (/admin, /admin/products/new, etc.)
  if (!pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={activeConfig ? "Trạng thái: Đã liên kết" : "Trạng thái: Chưa liên kết"}
        className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-white dark:hover:bg-neutral-800"
      >
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>

        {/* Status Indicator Dot */}
        <span className={`absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900 ${activeConfig ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
      </button>

      {/* Minimal Popover Modal */}
      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5 mb-3">
            <span className="font-bold text-xs text-neutral-900 dark:text-white">Trạng thái liên kết</span>
            <button onClick={() => setIsOpen(false)} className="text-xs text-neutral-400 hover:text-black dark:hover:text-white">✕</button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${activeConfig ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
              <div className="text-xs">
                {activeConfig ? (
                  <div>
                    <span className="font-bold text-green-700 dark:text-green-400">Đã liên kết thành công</span>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Tự động đồng bộ dữ liệu sản phẩm & hình ảnh</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-amber-700 dark:text-amber-400">Chưa liên kết</span>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Vào trang Quản trị để nhập mã liên kết</p>
                  </div>
                )}
              </div>
            </div>

            {activeConfig && (
              <div className="pt-0 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={handleDisconnect}
                  className="w-full py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 transition-colors"
                >
                  Hủy liên kết
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function GitHubConfigModal() {
  const [isOpen, setIsOpen] = useState(false);
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
    const syncConfig = () => {
      const current = getGitHubConfig();
      setActiveConfig(current);
      if (current) setConfig(current);
      else setConfig({ owner: "tranminhphu7425", repo: "commerce", branch: "main", token: "" });
    };
    syncConfig();
    window.addEventListener("github-config-updated", syncConfig);
    return () => window.removeEventListener("github-config-updated", syncConfig);
  }, []);

  const handleTest = async () => {
    if (!config.token.trim()) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập Mã liên kết!" });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ type: "info", text: "Đang kiểm tra mã liên kết..." });

    const res = await testGitHubConnection(config);
    setIsTesting(false);
    if (res.success) {
      setStatusMessage({ type: "success", text: "Mã hợp lệ! Kết nối thành công." });
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const handleSave = async () => {
    if (!config.token.trim()) {
      setStatusMessage({ type: "error", text: "Vui lòng nhập Mã liên kết trước khi lưu!" });
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
    setStatusMessage({ type: "success", text: "Đã liên kết thành công!" });
    setTimeout(() => {
      setIsOpen(false);
    }, 1200);
  };

  // If already connected and form is not manually opened, hide the large card on /admin!
  if (activeConfig && !isOpen) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white ${activeConfig ? "bg-green-600" : "bg-neutral-500"}`}>
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Liên kết với hệ thống để cập nhật thông tin sản phẩm</h3>
              {activeConfig ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  🟢 Đã liên kết
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  🟡 Chưa liên kết
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-400 mt-0.5">
              {activeConfig
                ? "Mọi sản phẩm và hình ảnh mới sẽ được tự động lưu trực tiếp lên trang web của bạn!"
                : "Dán mã liên kết để cập nhật sản phẩm lên trang web."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            {activeConfig ? "Mã liên kết" : "Liên kết dữ liệu"}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      {isOpen && (
        <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="mb-4">
            <label className="text-xs font-bold block mb-1">Mã liên kết tài khoản *</label>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="Dán mã liên kết vào đây..."
            />
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-lg text-xs font-semibold ${statusMessage.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300" :
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
              🔍 Kiểm tra mã
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
