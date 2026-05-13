import Image from "next/image";
import clsx from "clsx";

export default function LogoSquare({ size }: { size?: "sm" | undefined }) {
  const avatarUrl = "https://down-bs-vn.img.susercontent.com/vn-11134216-81ztc-mnh0zou8j09466_tn.webp";
  
  return (
    <div
      className={clsx(
        "flex flex-none items-center justify-center overflow-hidden border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-black",
        {
          "h-[40px] w-[40px] rounded-xl": !size,
          "h-[30px] w-[30px] rounded-lg": size === "sm",
        },
      )}
    >
      <Image
        src={avatarUrl}
        alt="Chí Toàn Fishing Shop Logo"
        width={size === "sm" ? 30 : 40}
        height={size === "sm" ? 30 : 40}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
