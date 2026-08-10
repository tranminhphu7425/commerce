"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import { createUrl } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCartAndSetCookie, redirectToCheckout } from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    if (
      cart?.totalQuantity !== undefined &&
      quantityRef.current !== undefined &&
      cart?.totalQuantity > quantityRef.current
    ) {
      setIsOpen(true);
    }
    quantityRef.current = cart?.totalQuantity;
  }, [cart?.totalQuantity]);

  return (
    <>
      <button aria-label="Open cart" onClick={openCart}>
        <OpenCart quantity={cart?.totalQuantity} />
      </button>
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-neutral-200 bg-white/90 p-6 text-black backdrop-blur-xl md:w-[390px] dark:border-neutral-800 dark:bg-black/90 dark:text-white shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <p className="text-lg font-bold tracking-tight">Giỏ hàng của tôi</p>
                </div>
                <button aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {!cart || cart.lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 mb-5 shadow-inner">
                    <ShoppingCartIcon className="h-9 w-9 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Giỏ hàng của bạn trống
                  </h3>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 max-w-[220px] leading-relaxed">
                    Hãy lấp đầy giỏ hàng bằng những mồi câu và phụ kiện chất lượng từ Chí Toàn Fishing nhé!
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 rounded-full border border-neutral-200 dark:border-neutral-800 px-6 py-2 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-95 transition-all shadow-sm"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden">
                  <ul className="grow overflow-auto py-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/80 pr-1">
                    {cart.lines
                      .sort((a, b) =>
                        a.merchandise.product.title.localeCompare(
                          b.merchandise.product.title,
                        ),
                      )
                      .map((item, i) => {
                        const merchandiseSearchParams =
                          {} as MerchandiseSearchParams;

                        item.merchandise.selectedOptions.forEach(
                          ({ name, value }) => {
                            if (value !== DEFAULT_OPTION) {
                              merchandiseSearchParams[name.toLowerCase()] =
                                value;
                            }
                          },
                        );

                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams),
                        );

                        return (
                          <li
                            key={i}
                            className="group flex w-full flex-col py-3 px-1 transition-all rounded-xl hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10"
                          >
                            <div className="relative flex w-full flex-row justify-between gap-2.5">
                              {/* Delete Button */}
                              <div className="absolute z-40 -left-1.5 -top-1.5 shadow-sm rounded-full">
                                <DeleteItemButton
                                  item={item}
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>

                              <div className="flex flex-row items-center gap-3">
                                {/* Product Image */}
                                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                                  <Image
                                    className="h-full w-full object-contain"
                                    width={64}
                                    height={64}
                                    alt={
                                      item.merchandise.product.featuredImage
                                        .altText ||
                                      item.merchandise.product.title
                                    }
                                    src={
                                      item.merchandise.product.featuredImage.url
                                    }
                                  />
                                </div>

                                {/* Title & Option */}
                                <div className="flex flex-col max-w-[150px] sm:max-w-[170px]">
                                  <Link
                                    href={merchandiseUrl}
                                    onClick={closeCart}
                                    className="text-xs font-bold text-neutral-800 leading-tight hover:text-orange-500 dark:text-neutral-200 dark:hover:text-orange-400 transition-colors line-clamp-2"
                                  >
                                    {item.merchandise.product.title}
                                  </Link>
                                  {item.merchandise.title !== DEFAULT_OPTION ? (
                                    <span className="mt-1 text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 rounded px-1.5 py-0.5 w-fit leading-none">
                                      {item.merchandise.title}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Price & Quantity Pill */}
                              <div className="flex flex-col items-end justify-between h-16 flex-shrink-0">
                                <Price
                                  className="text-xs sm:text-sm font-extrabold text-neutral-950 dark:text-neutral-50"
                                  amount={item.cost.totalAmount.amount}
                                  currencyCode={
                                    item.cost.totalAmount.currencyCode
                                  }
                                />
                                <div className="flex h-8 flex-row items-center rounded-full border border-neutral-200 bg-white/30 backdrop-blur-sm dark:border-neutral-800 dark:bg-black/30 shadow-sm">
                                  <EditItemQuantityButton
                                    item={item}
                                    type="minus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                  <span className="w-5 text-center text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    {item.quantity}
                                  </span>
                                  <EditItemQuantityButton
                                    item={item}
                                    type="plus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>

                  {/* Checkout Area */}
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 pb-2 text-xs text-neutral-700 dark:text-neutral-400">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="font-medium">Phí vận chuyển</p>
                      <p className="text-right text-green-500 font-semibold">Miễn phí giao hàng</p>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Tổng cộng</p>
                      <Price
                        className="text-right text-base font-extrabold text-orange-600 dark:text-orange-500"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                    </div>
                  </div>
                  
                  <div onClick={() => window.location.href = "/commerce/checkout"} className="pb-2">
                    <CheckoutButton />
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white">
      <XMarkIcon
        className={clsx(
          "h-6 transition-all ease-in-out hover:scale-110",
          className,
        )}
      />
    </div>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="block w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 p-3.5 text-center text-sm font-bold text-white shadow-md hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
      type="submit"
      disabled={pending}
    >
      {pending ? <LoadingDots className="bg-white" /> : "TIẾN HÀNH THANH TOÁN"}
    </button>
  );
}
