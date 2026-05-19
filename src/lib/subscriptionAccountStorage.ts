/**
 * Optional subscription tracker — device-only, separate from
 * `familysite-491:first-family-build`. Never payment processors or Stripe secrets.
 */
export const SUBSCRIPTION_ACCOUNT_STORAGE_KEY = "familysite-491:subscription-account";

/** `payerMemberIdOrShared` value for “Family / Shared”. */
export const SUBSCRIPTION_PAYER_FAMILY_SHARED = "__family_shared__";

export type SubscriptionBillingCycle = "monthly" | "yearly" | "quarterly" | "custom" | "";

export type SubscriptionAccountRecord = {
  version: 1;
  subscriptionServiceName: string;
  signInEmailOrUsername: string;
  /** Prefer this over storing real passwords (see `insecureStoredPassword`). */
  passwordHint: string;
  /**
   * Optional plaintext password — **only** if the user explicitly opts in after the in-app warning.
   * Stored in browser localStorage (not encrypted). Prefer {@link SubscriptionAccountRecord.passwordHint}.
   */
  insecureStoredPassword?: string;
  loginUrl: string;
  /** Freeform (e.g. currency + amount). */
  monthlyCost: string;
  yearlyCost: string;
  billingCycle: SubscriptionBillingCycle;
  /** ISO `YYYY-MM-DD` or empty. */
  renewalDate: string;
  /** Member id or {@link SUBSCRIPTION_PAYER_FAMILY_SHARED}. */
  payerMemberIdOrShared: string;
  paymentMethodNote: string;
  notes: string;
};

export const DEFAULT_SUBSCRIPTION_ACCOUNT: SubscriptionAccountRecord = {
  version: 1,
  subscriptionServiceName: "",
  signInEmailOrUsername: "",
  passwordHint: "",
  loginUrl: "",
  monthlyCost: "",
  yearlyCost: "",
  billingCycle: "",
  renewalDate: "",
  payerMemberIdOrShared: SUBSCRIPTION_PAYER_FAMILY_SHARED,
  paymentMethodNote: "",
  notes: "",
};

function coerceString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function coerceBilling(v: unknown): SubscriptionBillingCycle {
  if (v === "monthly" || v === "yearly" || v === "quarterly" || v === "custom") {
    return v;
  }
  return "";
}

export function mergeSubscriptionAccount(
  partial: Partial<SubscriptionAccountRecord> | null | undefined,
): SubscriptionAccountRecord {
  const defaults = DEFAULT_SUBSCRIPTION_ACCOUNT;
  if (!partial || typeof partial !== "object") {
    return { ...defaults };
  }
  const m = { ...defaults, ...partial };
  const out: SubscriptionAccountRecord = {
    version: 1,
    subscriptionServiceName: coerceString(m.subscriptionServiceName),
    signInEmailOrUsername: coerceString(m.signInEmailOrUsername),
    passwordHint: coerceString(m.passwordHint),
    loginUrl: coerceString(m.loginUrl),
    monthlyCost: coerceString(m.monthlyCost),
    yearlyCost: coerceString(m.yearlyCost),
    billingCycle: coerceBilling(m.billingCycle),
    renewalDate: coerceString(m.renewalDate),
    payerMemberIdOrShared: coerceString(m.payerMemberIdOrShared) || SUBSCRIPTION_PAYER_FAMILY_SHARED,
    paymentMethodNote: coerceString(m.paymentMethodNote),
    notes: coerceString(m.notes),
  };
  const pw = m.insecureStoredPassword;
  if (typeof pw === "string" && pw.trim().length > 0) {
    out.insecureStoredPassword = pw.trim();
  }
  return out;
}

export function readSubscriptionAccount(): SubscriptionAccountRecord {
  if (typeof window === "undefined") {
    return DEFAULT_SUBSCRIPTION_ACCOUNT;
  }
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_ACCOUNT_STORAGE_KEY);
    if (!raw?.trim()) {
      return DEFAULT_SUBSCRIPTION_ACCOUNT;
    }
    const parsed = JSON.parse(raw) as Partial<SubscriptionAccountRecord>;
    return mergeSubscriptionAccount(parsed);
  } catch {
    return DEFAULT_SUBSCRIPTION_ACCOUNT;
  }
}

export function writeSubscriptionAccount(record: SubscriptionAccountRecord): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const next = mergeSubscriptionAccount(record);
    window.localStorage.setItem(SUBSCRIPTION_ACCOUNT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}
