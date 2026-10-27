const PHONE_RULES = {
  India: { callingCode: "91", minDigits: 10, maxDigits: 10, trunkPrefix: "0" },
  "United States": { callingCode: "1", minDigits: 10, maxDigits: 10 },
  Canada: { callingCode: "1", minDigits: 10, maxDigits: 10 },
  "United Kingdom": { callingCode: "44", minDigits: 7, maxDigits: 10, trunkPrefix: "0" },
  Australia: { callingCode: "61", minDigits: 9, maxDigits: 9, trunkPrefix: "0" },
};

export function validatePhoneForCountry(value, country) {
  const phone = String(value || "").trim();
  if (!phone) return "";
  const rule = PHONE_RULES[country];
  if (!/^\+?[\d\s().-]+$/.test(phone))
    return `Enter a valid ${country || "country"} phone number.`;

  if (!rule) {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15
      ? ""
      : `Enter a valid ${country || "country"} phone number.`;
  }

  const hasInternationalPrefix = phone.startsWith("+") || phone.startsWith("00");
  let digits = phone.replace(/\D/g, "");
  if (phone.startsWith("00")) digits = digits.slice(2);
  if (hasInternationalPrefix) {
    if (!digits.startsWith(rule.callingCode))
      return `The phone number country code does not match ${country}.`;
    digits = digits.slice(rule.callingCode.length);
  } else if (digits.length > rule.maxDigits && digits.startsWith(rule.callingCode)) {
    digits = digits.slice(rule.callingCode.length);
  }

  if (rule.trunkPrefix && digits.length > rule.maxDigits && digits.startsWith(rule.trunkPrefix))
    digits = digits.slice(rule.trunkPrefix.length);
  if (digits.length < rule.minDigits || digits.length > rule.maxDigits)
    return `Enter a valid ${country} phone number.`;
  return "";
}
