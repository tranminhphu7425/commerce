import CartModal from "components/cart/modal";
import LogoSquare from "components/logo-square";
import ThemeToggle from "components/theme-toggle";
import { GitHubStatusButton, ReturnToAdminButton } from "components/admin/github-config-modal";
import { getMenu } from "lib/local";
import { Menu } from "lib/local/types";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import NavbarLinks from "./navbar-links";
import Search, { SearchSkeleton } from "./search";

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = await getMenu("next-js-frontend-header-menu");

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 p-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
        <div className="flex w-full items-center justify-between gap-4 md:gap-6">
          <div className="flex w-full md:w-1/3">
            <Link
              href="/"
              prefetch={true}
              className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6 transition-transform hover:scale-102"
            >
              <LogoSquare />
              <div className="ml-2.5 flex-none text-sm font-bold uppercase tracking-wider text-black dark:text-white md:hidden lg:block">
                {SITE_NAME}
              </div>
            </Link>
            {menu.length ? <NavbarLinks menu={menu} /> : null}
          </div>
          <div className="hidden justify-center md:flex md:w-1/3">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>
          <div className="flex items-center justify-end gap-2 md:w-1/3">
            <ReturnToAdminButton />
            <GitHubStatusButton />
            <ThemeToggle />
            <CartModal />
          </div>
        </div>
      </div>
    </nav>
  );
}

