import clsx from "clsx";

const Price = ({
  amount,
  className,
  currencyCode = "USD",
  currencyCodeClassName,
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<"p">) => (
  <p suppressHydrationWarning={true} className={className}>
    {new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "symbol",
    }).format(parseFloat(amount))}
  </p>
);

export default Price;
