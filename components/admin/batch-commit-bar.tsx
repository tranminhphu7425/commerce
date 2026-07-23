"use client";

import { useState, useEffect } from "react";
import {
  getPendingChangesCount,
  commitPendingChangesToGitHub,
  clearAllLocalOverridesAndPending,
} from "lib/local/client-store";
import { getGitHubConfig } from "lib/github";
import { toast } from "sonner";

export function BatchCommitBar() {
  const [counts, setCounts] = useState({
    products: 0,
    deleted: 0,
    images: 0,
    total: 0,
  });
  const [isCommitting, setIsCommitting] = useState(false);
  const [hasConfig, setHasConfig] = useState(true);

  const refreshCounts = () => {
    setCounts(getPendingChangesCount());
    const config = getGitHubConfig();
    setHasConfig(!!(config && config.token));
  };

  useEffect(() => {
    refreshCounts();

    const handleUpdate = () => refreshCounts();
    window.addEventListener("commerce-store-updated", handleUpdate);
    window.addEventListener("github-config-updated", handleUpdate);

    return () => {
      window.removeEventListener("commerce-store-updated", handleUpdate);
      window.removeEventListener("github-config-updated", handleUpdate);
    };
  }, []);

  const handleCommit = async () => {
    if (!hasConfig) {
      toast.error("Vui lòng cấu hình Mã liên kết trước khi lưu thay đổi!");
      return;
    }

    if (counts.total === 0) {
      toast.info("Không có thay đổi nào đang được lưu tạm.");
      return;
    }

    setIsCommitting(true);
    const toastId = toast.loading("Đang chuẩn bị dữ liệu và đồng bộ lên Server...");

    try {
      const res = await commitPendingChangesToGitHub();

      if (res.success) {
        toast.success(
          "🎉 Đã lưu thành công tất cả thay đổi! Hệ thống đang tự động cập nhật lại giao diện trang web.",
          { id: toastId, duration: 6000 }
        );
        refreshCounts();
      } else {
        toast.error(`❌ Lỗi cập nhật lên Server: ${res.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`❌ Lỗi kết nối: ${err.message || err}`, { id: toastId });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDiscard = () => {
    if (confirm("Bạn có chắc chắn muốn HỦY TẤT CẢ các thay đổi chưa lưu? Tất cả thông tin chỉnh sửa tạm thời sẽ bị khôi phục về trạng thái ban đầu.")) {
      clearAllLocalOverridesAndPending();
      toast.info("Đã hủy bỏ tất cả thay đổi lưu tạm.");
      refreshCounts();
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/40 dark:via-amber-950/20 dark:to-orange-950/40 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow">
            {counts.total > 0 ? "⚡" : "✓"}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base">
              {counts.total > 0
                ? "Có thay đổi chưa lưu lên website"
                : "Dữ liệu đã đồng bộ mới nhất"}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              {counts.total > 0 ? (
                <span>
                  Chi tiết:{" "}
                  {counts.products > 0 && (
                    <strong className="text-orange-700 dark:text-orange-300 font-semibold mr-2">
                      {counts.products} SP sửa/thêm
                    </strong>
                  )}
                  {counts.deleted > 0 && (
                    <strong className="text-red-700 dark:text-red-300 font-semibold mr-2">
                      {counts.deleted} SP bị xóa
                    </strong>
                  )}
                  {counts.images > 0 && (
                    <strong className="text-amber-700 dark:text-amber-300 font-semibold">
                      {counts.images} ảnh mới
                    </strong>
                  )}
                </span>
              ) : (
                "Tất cả sản phẩm và hình ảnh đã được cập nhật lên Server."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {counts.total > 0 && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isCommitting}
              className="px-3 py-2 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              ↺ Hủy lưu tạm
            </button>
          )}

          <button
            type="button"
            onClick={handleCommit}
            disabled={isCommitting || counts.total === 0 || !hasConfig}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm text-white shadow-md transition-all ${
              counts.total > 0 && hasConfig
                ? "bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-orange-600/20"
                : "bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed opacity-70"
            }`}
          >
            {isCommitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang lưu thay đổi...
              </>
            ) : (
              <>
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
