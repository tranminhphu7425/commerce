import clsx from "clsx";
import Price from "./price";

const Label = ({
  title,
  amount,
  currencyCode,
  position = "bottom",
  compareAtAmount,
  size,
}: {
  title: string | React.ReactNode;
  amount: string;
  currencyCode: string;
  position?: "bottom" | "center";
  compareAtAmount?: string;
  size?: string;
}) => {
  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 flex w-full px-4 pb-3 @container/label",
        {
          "lg:px-20 lg:pb-[35%]": position === "center",
        },
      )}
    >
      <div className="flex w-full items-center sm:flex-col sm:gap-2 xl:flex-row xl:gap-0 rounded-2xl border bg-white/80 p-2 text-sm font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/85 dark:text-white shadow-md">
        <h3 className="mr-3 line-clamp-3 grow pl-2 text-lg md:text-sm font-bold leading-tight tracking-tight text-neutral-800 dark:text-neutral-100">
          {title}
        </h3>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 flex-none rounded-xl bg-orange-600 px-3.5 py-2 text-white">
          {compareAtAmount && parseFloat(compareAtAmount) > parseFloat(amount) && (
            <Price
              className="text-[10px] sm:text-xs text-orange-200 line-through font-medium"
              amount={compareAtAmount}
              currencyCode={currencyCode}
              currencyCodeClassName="hidden"
            />
          )}
          <Price
            className="text-lg md:text-sm font-extrabold tracking-tight"
            amount={amount}
            currencyCode={currencyCode}
            currencyCodeClassName="hidden @[275px]/label:inline"
          />
        </div>
      </div>
    </div>
  );
};

export default Label;
