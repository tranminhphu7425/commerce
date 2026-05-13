import React from 'react';

const ContactButtons = () => {
  const phoneNumber = "0123456789"; // Thay bằng số điện thoại của bạn
  const zaloNumber = "0123456789"; // Thay bằng số Zalo của bạn
  const messengerId = "vinh.le.315"; // Thay bằng ID Facebook Messenger của bạn

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 animate-fadeIn">
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
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-orange-600 active:scale-95"
        title="Chat Zalo"
      >
        <span className="text-xl font-bold italic">Z</span>
        <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
          Chat Zalo
        </span>
      </a>

      {/* Nút Messenger */}
      <a
        href={`https://m.me/${messengerId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 via-purple-500 to-pink-500 text-white shadow-lg transition-all hover:scale-110 active:scale-95"
        title="Chat Facebook"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="h-8 w-8"
        >
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.912 1.452 5.513 3.717 7.21v3.532l3.359-1.844c.904.251 1.868.39 2.87.39 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.102 12.392l-2.454-2.624-4.793 2.624 5.271-5.603 2.51 2.624 4.737-2.624-5.271 5.603z" />
        </svg>
        <span className="absolute right-16 scale-0 rounded bg-black px-2 py-1 text-xs text-white transition-all group-hover:scale-100 whitespace-nowrap">
          Messenger
        </span>
      </a>
    </div>
  );
};

export default ContactButtons;
