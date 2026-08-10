import Link from "next/link";
import Image from "next/image";

import FooterMenu from "components/layout/footer-menu";
import LogoSquare from "components/logo-square";
import { getMenu } from "lib/local";
import { Suspense } from "react";
import { CONTACT_INFO } from "lib/constants";

import shopeeIcon from "public/images/icons/shopee.jpg";
import tiktokIcon from "public/images/icons/tiktokshop.jpg";
import zaloIcon from "public/images/icons/zalo.jpg";


const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700";
  const menu = await getMenu("next-js-frontend-footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";
  const { phone: phoneNumber, zalo: zaloNumber, messenger: messengerId, shopee, tiktok } = CONTACT_INFO;

  return (
    <footer className="text-sm text-neutral-700 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/20 border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 py-12 text-sm sm:grid-cols-2 md:grid-cols-12 md:px-4 min-[1320px]:px-0">
        {/* Column 1: Brand Info (Spans 4 columns) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <Link
            className="flex items-center gap-2.5 text-black dark:text-white"
            href="/"
          >
            <LogoSquare size="sm" />
            <span className="font-bold uppercase tracking-wider text-sm">{SITE_NAME}</span>
          </Link>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm">
            Chí Toàn Fishing Shop - Điểm đến tin cậy của các cần thủ chuyên nghiệp. Chuyên cung cấp cần câu, máy câu, mồi lure và phụ kiện câu cá chất lượng cao từ các thương hiệu hàng đầu thế giới.
          </p>
        </div>

        {/* Column 2: Navigation Links (Spans 3 columns) */}
        <div className="md:col-span-3 flex flex-col gap-3.5">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Khám phá
          </span>
          <Suspense
            fallback={
              <div className="flex w-[200px] flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
        </div>

        {/* Column 3: Contact Details (Spans 5 columns) */}
        <div className="md:col-span-5 flex flex-col gap-3.5">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Thông tin liên hệ
          </span>
          <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
            {/* Hotline */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-3 w-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
              </div>
              <span>Hotline: <a href={`tel:${phoneNumber}`} className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 transition-colors">{phoneNumber}</a></span>
            </div>

            {/* Zalo */}
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 overflow-hidden rounded-full shadow-sm flex-none">
                <Image
                  src={zaloIcon}
                  alt="Zalo"
                  width={20}
                  height={20}
                  className="h-full w-full object-cover"
                />
              </div>
              <span>Zalo: <a href={`https://zalo.me/${zaloNumber}`} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 transition-colors">{zaloNumber}</a></span>
            </div>

            {/* Messenger / Facebook */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm flex-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span>Facebook: <a href={`https://facebook.com/${messengerId}`} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 transition-colors">Chí Toàn Fishing</a></span>
            </div>

            {/* Shopee Shop */}
            {shopee && (
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 overflow-hidden rounded-full shadow-sm flex-none">
                  <Image
                    src={shopeeIcon}
                    alt="Shopee"
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span>Shopee: <a href={shopee} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 transition-colors">Chí Toàn Fishing Shop</a></span>
              </div>
            )}

            {/* TikTok Shop */}
            {tiktok && (
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 overflow-hidden rounded-full shadow-sm flex-none">
                  <Image
                    src={tiktokIcon}
                    alt="TikTok Shop"
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span>TikTok Shop: <a href={tiktok} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-orange-600 transition-colors">@chi_toan_fishing_</a></span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Copyright Bar */}
      <div className="border-t border-neutral-200 py-6 text-xs dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:gap-0 md:px-4 min-[1320px]:px-0">
          <p className="text-neutral-500 dark:text-neutral-500">
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".")
              ? "."
              : ""}{" "}
            Bản quyền đã được bảo lưu.
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600">
            Thực hiện bởi Chí Toàn Fishing.
          </p>
        </div>
      </div>
    </footer>
  );
}
