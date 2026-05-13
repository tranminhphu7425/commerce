"use client";

import { useCart } from 'components/cart/cart-context';
import Price from 'components/price';
import { useCartStore } from 'lib/cart/store';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const { cart } = useCart();
  const { clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  // Shop bank info from environment variables
  const BANK_ID = process.env.NEXT_PUBLIC_BANK_ID || "MB"; 
  const ACCOUNT_NO = process.env.NEXT_PUBLIC_ACCOUNT_NO || "0901234567";
  const ACCOUNT_NAME = process.env.NEXT_PUBLIC_ACCOUNT_NAME || "CHÍ TOÁN FISHING SHOP";
  const TEMPLATE = process.env.NEXT_PUBLIC_VIETQR_TEMPLATE || "compact";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <h1 className="mb-4 text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
        <Link href="/" className="rounded-full bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  const orderId = `CTF${Math.floor(Date.now() / 1000)}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${cart.cost.totalAmount.amount}&addInfo=Thanh toan don hang ${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">Thanh Toán Đơn Hàng</h1>
      
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Order Summary */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-6 text-xl font-bold">Tóm tắt đơn hàng</h2>
          <div className="space-y-4">
            {cart.lines.map((line) => (
              <div key={line.id} className="flex gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
                  <Image
                    src={line.merchandise.product.featuredImage.url}
                    alt={line.merchandise.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium leading-tight">{line.merchandise.product.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {line.merchandise.title} x {line.quantity}
                  </p>
                </div>
                <Price
                  amount={line.cost.totalAmount.amount}
                  currencyCode={line.cost.totalAmount.currencyCode}
                  className="text-sm font-semibold"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Tạm tính</span>
              <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Phí vận chuyển</span>
              <span className="text-green-500">Miễn phí</span>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-4 text-xl font-bold dark:border-neutral-800">
              <span>Tổng cộng</span>
              <Price amount={cart.cost.totalAmount.amount} currencyCode={cart.cost.totalAmount.currencyCode} />
            </div>
          </div>
        </div>

        {/* Payment QR */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-8 dark:border-blue-900/30 dark:bg-blue-900/10">
          <h2 className="mb-2 text-xl font-bold text-blue-900 dark:text-blue-400">Quét mã VietQR</h2>
          <p className="mb-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Sử dụng ứng dụng Ngân hàng hoặc Ví điện tử để quét mã thanh toán.
          </p>
          
          <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-xl bg-white p-4 shadow-xl">
            <img
              src={qrUrl}
              alt="VietQR Payment"
              className="h-full w-full object-contain"
            />
          </div>
          
          <div className="mt-8 w-full space-y-4">
            <div className="rounded-lg bg-white p-4 text-sm shadow-sm dark:bg-neutral-800">
              <p className="mb-1 text-neutral-500">Chủ tài khoản:</p>
              <p className="font-bold uppercase">{ACCOUNT_NAME}</p>
            </div>
            <div className="rounded-lg bg-white p-4 text-sm shadow-sm dark:bg-neutral-800">
              <p className="mb-1 text-neutral-500">Nội dung chuyển khoản:</p>
              <p className="font-bold text-blue-600">{orderId}</p>
            </div>
          </div>

          <button 
            onClick={() => {
              clearCart();
              window.location.href = '/';
            }}
            className="mt-8 w-full rounded-full bg-blue-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
          >
            Tôi đã thanh toán xong
          </button>
          
          <p className="mt-4 text-[10px] text-neutral-400 text-center italic">
            * Sau khi thanh toán, đơn hàng sẽ được xử lý trong vòng 30 phút.
          </p>
        </div>
      </div>
    </div>
  );
}
