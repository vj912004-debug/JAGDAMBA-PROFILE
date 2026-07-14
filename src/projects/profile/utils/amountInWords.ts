/** Indian Rupees amount in words (whole rupees + paise). */
export function amountInWords(n: number): string {
  if (!isFinite(n) || n < 0) return '';
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const two = (num: number): string => {
    if (num < 20) return ones[num];
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim();
  };

  const three = (num: number): string => {
    if (num < 100) return two(num);
    return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${two(num % 100)}` : ''}`.trim();
  };

  const convert = (num: number): string => {
    if (num === 0) return 'Zero';
    let words = '';
    const crore = Math.floor(num / 1_00_00_000);
    num %= 1_00_00_000;
    const lakh = Math.floor(num / 1_00_000);
    num %= 1_00_000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    if (crore) words += `${convert(crore)} Crore `;
    if (lakh) words += `${two(lakh)} Lakh `;
    if (thousand) words += `${two(thousand)} Thousand `;
    if (num) words += three(num);
    return words.trim();
  };

  let result = `Rupees ${convert(rupees)} Only`;
  if (paise) result = `Rupees ${convert(rupees)} and ${convert(paise)} Paise Only`;
  return result;
}
