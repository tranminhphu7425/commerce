"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { CONTACT_INFO } from 'lib/constants';
import shopeeIcon from 'public/images/icons/shopee.jpg';
import tiktokIcon from 'public/images/icons/tiktokshop.jpg';
import zaloIcon from 'public/images/icons/zalo.jpg';
import messengerIcon from 'public/images/icons/messenger.png';

const ContactButtons = () => {
  const { phone: phoneNumber, zalo: zaloNumber, messenger: messengerId, shopee, tiktok } = CONTACT_INFO;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 animate-fadeIn items-end">
      {/* Danh sách các nút liên hệ (luôn hiển thị trên desktop >= 768px, ẩn/hiện trên mobile) */}
      <div className={`${isExpanded ? 'flex animate-in fade-in slide-in-from-bottom-5 duration-300' : 'hidden'} md:flex flex-col gap-4`}>
        {/* Nút Shopee */}
        {shopee && (
          <a
            href={shopee}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full overflow-hidden shadow-lg transition-all hover:scale-110 active:scale-95"
            title="Ghé gian hàng Shopee"
          >
            <Image
              src={shopeeIcon}
              alt="Shopee"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
            <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
              Shopee Shop
            </span>
          </a>
        )}

        {/* Nút TikTok Shop */}
        {tiktok && (
          <a
            href={tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full overflow-hidden shadow-lg transition-all hover:scale-110 active:scale-95"
            title="Ghé gian hàng TikTok Shop"
          >
            <Image
              src={tiktokIcon}
              alt="TikTok Shop"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
            <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
              TikTok Shop
            </span>
          </a>
        )}

        {/* Nút Gọi điện */}
        <a
          href={`tel:${phoneNumber}`}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-green-600 active:scale-95"
          title="Gọi điện hỗ trợ"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
          <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
            Gọi ngay: {phoneNumber}
          </span>
        </a>

        {/* Nút Zalo */}
        <a
          href={`https://zalo.me/${zaloNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full overflow-hidden shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Chat Zalo"
        >
          <Image
            src={zaloIcon}
            alt="Zalo"
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
          <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
            Chat Zalo
          </span>
        </a>

        {/* Nút Messenger */}
        <a
          href={`https://facebook.com/${messengerId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full overflow-hidden shadow-lg transition-all hover:scale-110 active:scale-95"
          title="Chat Facebook"
        >
          <Image
            src={messengerIcon}
            alt="Messenger"
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
          <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
            Messenger
          </span>
        </a>
      </div>

      {/* Nút Trigger thu gọn/mở rộng (chỉ xuất hiện trên thiết bị di động < 768px) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95 md:hidden z-10"
        title="Liên hệ với chúng tôi"
      >
        {isExpanded ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ContactButtons;
