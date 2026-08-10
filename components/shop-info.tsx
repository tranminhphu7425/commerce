import Image from 'next/image';

const ShopInfo = ({ totalProducts = 47 }: { totalProducts?: number }) => {
  const shopData = {
    shop_name: "Chí Toàn Fishing Shop",
    shop_url: "/shopdocauchitoanfishing",
    avatar: "https://down-bs-vn.img.susercontent.com/vn-11134216-81ztc-mnh0zou8j09466_tn.webp",
    cover_image: "https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/shopmicrofe/dc2a8ae5803b2531c9a5.jpg",
    status: "Online 28 phút trước",
    total_products: totalProducts,
    followers: 299,
    following: 15,
    rating: 4.7,
    total_reviews: 260,
    chat_response_rate: "80%",
    joined: "12 tháng trước",
    cancel_rate: "3%",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Shop Description Section */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex-1">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-white">Giới thiệu cửa hàng</h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Chào mừng bạn đến với <strong className="text-neutral-900 dark:text-white">Chí Toàn Fishing Shop</strong> - điểm đến hàng đầu cho những tâm hồn đam mê nghệ thuật câu cá. 
              Chúng tôi tự hào là đơn vị chuyên cung cấp các dòng sản phẩm đồ câu chính hãng, từ những chiếc cần câu lure nhạy bén, máy câu kháng mặn bền bỉ cho đến các loại mồi thủ công tinh xảo. 
              Với mong muốn đồng hành cùng các cần thủ trong mọi chuyến đi, chúng tôi cam kết mang đến những trang thiết bị chất lượng nhất, được tuyển chọn kỹ lưỡng từ các thương hiệu uy tín.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 border-t border-neutral-100 pt-6 md:w-64 md:border-l md:border-t-0 md:pl-8 md:pt-0 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Đánh giá Shop</span>
              <span className="font-semibold text-orange-500">{shopData.rating} / 5.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Sản phẩm</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{shopData.total_products}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Người theo dõi</span>
              <span className="font-semibold text-neutral-900 dark:text-white">{shopData.followers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">Phản hồi Chat</span>
              <span className="font-semibold text-green-500">{shopData.chat_response_rate}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800">
          <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10 dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/30">
            Hàng chính hãng 100%
          </span>
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10 dark:bg-green-400/10 dark:text-green-300 dark:ring-green-400/30">
            Hỗ trợ 24/7
          </span>
          <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30">
            Giao hàng toàn quốc
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShopInfo;
