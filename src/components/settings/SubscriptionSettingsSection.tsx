import { useCallback, useMemo, useState } from "react";
import type { FamilyMember } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { Input, Select, Textarea } from "../ui/Field";
import { cn, getMemberFullName } from "../../lib/utils";
import {
  mergeSubscriptionAccount,
  readSubscriptionAccount,
  SUBSCRIPTION_PAYER_FAMILY_SHARED,
  writeSubscriptionAccount,
  type SubscriptionAccountRecord,
  type SubscriptionBillingCycle,
} from "../../lib/subscriptionAccountStorage";

type Props = {
  familyMembers: FamilyMember[];
};

const BILLING_OPTIONS: { value: SubscriptionBillingCycle; label: string }[] = [
  { value: "", label: "Select…" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "custom", label: "Other / custom" },
];

export function SubscriptionSettingsSection({ familyMembers }: Props) {
  const [record, setRecord] = useState<SubscriptionAccountRecord>(() => readSubscriptionAccount());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [allowInsecurePassword, setAllowInsecurePassword] = useState(
    () => Boolean(readSubscriptionAccount().insecureStoredPassword),
  );
  const [passwordDraft, setPasswordDraft] = useState("");

  const payerOptions = useMemo(() => {
    const sorted = [...familyMembers].sort((a, b) =>
      getMemberFullName(a).localeCompare(getMemberFullName(b), undefined, { sensitivity: "base" }),
    );
    return [
      { id: SUBSCRIPTION_PAYER_FAMILY_SHARED, label: "Family / Shared" },
      ...sorted.map((m) => ({
        id: m.id,
        label: getMemberFullName(m).trim().split(/\s+/)[0] || getMemberFullName(m),
      })),
    ];
  }, [familyMembers]);

  const patch = useCallback((p: Partial<SubscriptionAccountRecord>) => {
    setRecord((prev) => mergeSubscriptionAccount({ ...prev, ...p }));
    setSaveStatus("idle");
  }, []);

  function save() {
    const insecurePatch: Partial<SubscriptionAccountRecord> = {};
    if (!allowInsecurePassword) {
      insecurePatch.insecureStoredPassword = "";
    } else if (passwordDraft.trim()) {
      insecurePatch.insecureStoredPassword = passwordDraft.trim();
    }
    const next = mergeSubscriptionAccount({ ...record, ...insecurePatch });
    writeSubscriptionAccount(next);
    setRecord(next);
    if (!allowInsecurePassword) {
      setPasswordDraft("");
    }
    setSaveStatus("saved");
    window.setTimeout(() => setSaveStatus("idle"), 2000);
  }

  const fieldClass =
    "rounded-[8px] border border-[#ededed] bg-white text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)]";

  return (
    <div id="settings-subscription">
      <Card tone="light">
        <CardHeader tone="light" title="Subscription account" eyebrow="Billing" />
        <p className="mb-4 text-sm leading-relaxed text-[#575757]">
          Track who pays and how you sign in — stored only on this browser under{" "}
          <span className="font-mono text-xs text-[#637381]">familysite-491:subscription-account</span>.
          Household backup data is not modified. No payment processing or Stripe keys.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-[#1f1f1f]">Subscription service name</span>
            <Input
              className={fieldClass}
              value={record.subscriptionServiceName}
              onChange={(e) => patch({ subscriptionServiceName: e.target.value })}
              placeholder="e.g. Netflix, iCloud, gym"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Sign-in email / username</span>
            <Input
              className={fieldClass}
              value={record.signInEmailOrUsername}
              onChange={(e) => patch({ signInEmailOrUsername: e.target.value })}
              autoComplete="username"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Website / login URL</span>
            <Input
              className={fieldClass}
              type="url"
              value={record.loginUrl}
              onChange={(e) => patch({ loginUrl: e.target.value })}
              placeholder="https://"
            />
          </label>

          <div className="sm:col-span-2 rounded-[8px] border border-[#ededed] bg-[#fafafa] p-4">
            <p className="text-sm font-semibold text-[#1f1f1f]">Password</p>
            <p className="mt-1 text-xs leading-relaxed text-[#637381]">
              Prefer a <span className="font-medium text-[#575757]">password hint</span> (phrase you’ll
              recognize) — we do not encrypt local notes. Avoid storing the real password unless you must.
            </p>
            <label className="mt-3 grid gap-1.5 text-sm">
              <span className="font-medium text-[#1f1f1f]">Password hint</span>
              <Input
                className={fieldClass}
                value={record.passwordHint}
                onChange={(e) => patch({ passwordHint: e.target.value })}
                placeholder="e.g. usual + year"
                autoComplete="off"
              />
            </label>

            <div className="mt-4 border-t border-[#ededed] pt-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-[#F26522]"
                  checked={allowInsecurePassword}
                  onChange={(e) => {
                    setAllowInsecurePassword(e.target.checked);
                    if (!e.target.checked) {
                      setPasswordDraft("");
                    }
                    setSaveStatus("idle");
                  }}
                />
                <span className="text-sm leading-snug text-[#575757]">
                  Allow saving the actual sign-in password on this device (not recommended)
                </span>
              </label>
              {allowInsecurePassword ? (
                <div
                  className={cn(
                    "mt-3 rounded-[8px] border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs font-medium leading-relaxed text-amber-950",
                  )}
                  role="status"
                >
                  Only save passwords here if this device is private. Anyone with access to this browser can read
                  localStorage. Prefer a hint above when possible.
                </div>
              ) : null}
              {allowInsecurePassword ? (
                <label className="mt-3 grid gap-1.5 text-sm">
                  <span className="font-medium text-[#1f1f1f]">Password (stored as plain text locally)</span>
                  <Input
                    className={fieldClass}
                    type="password"
                    value={passwordDraft}
                    onChange={(e) => setPasswordDraft(e.target.value)}
                    placeholder={
                      record.insecureStoredPassword ? "Leave blank to keep saved password" : "••••••••"
                    }
                    autoComplete="new-password"
                  />
                </label>
              ) : null}
              {!allowInsecurePassword && record.insecureStoredPassword ? (
                <p className="mt-2 text-xs text-[#637381]">
                  A password was previously saved. Enable the checkbox above to replace it, or save with the
                  checkbox off to remove it.
                </p>
              ) : null}
            </div>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Monthly cost</span>
            <Input
              className={fieldClass}
              value={record.monthlyCost}
              onChange={(e) => patch({ monthlyCost: e.target.value })}
              placeholder="e.g. $14.99"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Yearly cost</span>
            <Input
              className={fieldClass}
              value={record.yearlyCost}
              onChange={(e) => patch({ yearlyCost: e.target.value })}
              placeholder="e.g. $99"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Billing cycle</span>
            <Select
              className={fieldClass}
              value={record.billingCycle}
              onChange={(e) => patch({ billingCycle: e.target.value as SubscriptionBillingCycle })}
            >
              {BILLING_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[#1f1f1f]">Renewal date</span>
            <Input
              className={fieldClass}
              type="date"
              value={record.renewalDate}
              onChange={(e) => patch({ renewalDate: e.target.value })}
            />
          </label>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-[#1f1f1f]">Who is paying</span>
            <Select
              className={fieldClass}
              value={record.payerMemberIdOrShared}
              onChange={(e) => patch({ payerMemberIdOrShared: e.target.value })}
            >
              {payerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-[#1f1f1f]">Payment method note</span>
            <Input
              className={fieldClass}
              value={record.paymentMethodNote}
              onChange={(e) => patch({ paymentMethodNote: e.target.value })}
              placeholder="e.g. Mom’s Visa ·•••4242, paid via bank portal"
              autoComplete="off"
            />
          </label>
          <label className="grid gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-[#1f1f1f]">Notes</span>
            <Textarea
              className={cn(fieldClass, "min-h-[88px]")}
              value={record.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Cancellation steps, support PINs, plan tier, etc."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#ededed] pt-4">
          <Button type="button" variant="primary" className="min-h-10 px-5 font-semibold" onClick={save}>
            Save subscription details
          </Button>
          {saveStatus === "saved" ? (
            <span className="text-sm font-medium text-emerald-700">Saved on this device.</span>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
