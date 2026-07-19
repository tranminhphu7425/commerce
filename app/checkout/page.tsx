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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    if (step === 3) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold">Đặt hàng thành công!</h1>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400 max-w-md">
            Cảm ơn bạn đã mua sắm tại {CONTACT_INFO.name}. Chúng tôi đã nhận được thông tin thanh toán và sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
          </p>
          <Link href="/" className="rounded-full bg-orange-600 px-8 py-3 font-bold text-white transition-colors hover:bg-orange-700">
            Tiếp tục mua sắm
          </Link>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <h1 className="mb-4 text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
        <Link href="/" className="rounded-full bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  // Generate a random order ID that persists during the session
  const orderId = `CTF${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${cart.cost.totalAmount.amount}&addInfo=Thanh toan don hang ${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  const isFormValid = formData.name.trim() !== '' && formData.phone.trim() !== '' && formData.address.trim() !== '';

  const generateOrderMessage = (html: boolean = false) => {
    const itemsText = cart.lines
      .map((line) => {
        const unitPrice = parseFloat(line.cost.totalAmount.amount) / line.quantity;
        if (html) {
          return `🔹 <b>${line.merchandise.product.title}</b> (${line.merchandise.title}): ${line.quantity} x ${formatCurrency(unitPrice.toString())}`;
        }
        return `- ${line.merchandise.product.title} (${line.merchandise.title}): ${line.quantity} x ${formatCurrency(unitPrice.toString())}`;
      })
      .join('\n');

    if (html) {
      return `📦 <b>ĐƠN HÀNG MỚI: ${orderId}</b>\n` +
             `---------------------------\n` +
             `👤 <b>Khách hàng:</b> ${formData.name}\n` +
             `📞 <b>Điện thoại:</b> ${formData.phone}\n` +
             `🏠 <b>Địa chỉ:</b> ${formData.address}\n` +
             `📝 <b>Ghi chú:</b> ${formData.note || 'Không có'}\n` +
             `---------------------------\n` +
             `🛒 <b>Chi tiết mặt hàng:</b>\n${itemsText}\n` +
             `---------------------------\n` +
             `💰 <b>Tổng cộng: ${formatCurrency(cart.cost.totalAmount.amount)}</b>`;
    }

    return `📦 ĐƠN HÀNG MỚI: ${orderId}\n---------------------------\n👤 Khách hàng: ${formData.name}\n📞 Điện thoại: ${formData.phone}\n🏠 Địa chỉ: ${formData.address}\n📝 Ghi chú: ${formData.note || 'Không có'}\n---------------------------\n🛒 Chi tiết mặt hàng:\n${itemsText}\n---------------------------\n💰 Tổng cộng: ${formatCurrency(cart.cost.totalAmount.amount)}\n---------------------------\nVui lòng xác nhận đơn hàng giúp em nhé!`;
  };

  const handleNextStep = () => {
    if (!isFormValid) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng bắt buộc');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompletePayment = async () => {
    setIsSubmitting(true);
    
    try {
      const telegramToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
      const telegramChatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

      // Send to Telegram if configured
      if (telegramToken && telegramChatId) {
        const message = generateOrderMessage(true);
        const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
        
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });
      }

      toast.success('Thanh toán thành công!');
      clearCart();
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Có lỗi xảy ra khi hoàn tất đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    clearCart();
    router.push('/');
  };

  // Render Step 3 (Success) directly
  if (step === 3) {
    return null; // Will trigger the empty cart + step 3 condition at the top
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Thanh Toán</h1>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>1</span>
          <span className={`h-1 w-8 rounded ${step >= 2 ? 'bg-orange-600' : 'bg-neutral-200'}`}></span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>2</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Form & QR */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Step 1: Customer Form */}
          <div className={`rounded-2xl border ${step === 1 ? 'border-orange-500 ring-1 ring-orange-500' : 'border-neutral-200 opacity-60'} bg-white p-8 shadow-sm transition-all dark:bg-neutral-900 dark:border-neutral-800`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Thông tin giao hàng
              </h2>
              {step === 2 && (
                <button onClick={() => setStep(1)} className="text-sm font-medium text-orange-600 hover:underline">Sửa</button>
              )}
            </div>
            
            {step === 1 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-500">
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
                    onChange={(e) => {
                      // Only allow digits, spaces, and plus signs
                      const sanitizedValue = e.target.value.replace(/[^\d\s+]/g, '');
                      setFormData({...formData, phone: sanitizedValue});
                    }}
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
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                <div><span className="font-medium text-neutral-900 dark:text-neutral-200">Người nhận:</span> {formData.name}</div>
                <div><span className="font-medium text-neutral-900 dark:text-neutral-200">SĐT:</span> {formData.phone}</div>
                <div className="col-span-2"><span className="font-medium text-neutral-900 dark:text-neutral-200">Địa chỉ:</span> {formData.address}</div>
              </div>
            )}
          </div>

          {/* Step 2: Payment QR Section */}
          {step === 2 && (
            <div className="rounded-2xl border border-orange-500 ring-1 ring-orange-500 bg-white p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 dark:bg-neutral-900 dark:border-neutral-800">
              <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
                Quét mã để thanh toán
              </h2>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="relative aspect-square w-full max-w-full md:max-w-[350px] overflow-hidden rounded-xl border border-neutral-100 bg-white p-2 shadow-md dark:border-neutral-800">
                  <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="rounded-xl bg-orange-50/50 p-4 dark:bg-orange-900/10">
                    <p className="text-xs text-orange-800 dark:text-orange-300 mb-1">Số tiền thanh toán</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(cart.cost.totalAmount.amount)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                    <p className="text-xs text-neutral-700 mb-1">Chủ tài khoản</p>
                    <p className="font-bold uppercase text-neutral-900 dark:text-white">{ACCOUNT_NAME}</p>
                    <p className="text-sm mt-1">{BANK_ID} - {ACCOUNT_NO}</p>
                  </div>
                  <div className="rounded-xl bg-orange-50/50 p-4 dark:bg-orange-900/10">
                    <p className="text-xs text-orange-800 dark:text-orange-300 mb-1">Nội dung chuyển khoản (bắt buộc)</p>
                    <p className="font-bold text-orange-600">{orderId}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                    <p className="text-xs text-neutral-700 mt-1">
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
                <span className="text-neutral-700">Tạm tính</span>
                <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-700">Phí vận chuyển</span>
                <span className="text-green-500 font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between pt-2 text-xl font-bold text-neutral-900 dark:text-white">
                <span>Tổng cộng</span>
                <Price amount={cart.cost.totalAmount.amount} currencyCode={cart.cost.totalAmount.currencyCode} />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {step === 1 ? (
                <button
                  onClick={handleNextStep}
                  disabled={!isFormValid}
                  className={`w-full rounded-full py-4 text-sm font-bold text-white shadow-md transition-all ${
                    isFormValid 
                      ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-95' 
                      : 'bg-neutral-300 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500'
                  }`}
                >
                  Tiếp tục thanh toán
                </button>
              ) : (
                <button
                  onClick={handleCompletePayment}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Tôi đã chuyển khoản thành công
                </button>
              )}

              <button
                onClick={handleCancel}
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
