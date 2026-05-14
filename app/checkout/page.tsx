"use client";

import { useCart } from 'components/cart/cart-context';
import Price from 'components/price';
import { useCartStore } from 'lib/cart/store';
import { CONTACT_INFO } from 'lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  const { bankId: BANK_ID, accountNo: ACCOUNT_NO, accountName: ACCOUNT_NAME } = CONTACT_INFO;
  const TEMPLATE = "compact";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <h1 className="mb-4 text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
        <Link href="/" className="rounded-full bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  const orderId = `CTF${Math.floor(Date.now() / 1000)}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${cart.cost.totalAmount.amount}&addInfo=Thanh toan don hang ${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  const generateOrderMessage = () => {
    const itemsText = cart.lines
      .map((line) => {
        const unitPrice = parseFloat(line.cost.totalAmount.amount) / line.quantity;
        return `- ${line.merchandise.product.title} (${line.merchandise.title}): ${line.quantity} x ${formatCurrency(unitPrice.toString())}`;
      })
      .join('\n');

    return `📦 ĐƠN HÀNG MỚI: ${orderId}\n---------------------------\n👤 Khách hàng: ${formData.name}\n📞 Điện thoại: ${formData.phone}\n🏠 Địa chỉ: ${formData.address}\n📝 Ghi chú: ${formData.note || 'Không có'}\n---------------------------\n🛒 Chi tiết mặt hàng:\n${itemsText}\n---------------------------\n💰 Tổng cộng: ${formatCurrency(cart.cost.totalAmount.amount)}\n---------------------------\nVui lòng xác nhận đơn hàng giúp em nhé!`;
  };

  const handleSendViaZalo = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    const message = generateOrderMessage();
    
    // Ưu tiên dùng Web Share API trên di động
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Đơn hàng ${orderId}`,
          text: message,
        });
        toast.success('Đang mở bảng chia sẻ...');
        return;
      } catch (err) {
        console.log('User cancelled or share failed', err);
      }
    }

    // Fallback cho PC hoặc trình duyệt không hỗ trợ Share API
    navigator.clipboard.writeText(message);
    toast.success('Đã sao chép đơn hàng! Bạn hãy Dán (Paste) vào Zalo để gửi nhé.');
    
    setTimeout(() => {
      window.open(`https://zalo.me/${CONTACT_INFO.zalo}`, '_blank');
    }, 1200);
  };

  const handleSendViaMessenger = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    const message = generateOrderMessage();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Đơn hàng ${orderId}`,
          text: message,
        });
        toast.success('Đang mở bảng chia sẻ...');
        return;
      } catch (err) {
        console.log('Share failed', err);
      }
    }

    navigator.clipboard.writeText(message);
    toast.success('Đã sao chép đơn hàng! Bạn hãy Dán (Paste) vào Messenger để gửi nhé.');
    
    setTimeout(() => {
      window.open(`https://m.me/${CONTACT_INFO.messenger}`, '_blank');
    }, 1200);
  };

  const handleFinish = () => {
    clearCart();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">Thanh Toán Đơn Hàng</h1>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Form & QR */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Form */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600 dark:bg-orange-900/30">1</span>
              Thông tin giao hàng
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="0912 xxx xxx"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Địa chỉ giao hàng *</label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Ghi chú thêm</label>
                <textarea
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Payment QR Section */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600 dark:bg-orange-900/30">2</span>
              Thanh toán chuyển khoản
            </h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-xl border border-neutral-100 bg-white p-4 shadow-md dark:border-neutral-800">
                <img
                  src={qrUrl}
                  alt="VietQR Payment"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="rounded-xl bg-orange-50/50 p-4 dark:bg-orange-900/10">
                  <p className="text-xs text-orange-800 dark:text-orange-300 mb-1">Chủ tài khoản</p>
                  <p className="font-bold uppercase text-neutral-900 dark:text-white">{ACCOUNT_NAME}</p>
                </div>
                <div className="rounded-xl bg-orange-50/50 p-4 dark:bg-orange-900/10">
                  <p className="text-xs text-orange-800 dark:text-orange-300 mb-1">Nội dung chuyển khoản</p>
                  <p className="font-bold text-orange-600">{orderId}</p>
                </div>
                <p className="text-xs text-neutral-500 italic">
                  * Vui lòng điền đúng nội dung chuyển khoản để chúng tôi xác nhận đơn hàng nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-6 text-xl font-bold">Tóm tắt đơn hàng</h2>
            <div className="max-h-[40vh] overflow-auto pr-2 space-y-4 custom-scrollbar">
              {cart.lines.map((line) => (
                <div key={line.id} className="flex gap-4 border-b border-neutral-50 pb-4 last:border-0 dark:border-neutral-800">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
                    <Image
                      src={line.merchandise.product.featuredImage.url}
                      alt={line.merchandise.product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-tight truncate">{line.merchandise.product.title}</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {line.merchandise.title} x {line.quantity}
                    </p>
                    <Price
                      amount={line.cost.totalAmount.amount}
                      currencyCode={line.cost.totalAmount.currencyCode}
                      className="text-sm font-bold text-orange-600 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Tạm tính</span>
                <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Phí vận chuyển</span>
                <span className="text-green-500 font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between pt-2 text-xl font-bold text-neutral-900 dark:text-white">
                <span>Tổng cộng</span>
                <Price amount={cart.cost.totalAmount.amount} currencyCode={cart.cost.totalAmount.currencyCode} />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleSendViaZalo}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95"
              >
                <span className="italic font-black">Z</span> Gửi đơn qua Zalo
              </button>
              
              <button
                onClick={handleSendViaMessenger}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.912 1.452 5.513 3.717 7.21v3.532l3.359-1.844c.904.251 1.868.39 2.87.39 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.102 12.392l-2.454-2.624-4.793 2.624 5.271-5.603 2.51 2.624 4.737-2.624-5.271 5.603z" />
                </svg>
                Gửi qua Messenger
              </button>

              <button
                onClick={handleFinish}
                className="w-full py-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Hủy đơn và quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
