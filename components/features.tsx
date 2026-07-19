import { 
  ChatBubbleBottomCenterTextIcon, 
  CheckBadgeIcon, 
  ShieldCheckIcon, 
  TruckIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Hàng Chính Hãng',
    description: 'Cam kết 100% sản phẩm từ Megabarra, BKK, Mekong Pride...',
    icon: CheckBadgeIcon,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    name: 'Tư Vấn Chuyên Sâu',
    description: 'Đội ngũ cần thủ giàu kinh nghiệm hỗ trợ chọn đồ phù hợp.',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  {
    name: 'Giao Hàng Nhanh',
    description: 'Đóng gói cẩn thận, giao hàng hỏa tốc toàn quốc.',
    icon: TruckIcon,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    name: 'Bảo Hành Uy Tín',
    description: 'Chính sách bảo hành ngọn, máy câu theo tiêu chuẩn hãng.',
    icon: ShieldCheckIcon,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  }
];

const Features = () => {
  return (
    <div className="bg-neutral-50 py-16 dark:bg-neutral-900/50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div 
              key={feature.name} 
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg}`}>
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
