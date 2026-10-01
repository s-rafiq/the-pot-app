export const formatMoney = (amount: number): string => {
  const isInteger = amount % 1 === 0;
  return amount.toLocaleString('en-GB', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2,
  });
};
