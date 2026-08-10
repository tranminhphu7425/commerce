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

interface ShippingProfile {
  id: string;
  name: string;
  phone: string;
  street: string;
  provinceCode: number;
  provinceName: string;
  wardCode: number;
  wardName: string;
  note?: string;
}

// Cấu hình hình thức thanh toán nhanh:
// - true: Bỏ qua việc chọn phương thức thanh toán. Đơn hàng sẽ xác nhận luôn sau khi điền địa chỉ giao hàng và mở Messenger.
// - false: Yêu cầu khách hàng nhập đầy đủ địa chỉ giao hàng và phương thức thanh toán (COD / QR).
const SKIP_PAYMENT = true;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const { clearCart } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [countdown, setCountdown] = useState(8);

  // Address profiles state
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isEditingOrAdding, setIsEditingOrAdding] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    street: '',
    provinceCode: 0,
    wardCode: 0,
    note: ''
  });

  // Provinces API state
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: number; name: string }[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'cod'>('cod');

  const { bankId: BANK_ID, accountNo: ACCOUNT_NO, accountName: ACCOUNT_NAME } = CONTACT_INFO;
  const TEMPLATE = "compact";

  useEffect(() => {
    setMounted(true);

    // Retrieve profiles from localStorage
    const storedProfiles = localStorage.getItem("commerce_shipping_profiles");
    const storedActiveId = localStorage.getItem("commerce_active_profile_id");
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        setProfiles(parsed);
        if (parsed.length > 0) {
          const activeId = storedActiveId && parsed.some((p: any) => p.id === storedActiveId)
            ? storedActiveId
            : parsed[0].id;
          setActiveProfileId(activeId);
        } else {
          setIsEditingOrAdding(true);
          setFormMode('add');
        }
      } catch (e) {
        console.error("Error parsing stored profiles", e);
        setIsEditingOrAdding(true);
        setFormMode('add');
      }
    } else {
      setIsEditingOrAdding(true);
      setFormMode('add');
    }

    // Fetch provinces list
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("https://provinces.open-api.vn/api/v2/p/");
        if (res.ok) {
          const data = await res.json();
          setProvinces(data);
        }
      } catch (err) {
        console.error("Error fetching provinces:", err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch wards when province code changes
  useEffect(() => {
    if (!formValues.provinceCode) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/v2/w/?province=${formValues.provinceCode}`);
        if (res.ok) {
          const data = await res.json();
          setWards(data || []);
        }
      } catch (err) {
        console.error("Error fetching wards:", err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchWards();
  }, [formValues.provinceCode]);

  const handleRedirectToFacebook = async () => {
    const telegramToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    // Send to Telegram only when checkout is confirmed and redirecting
    if (telegramToken && telegramChatId) {
      try {
        const messageHtml = generateOrderMessage(true);
        const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: messageHtml,
            parse_mode: 'HTML',
          }),
        });
      } catch (tgError) {
        console.error('Failed to send Telegram notification:', tgError);
      }
    }

    const messengerUrl = `https://m.me/${CONTACT_INFO.messenger}`;
    const pageUrl = `https://facebook.com/${CONTACT_INFO.messenger}`;
    window.open(messengerUrl, '_blank');
    window.open(pageUrl, '_blank');
    
    clearCart();
    setStep(3);
    setShowFacebookModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseModal = () => {
    setShowFacebookModal(false);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showFacebookModal) {
      setCountdown(8);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRedirectToFacebook();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showFacebookModal]);

  if (!mounted) return null;

  if (!cart || cart.lines.length === 0) {
    if (step === 3) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
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

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const displayAddress = activeProfile
    ? `${activeProfile.street}, ${activeProfile.wardName}, ${activeProfile.provinceName}`
    : '';

  // Order code generation
  const orderId = `CTF${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${cart.cost.totalAmount.amount}&addInfo=Thanh toan don hang ${orderId}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseFloat(amount));
  };

  const isFormValid = !!activeProfile && !isEditingOrAdding;

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

    const addressStr = activeProfile
      ? `${activeProfile.street}, ${activeProfile.wardName}, ${activeProfile.provinceName}`
      : '';
    const nameStr = activeProfile ? activeProfile.name : '';
    const phoneStr = activeProfile ? activeProfile.phone : '';
    const noteStr = activeProfile ? (activeProfile.note || 'Không có') : 'Không có';
    const paymentStr = SKIP_PAYMENT 
      ? 'Thỏa thuận qua Chat' 
      : (paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản VietQR');

    const statusExtra = !SKIP_PAYMENT && paymentMethod === 'qr' ? '\n⚠️ Trạng thái: Em đã chuyển khoản trước rồi ạ!' : '';
    const statusExtraHtml = !SKIP_PAYMENT && paymentMethod === 'qr' ? '\n⚠️ <b>Trạng thái:</b> Em đã chuyển khoản trước rồi ạ!' : '';

    if (html) {
      return `📦 <b>ĐƠN HÀNG MỚI: ${orderId}</b>\n` +
        `---------------------------\n` +
        `👤 <b>Khách hàng:</b> ${nameStr}\n` +
        `📞 <b>Điện thoại:</b> ${phoneStr}\n` +
        `🏠 <b>Địa chỉ:</b> ${addressStr}\n` +
        `💵 <b>Thanh toán:</b> ${paymentStr}\n` +
        `📝 <b>Ghi chú:</b> ${noteStr}\n` +
        `---------------------------\n` +
        `🛒 <b>Chi tiết mặt hàng:</b>\n${itemsText}\n` +
        `---------------------------\n` +
        `💰 <b>Tổng cộng: ${formatCurrency(cart.cost.totalAmount.amount)}</b>${statusExtraHtml}`;
    }

    return `📦 ĐƠN HÀNG MỚI: ${orderId}\n---------------------------\n👤 Khách hàng: ${nameStr}\n📞 Điện thoại: ${phoneStr}\n🏠 Địa chỉ: ${addressStr}\n💵 Thanh toán: ${paymentStr}\n📝 Ghi chú: ${noteStr}\n---------------------------\n🛒 Chi tiết mặt hàng:\n${itemsText}\n---------------------------\n💰 Tổng cộng: ${formatCurrency(cart.cost.totalAmount.amount)}${statusExtra}\n---------------------------\nVui lòng xác nhận đơn hàng giúp em nhé!`;
  };

  const handleNextStep = () => {
    if (!activeProfile) {
      toast.error('Vui lòng tạo hoặc chọn địa chỉ giao hàng trước khi tiếp tục');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã tự động sao chép thông tin đơn hàng!');
    } catch (err) {
      console.error('Clipboard API error, trying fallback', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast.success('Đã sao chép thông tin đơn hàng!');
      } catch (e) {
        toast.error('Không thể sao chép tự động. Vui lòng chọn và sao chép thủ công.');
      }
      document.body.removeChild(textarea);
    }
  };

  const handleCompletePayment = async () => {
    setIsSubmitting(true);

    try {
      // Copy order details to clipboard
      const messageText = generateOrderMessage(false);
      try {
        await copyToClipboard(messageText);
      } catch (clipErr) {
        console.error('Error in copyToClipboard:', clipErr);
      }

      toast.success('Thông tin đơn hàng đã sẵn sàng!');
      setShowFacebookModal(true);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formValues.name.trim() ||
      !formValues.phone.trim() ||
      !formValues.street.trim() ||
      !formValues.provinceCode ||
      !formValues.wardCode
    ) {
      toast.error("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
      return;
    }

    const provinceName = provinces.find((p) => p.code === formValues.provinceCode)?.name || "";
    const wardName = wards.find((w) => w.code === formValues.wardCode)?.name || "";

    const newProfile: ShippingProfile = {
      id: formMode === 'edit' ? activeProfileId : `prof-${Date.now()}`,
      name: formValues.name,
      phone: formValues.phone,
      street: formValues.street,
      provinceCode: formValues.provinceCode,
      provinceName,
      wardCode: formValues.wardCode,
      wardName,
      note: formValues.note
    };

    let updatedProfiles = [];
    if (formMode === 'edit') {
      updatedProfiles = profiles.map((p) => p.id === activeProfileId ? newProfile : p);
    } else {
      updatedProfiles = [...profiles, newProfile];
    }

    setProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    localStorage.setItem("commerce_shipping_profiles", JSON.stringify(updatedProfiles));
    localStorage.setItem("commerce_active_profile_id", newProfile.id);
    setIsEditingOrAdding(false);
    toast.success(formMode === 'edit' ? "Đã cập nhật địa chỉ giao hàng" : "Đã thêm địa chỉ giao hàng mới");
  };

  const handleAddNewClick = () => {
    setFormMode('add');
    setFormValues({
      name: '',
      phone: '',
      street: '',
      provinceCode: 0,
      wardCode: 0,
      note: ''
    });
    setIsEditingOrAdding(true);
  };

  const handleEditProfileClick = (profile: ShippingProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode('edit');
    setActiveProfileId(profile.id);
    localStorage.setItem("commerce_active_profile_id", profile.id);
    setFormValues({
      name: profile.name,
      phone: profile.phone,
      street: profile.street,
      provinceCode: profile.provinceCode,
      wardCode: profile.wardCode,
      note: profile.note || ''
    });
    setIsEditingOrAdding(true);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      const updated = profiles.filter((p) => p.id !== id);
      setProfiles(updated);
      localStorage.setItem("commerce_shipping_profiles", JSON.stringify(updated));

      if (activeProfileId === id) {
        const nextActive = updated[0]?.id || '';
        setActiveProfileId(nextActive);
        localStorage.setItem("commerce_active_profile_id", nextActive);

        if (updated.length === 0) {
          setIsEditingOrAdding(true);
          setFormMode('add');
          setFormValues({
            name: '',
            phone: '',
            street: '',
            provinceCode: 0,
            wardCode: 0,
            note: ''
          });
        }
      }
      toast.success("Đã xóa địa chỉ thành công!");
    }
  };

  const handleSelectProfile = (id: string) => {
    if (isEditingOrAdding) {
      setIsEditingOrAdding(false);
    }
    setActiveProfileId(id);
    localStorage.setItem("commerce_active_profile_id", id);
  };

  if (step === 3) {
    return null; // Triggers the success container on render cycle
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Thanh Toán</h1>

        {/* Progress Indicator */}
        {!SKIP_PAYMENT && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>1</span>
            <span className={`h-1 w-8 rounded ${step >= 2 ? 'bg-orange-600' : 'bg-neutral-200'}`}></span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-neutral-200 text-neutral-700'}`}>2</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Form & QR */}
        <div className="lg:col-span-2 space-y-8">
          {/* Step 1: Customer Form */}
          <div className={`rounded-2xl border ${!SKIP_PAYMENT && step === 2 ? 'border-neutral-200 opacity-60' : 'border-orange-500 ring-1 ring-orange-500'} bg-white p-8 shadow-sm transition-all dark:bg-neutral-900 dark:border-neutral-800`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Thông tin giao hàng
              </h2>
              {step === 2 && (
                <button onClick={() => setStep(1)} className="text-sm font-medium text-orange-600 hover:underline">Sửa</button>
              )}
            </div>

            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">

                {/* Form Editor */}
                {isEditingOrAdding ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl bg-neutral-50/50 dark:bg-neutral-800/10">
                    <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                      {formMode === 'add' ? 'Thêm địa chỉ giao hàng mới' : 'Chỉnh sửa địa chỉ giao hàng'}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          value={formValues.name}
                          onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                          placeholder="Nguyễn Văn A"
                          className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          value={formValues.phone}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/[^\d\s+]/g, '');
                            setFormValues({ ...formValues, phone: sanitized });
                          }}
                          placeholder="0912 xxx xxx"
                          className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>

                      <SearchableSelect
                        label="Tỉnh / Thành phố *"
                        placeholder="Chọn Tỉnh / Thành phố"
                        options={provinces}
                        value={formValues.provinceCode}
                        onChange={(code) => {
                          setFormValues({ ...formValues, provinceCode: code, wardCode: 0 });
                        }}
                        loading={loadingProvinces}
                      />

                      <SearchableSelect
                        label="Phường / Xã *"
                        placeholder="Chọn Phường / Xã"
                        options={wards}
                        value={formValues.wardCode}
                        onChange={(code) => {
                          setFormValues({ ...formValues, wardCode: code });
                        }}
                        disabled={!formValues.provinceCode}
                        loading={loadingWards}
                      />

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Số nhà, tên đường *</label>
                        <input
                          type="text"
                          required
                          value={formValues.street}
                          onChange={(e) => setFormValues({ ...formValues, street: e.target.value })}
                          placeholder="Ví dụ: 123 Đường Trần Hưng Đạo"
                          className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Ghi chú thêm</label>
                        <textarea
                          value={formValues.note}
                          onChange={(e) => setFormValues({ ...formValues, note: e.target.value })}
                          placeholder="Giao giờ hành chính, gọi trước khi đến..."
                          rows={2}
                          className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {profiles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsEditingOrAdding(false)}
                          className="px-4 py-2 text-xs rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors shadow"
                      >
                        Lưu địa chỉ
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Profile Selector List */
                  <div className="space-y-4">
                    {profiles.map((p) => {
                      const isActive = p.id === activeProfileId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProfile(p.id)}
                          className={`relative rounded-xl border p-4 cursor-pointer transition-all ${isActive
                              ? 'border-orange-500 bg-orange-50/5 ring-1 ring-orange-500'
                              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                checked={isActive}
                                onChange={() => handleSelectProfile(p.id)}
                                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500"
                              />
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                  {p.name}
                                  {isActive && (
                                    <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      Đang chọn
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-1.5">SĐT: {p.phone}</p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">Địa chỉ: {p.street}, {p.wardName}, {p.provinceName}</p>
                                {p.note && (
                                  <p className="text-[11px] text-orange-600 font-medium italic mt-1.5">Ghi chú: {p.note}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => handleEditProfileClick(p, e)}
                                className="text-xs font-semibold text-neutral-600 hover:text-orange-600 transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={(e) => handleDeleteProfile(p.id, e)}
                                className="text-xs font-semibold text-neutral-400 hover:text-red-600 transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleAddNewClick}
                      className="w-full py-3.5 rounded-xl border border-dashed border-neutral-300 hover:border-orange-500 text-neutral-600 hover:text-orange-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      + Thêm địa chỉ mới
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Review Active Address */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600 dark:text-neutral-400 animate-in fade-in duration-300">
                <div><span className="font-semibold text-neutral-900 dark:text-neutral-200">Người nhận:</span> {activeProfile?.name}</div>
                <div><span className="font-semibold text-neutral-900 dark:text-neutral-200">SĐT:</span> {activeProfile?.phone}</div>
                <div className="md:col-span-2"><span className="font-semibold text-neutral-900 dark:text-neutral-200">Địa chỉ:</span> {displayAddress}</div>
                {activeProfile?.note && (
                  <div className="md:col-span-2"><span className="font-semibold text-neutral-900 dark:text-neutral-200">Ghi chú:</span> {activeProfile.note}</div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Payment Selector & Instruction Section */}
          {step === 2 && (
            <div className="rounded-2xl border border-orange-500 ring-1 ring-orange-500 bg-white p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 dark:bg-neutral-900 dark:border-neutral-800">
              <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
                Chọn phương thức thanh toán
              </h2>

              {/* Payment Toggler */}
              <div className="mb-8 flex flex-col sm:flex-row gap-4">
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${paymentMethod === 'cod'
                      ? 'border-orange-500 bg-orange-50/10 ring-1 ring-orange-500 font-bold'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                    }`}
                >
                  <span className="text-2xl mb-1.5">💵</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Thanh toán khi nhận hàng (COD)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qr')}
                  className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${paymentMethod === 'qr'
                      ? 'border-orange-500 bg-orange-50/10 ring-1 ring-orange-500 font-bold'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800'
                    }`}
                >
                  <span className="text-2xl mb-1.5">💳</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Chuyển khoản VietQR</span>
                </button>
              </div>

              {paymentMethod === 'qr' ? (
                /* QR Method */
                <div className="flex flex-col md:flex-row gap-8 items-center animate-in fade-in duration-300">
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
              ) : (
                /* COD Method */
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/40 p-6 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 text-orange-600">
                    <span className="text-3xl">🚚</span>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Dịch vụ giao hàng COD</h3>
                      <p className="text-xs text-neutral-500">Thanh toán bằng tiền mặt ngay khi nhận hàng</p>
                    </div>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-2 leading-relaxed">
                    <p>• Bạn sẽ thanh toán số tiền tổng cộng là <strong className="text-orange-600 text-sm font-bold">{formatCurrency(cart.cost.totalAmount.amount)}</strong> cho nhân viên giao hàng (shipper).</p>
                    <p>• Phí vận chuyển: <strong className="text-green-600">Miễn phí toàn quốc</strong>.</p>
                    <p>• Vui lòng chú ý điện thoại từ shipper trong vòng 2-4 ngày tới để nhận hàng.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-6 text-xl font-bold">Tóm tắt đơn hàng</h2>
            
            <div className="">
              
              {/* Product List */}
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

              {/* Pricing breakdown & Actions Column */}
              <div>
                <div className="mt-6 pt-6 border-t space-y-3 border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-700">Tạm tính</span>
                    <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-700">Phí vận chuyển</span>
                    <span className="text-green-500 font-medium">Miễn phí</span>
                  </div>
                  <div className="flex justify-between pt-2 text-xl font-bold text-neutral-900 dark:text-white border-t border-neutral-100 dark:border-neutral-800">
                    <span>Tổng cộng</span>
                    <Price amount={cart.cost.totalAmount.amount} currencyCode={cart.cost.totalAmount.currencyCode} />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {SKIP_PAYMENT ? (
                    <button
                      onClick={handleCompletePayment}
                      disabled={!isFormValid || isSubmitting}
                      className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${isFormValid
                          ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-lg'
                          : 'bg-neutral-300 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500'
                        }`}
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Xác nhận đặt hàng qua Facebook
                    </button>
                  ) : step === 1 ? (
                    <button
                      onClick={handleNextStep}
                      disabled={!isFormValid}
                      className={`w-full rounded-full py-4 text-sm font-bold text-white shadow-md transition-all ${isFormValid
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
                      className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${paymentMethod === 'cod'
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {paymentMethod === 'cod' ? 'Xác nhận đặt hàng (COD)' : 'Tôi đã chuyển khoản thành công'}
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
      </div>

      {/* Facebook Redirect Modal */}
      {showFacebookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800 animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              style={{ position: 'absolute', right: '20px', top: '20px' }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:rotate-90 transition-all duration-300 rounded-full p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Đóng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Header Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/20 animate-pulse">
                <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>

              {/* Title & Success Msg */}
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Chuyển sang Facebook nhắn tin
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Đơn hàng của bạn đã được ghi nhận thành công trên hệ thống!
                </p>
              </div>

              {/* Instruction Card */}
              <div className="w-full rounded-2xl bg-orange-50/70 p-4 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 text-left">
                <p className="text-xs font-bold text-orange-800 dark:text-orange-300">
                  📋 Đã tự động sao chép thông tin đơn hàng
                </p>
                <p className="text-[12px] text-neutral-700 dark:text-neutral-400 mt-1.5 leading-relaxed">
                  Hệ thống sắp chuyển bạn sang Facebook. Vui lòng bấm vào phần <strong>Nhắn tin</strong> trên Fanpage và <strong>Dán</strong> toàn bộ nội dung vừa sao chép để xác nhận đơn hàng với shop.
                </p>
              </div>

           

              {/* Action Buttons */}
              <div className="w-full rounded-md bg-orange-500">
                <button
                  onClick={handleRedirectToFacebook}
                  className="w-full rounded-xl bg-[#1877F2] hover:bg-[#166FE5] py-3 text-sm font-bold !text-white shadow-lg transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="!text-white">Đã hiểu, chuyển sang Facebook</span>
                  <span className="bg-[#0c5eb9] px-2 py-0.5 rounded-md text-xs font-semibold !text-white">
                    {countdown}s
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  options: { code: number; name: string }[];
  value: number;
  onChange: (code: number) => void;
  disabled?: boolean;
  loading?: boolean;
}

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = options.find(o => o.code === value);
  
  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const filteredOptions = options.filter(o => 
    removeAccents(o.name.toLowerCase()).includes(removeAccents(search.toLowerCase()))
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.searchable-select-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative searchable-select-container space-y-1">
      <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{label}</label>
      
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-2.5 text-xs text-left focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 disabled:opacity-50 transition-colors"
      >
        <span className={selectedOption ? "text-neutral-950 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}>
          {loading ? 'Đang tải...' : (selectedOption ? selectedOption.name : placeholder)}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 max-h-64 flex flex-col">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhanh..."
            className="mb-2 w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 text-neutral-900 dark:text-white"
          />
          
          <div className="overflow-y-auto max-h-48 space-y-0.5 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.code === value;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      onChange(opt.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700/50 ${isSelected ? 'bg-orange-50 text-orange-600 font-bold dark:bg-orange-950/20 dark:text-orange-400' : 'text-neutral-800 dark:text-neutral-200'}`}
                  >
                    {opt.name}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-3 text-xs text-neutral-400 dark:text-neutral-500">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
