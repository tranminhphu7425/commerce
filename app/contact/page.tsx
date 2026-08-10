"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { CONTACT_INFO } from "lib/constants";
import Image from "next/image";

// Import local icons if needed or use direct icon renderers
import shopeeIcon from "public/images/icons/shopee.jpg";
import tiktokIcon from "public/images/icons/tiktokshop.jpg";
import zaloIcon from "public/images/icons/zalo.jpg";
import messengerIcon from "public/images/icons/messenger.png";

export default function ContactPage() {
  const {
    phone,
    zalo,
    messenger,
    shopee,
    tiktok,
    bankId,
    accountNo,
    accountName,
    name,
  } = CONTACT_INFO;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error("Vui lòng điền đầy đủ tất cả thông tin!");
      return;
    }

    setIsSubmitting(true);

    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Gửi lời nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.");
      setFormData({ name: "", phone: "", message: "" });
    }, 1200);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    toast.success("Đã sao chép số tài khoản ngân hàng!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 animate-fadeIn">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
          Liên hệ với chúng tôi
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-500 dark:text-neutral-400">
          Có câu hỏi hoặc cần hỗ trợ về sản phẩm? Hãy gửi tin nhắn hoặc kết nối với chúng tôi qua các kênh liên lạc dưới đây.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Contact Cards & Bank Info */}
        <div className="space-y-6 lg:col-span-5">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              {name}
            </h2>
            
            <div className="space-y-4">
              {/* Call Hotline */}
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-medium">Hotline gọi trực tiếp</div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-green-600 transition-colors">
                    {phone}
                  </div>
                </div>
              </a>

              {/* Zalo */}
              <a
                href={`https://zalo.me/${zalo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800">
                  <Image src={zaloIcon} alt="Zalo" width={44} height={44} className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-medium">Hỗ trợ nhanh qua Zalo</div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-orange-600 transition-colors">
                    Chat Zalo: {zalo}
                  </div>
                </div>
              </a>

              {/* Messenger */}
              <a
                href={`https://facebook.com/${messenger}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800">
                  <Image src={messengerIcon} alt="Messenger" width={44} height={44} className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 font-medium">Facebook Messenger</div>
                  <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 transition-colors">
                    Facebook.com/{messenger}
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Social Platforms Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Gian hàng liên kết
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {shopee && (
                <a
                  href={shopee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-orange-500 hover:bg-orange-500/5 dark:hover:bg-orange-500/10 transition-all text-center group"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden mb-2 shadow-sm">
                    <Image src={shopeeIcon} alt="Shopee" width={48} height={48} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-orange-500">
                    Shopee Shop
                  </span>
                </a>
              )}
              {tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white hover:bg-neutral-900/5 dark:hover:bg-white/10 transition-all text-center group"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden mb-2 shadow-sm">
                    <Image src={tiktokIcon} alt="TikTok" width={48} height={48} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white">
                    TikTok Shop
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Message Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 md:p-8">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
              Gửi lời nhắn cho chúng tôi
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Fullname */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Họ và tên của bạn *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-sm text-neutral-900 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Phone number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-sm text-neutral-900 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  Lời nhắn / Nội dung cần hỗ trợ *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung lời nhắn..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-sm text-neutral-900 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 shadow-lg shadow-orange-600/10 active:scale-98 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Gửi lời nhắn
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
