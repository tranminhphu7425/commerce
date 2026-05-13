"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (!document.cookie.includes("welcome-toast=2")) {
      toast("🎣 Chào mừng bạn đến với Shop Đồ Câu!", {
        id: "welcome-toast",
        duration: Infinity,
        onDismiss: () => {
          document.cookie = "welcome-toast=2; max-age=31536000; path=/";
        },
        description: (
          <>
            Chúng tôi cung cấp đầy đủ các loại cần câu, máy câu, mồi lure và phụ kiện chính hãng Megabarra, CTF...{" "}
            <a
              href="/search"
              className="text-blue-600 hover:underline"
            >
              Khám phá ngay
            </a>
            .
          </>
        ),
      });
    }
  }, []);

  return null;
}
