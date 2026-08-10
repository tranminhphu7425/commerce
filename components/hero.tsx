import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <div className="relative h-[55vh] sm:h-[65vh] md:h-[80vh] lg:h-[90vh] w-full overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
      {/* Background Image with Overlay */}
      <Image
        src="/commerce/images/banner/hero.png"
        alt="Chí Toàn Fishing Hero"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      
      {/* Content */}
      <div className="relative flex h-full items-center px-4 md:px-12 lg:px-24">
        <div className="max-w-2xl text-white">
          

          <span className="mb-3 inline-block rounded-full bg-orange-600 px-4 py-1 text-xs sm:text-sm font-bold tracking-wider uppercase">
            Chính Hãng & Uy Tín
          </span>
          <h1 className="mb-4 text-3xl font-extrabold leading-tight sm:text-4xl md:text-6xl lg:text-7xl">
            Nâng Tầm Trải Nghiệm <br />
            <span className="text-orange-500">Câu Cá Của Bạn</span>
          </h1>
          <p className="mb-6 md:mb-10 text-sm sm:text-lg text-neutral-300 md:text-xl">
            Khám phá bộ sưu tập đồ câu chuyên nghiệp từ các thương hiệu hàng đầu thế giới. 
            Đồng hành cùng bạn trong mọi chuyến săn hàng.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/search"
              className="rounded-full bg-white px-6 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-bold text-black transition-all hover:bg-orange-500 hover:text-white"
            >
              Mua Ngay
            </Link>
            <Link
              href="/search/moi-cau"
              className="rounded-full border border-white/50 bg-white/10 px-6 py-3 sm:px-8 sm:py-4 text-xs sm:text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              Xem Mồi Câu
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Wave */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block h-[50px] w-full fill-white dark:fill-black"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58.47,112.49,123.89,109.25,182.23,94.1,241.92,78.53,289.72,65.62,321.39,56.44Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default Hero;
