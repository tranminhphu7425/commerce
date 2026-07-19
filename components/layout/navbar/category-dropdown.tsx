'use client';

import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Menu as MenuType } from 'lib/local/types';
import Link from 'next/link';
import { Fragment } from 'react';

export default function CategoryDropdown({ menu }: { menu: MenuType[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300">
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
        <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-neutral-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:divide-neutral-800 dark:bg-neutral-900 dark:ring-neutral-700 z-50">
          <div className="px-1 py-1">
            {menu.map((item) => (
              <Menu.Item key={item.path}>
                {({ active }) => (
                  <Link
                    href={item.path}
                    className={`${
                      active ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    {item.title}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
