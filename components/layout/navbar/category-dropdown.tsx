'use client';

import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu as MenuType } from 'lib/local/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

export default function CategoryDropdown({ menu }: { menu: MenuType[] }) {
  const pathname = usePathname();
  const isDropdownActive = menu.some(item => pathname === item.path);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className={`inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:text-black dark:hover:text-white transition-all ${
          isDropdownActive
            ? "text-orange-600 dark:text-orange-500 font-bold underline decoration-2 decoration-orange-600 underline-offset-8"
            : "text-neutral-700 dark:text-neutral-400"
        }`}>
          Danh mục sản phẩm
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 mt-2 w-40 origin-top-left divide-y divide-neutral-100 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:divide-neutral-800 dark:bg-neutral-900 dark:ring-neutral-700 z-50 p-1 border border-neutral-100 dark:border-neutral-800">
          <div className="px-1 py-1 space-y-0.5">
            {menu.map((item) => {
              const isItemActive = pathname === item.path;
              return (
                <Menu.Item key={item.path}>
                  {({ active }) => (
                    <Link
                      href={item.path}
                      className={`${
                        isItemActive
                          ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500 font-semibold'
                          : active
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                            : 'text-neutral-700 dark:text-neutral-300'
                      } group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all`}
                    >
                      <span>{item.title}</span>
                      
                    </Link>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
