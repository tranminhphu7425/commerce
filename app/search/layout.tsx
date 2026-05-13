import Footer from "components/layout/footer";
import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import { sorting } from "lib/constants";
import ChildrenWrapper from "./children-wrapper";
import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col gap-0 md:gap-8 px-4 pb-4 text-black md:flex-row dark:text-white">
        {/* Mobile Sticky Filters */}
        <div className="sticky top-[72px] z-20 -mx-4 mb-4 flex w-[calc(100%+2rem)] gap-2 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex-1">
            <Collections />
          </div>
          <div className="flex-1">
            <FilterList list={sorting} title="Sắp xếp" />
          </div>
        </div>

        {/* Desktop Sidebar (Left) */}
        <div className="hidden md:block flex-none md:max-w-[125px] py-5">
          <Collections />
        </div>

        {/* Product Grid */}
        <div className="min-h-screen w-full">
          <Suspense fallback={null}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
          </Suspense>
        </div>

        {/* Desktop Sidebar (Right) */}
        <div className="hidden md:block flex-none md:w-[125px] py-5">
          <FilterList list={sorting} title="Sắp xếp" />
        </div>
      </div>
      <Footer />
    </>
  );
}
