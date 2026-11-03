export function formatCurrency(value, currency = "USD", savedSymbol) {
  const numericValue = typeof value === "string"
    ? value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0]
    : value;
  const amount = Number(numericValue ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const code = String(currency || "USD").toUpperCase();

  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).formatToParts(safeAmount);
    return parts
      .map((part) => part.type === "currency" && savedSymbol ? savedSymbol : part.value)
      .join("");
  } catch {
    return `${savedSymbol || code}${safeAmount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).formatToParts(0).find((part) => part.type === "currency")?.value || code;
  } catch {
    return code;
  }
}

