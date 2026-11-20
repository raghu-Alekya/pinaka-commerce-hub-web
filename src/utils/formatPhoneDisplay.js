import { countryCallingCode } from "../data/countryCallingCodes.js";

export function formatPhoneDisplay(value, country = "") {
  const raw = String(value || "").trim();
  if (!raw) return raw;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (!raw.startsWith("+")) {
    if (raw.startsWith("00")) return formatPhoneDisplay(`+${digits.slice(2)}`, country);
    const callingCode = countryCallingCode(country);
    if (callingCode) return formatPhoneDisplay(`+${callingCode}${digits}`, country);
  }
  if (raw.startsWith("+")) {
    const callingCodes = [
      "355", "213", "376", "244", "54", "374", "61", "43", "994", "973",
      "880", "375", "32", "229", "975", "591", "387", "267", "55", "359",
      "226", "257", "855", "237", "1", "56", "86", "57", "506", "385",
      "53", "357", "420", "45", "593", "20", "503", "372", "251", "358",
      "33", "49", "233", "30", "502", "504", "852", "36", "91", "62",
      "98", "353", "972", "39", "81", "962", "254", "965", "371", "961",
      "370", "352", "60", "52", "212", "31", "64", "234", "47", "92",
      "51", "63", "48", "351", "974", "40", "7", "966", "65", "421",
      "386", "27", "82", "34", "94", "46", "41", "66", "90", "971",
      "44", "598", "998", "58", "84", "260", "263",
    ];
    const callingCode = callingCodes
      .sort((left, right) => right.length - left.length)
      .find((code) => digits.startsWith(code));

    if (callingCode) {
      const national = digits.slice(callingCode.length);
      if (callingCode === "1" && national.length === 10) {
        return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
      }
      if (callingCode === "91" && national.length === 10) {
        return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
      }
      if (callingCode === "44" && national.length >= 10) {
        return `+44 ${national}`;
      }
      if (callingCode === "32" && national.length >= 8) {
        return `+32 ${national}`;
      }
      return `+${callingCode} ${national || "—"}`;
    }
    const countryCode = countryCallingCode(country);
    if (countryCode && digits.startsWith(countryCode)) {
      return `+${countryCode} ${digits.slice(countryCode.length)}`;
    }
  }

  const countryName = String(country || "").trim().toLowerCase();
  const isIndia = /^(india|ind|in)$/.test(countryName);
  const isUsOrCanada = /^(united states|united states of america|usa|us|canada|can)$/.test(countryName);

  if (digits.length === 10 && isIndia) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 10 && isUsOrCanada) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Most saved Indian numbers omit the plus sign but include the 91 prefix.
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  const callingCode = countryCallingCode(country);
  if (digits.length > 10 && callingCode && digits.startsWith(callingCode) && digits.length - callingCode.length >= 7) {
    return `+${callingCode} ${digits.slice(callingCode.length)}`;
  }

  // Keep any supplied international calling code and group the national part
  // into readable chunks without changing the stored value.
  if (raw.startsWith("+")) {
    if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    const codeLength = digits.length > 10 ? Math.min(3, digits.length - 10) : 1;
    const code = digits.slice(0, codeLength);
    const national = digits.slice(codeLength);
    return `+${code} ${national.replace(/(\d{3})(?=\d)/g, "$1 ").trim()}`;
  }

  return raw;
}
