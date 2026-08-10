'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu as MenuType } from 'lib/local/types';
import CategoryDropdown from './category-dropdown';

export default function NavbarLinks({ menu }: { menu: MenuType[] }) {
  const pathname = usePathname();
  const isSearchActive = pathname === '/search';

  return (
    <ul className="hidden gap-6 text-sm md:flex md:items-center whitespace-nowrap">
      <li>
        <Link
          href="/search"
          prefetch={true}
          className={`underline-offset-4 hover:text-black dark:hover:text-white transition-all ${
            isSearchActive
              ? "text-orange-600 dark:text-orange-500 font-bold underline decoration-2 decoration-orange-600 underline-offset-8"
              : "text-neutral-700 dark:text-neutral-400"
          }`}
        >
          Tất cả sản phẩm
        </Link>
      </li>
      <li>
        <CategoryDropdown menu={menu.filter(item => item.path !== '/search')} />
      </li>
    </ul>
  );
}
