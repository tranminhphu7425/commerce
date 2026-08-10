"use client";

import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";

import ThemeToggle from "components/theme-toggle";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Menu } from "lib/local/types";
import Search, { SearchSkeleton } from "./search";

export default function MobileMenu({ menu }: { menu: Menu[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const openMobileMenu = () => setIsOpen(true);
  const closeMobileMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openMobileMenu}
        aria-label="Open mobile menu"
        className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors md:hidden dark:border-neutral-700 dark:text-white"
      >
        <Bars3Icon className="h-4" />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeMobileMenu} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-sm"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-sm"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-neutral-900/40" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 top-0 z-50 flex h-full w-[310px] max-w-[85vw] flex-col bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg border-r border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 overflow-y-auto">
              {/* Header inside drawer */}
              <div className="mb-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    onClick={closeMobileMenu}
                    aria-label="Close mobile menu"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Menu chính
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {/* Search input container */}
              <div className="mb-6 w-full">
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
              </div>

              {/* Navigation Menu Links */}
              {menu.length ? (
                <ul className="flex w-full flex-col gap-1.5">
                  {menu.map((item: Menu) => {
                    const isActive = pathname === item.path;
                    return (
                      <li key={item.title}>
                        <Link
                          href={item.path}
                          prefetch={true}
                          onClick={closeMobileMenu}
                          className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                            isActive
                              ? "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-500 font-bold border-l-4 border-orange-600 pl-3 shadow-sm"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          <span>{item.title}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className={`h-3.5 w-3.5 transition-transform ${
                              isActive
                                ? "text-orange-600 dark:text-orange-500 translate-x-0.5"
                                : "text-neutral-400 group-hover:translate-x-0.5"
                            }`}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
