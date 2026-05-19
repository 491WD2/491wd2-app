import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { memberColorThemes, type FamilyMember } from "../../data/familyData";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { isFourDigitPin, isPinTakenByOther } from "../../lib/memberPin";
import { selectOptionsWithCurrent } from "../../lib/customization";
import { workspaceFormSectionClassName } from "../workspace/ModuleWorkspace";
import { cn } from "../../lib/utils";

export function MemberField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MemberEditForm({
  member,
  allMembers,
  onRemove,
  onUpdate,
  statusOptions,
  ageGroupOptions,
}: {
  member: FamilyMember;
  allMembers: FamilyMember[];
  onRemove: () => void;
  onUpdate: (updates: Partial<FamilyMember>) => void;
  statusOptions: string[];
  ageGroupOptions: string[];
}) {
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const statusSelectValues = selectOptionsWithCurrent(statusOptions, member.status);
  const ageSelectValues = selectOptionsWithCurrent(ageGroupOptions, member.ageGroup ?? "");

  function applyPinChange() {
    setPinError(null);
    if (!isFourDigitPin(pinNew) || !isFourDigitPin(pinConfirm)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinError("PIN and confirmation do not match.");
      return;
    }
    if (isPinTakenByOther(allMembers, pinNew, member.id)) {
      setPinError("That PIN is already in use. Choose a different 4-digit PIN.");
      return;
    }
    onUpdate({
      pinCode: pinNew,
      pinUpdatedAt: new Date().toISOString(),
    });
    setPinNew("");
    setPinConfirm("");
  }

  function clearPin() {
    setPinError(null);
    if (!window.confirm(`Remove PIN for ${member.name}? They will set a new one at the kiosk.`)) {
      return;
    }
    onUpdate({ pinCode: undefined, pinUpdatedAt: undefined });
    setPinNew("");
    setPinConfirm("");
  }

  return (
    <div className={cn(workspaceFormSectionClassName, "space-y-4")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <MemberField label="Name">
          <Input
            value={member.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
          />
        </MemberField>
        <MemberField label="Nickname">
          <Input
            value={member.nickname ?? ""}
            onChange={(event) => onUpdate({ nickname: event.target.value })}
          />
        </MemberField>
        <MemberField label="Status">
          <Select
            value={member.status}
            onChange={(event) =>
              onUpdate({ status: event.target.value as FamilyMember["status"] })
            }
          >
            {statusSelectValues.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </MemberField>
        <MemberField label="Color accent">
          <Select
            value={member.colorTheme}
            onChange={(event) => onUpdate({ colorTheme: event.target.value })}
          >
            {memberColorThemes.map((theme) => (
              <option key={theme}>{theme}</option>
            ))}
          </Select>
        </MemberField>
        <MemberField label="School / work">
          <Input
            value={member.schoolWorkLabel ?? ""}
            onChange={(event) => onUpdate({ schoolWorkLabel: event.target.value })}
          />
        </MemberField>
        <MemberField label="Age group">
          <Select
            value={member.ageGroup ?? ""}
            onChange={(event) => onUpdate({ ageGroup: event.target.value })}
          >
            <option value="">—</option>
            {ageSelectValues.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </Select>
        </MemberField>
        <MemberField label="Allergies">
          <Input
            value={member.allergies ?? ""}
            onChange={(event) => onUpdate({ allergies: event.target.value })}
          />
        </MemberField>
        <MemberField label="Emergency contact">
          <Input
            value={member.emergencyContact ?? ""}
            onChange={(event) => onUpdate({ emergencyContact: event.target.value })}
          />
        </MemberField>
      </div>
      <MemberField label="Notes">
        <Textarea
          value={member.notes}
          placeholder="Private household notes."
          onChange={(event) => onUpdate({ notes: event.target.value })}
        />
      </MemberField>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Kiosk PIN (this device)
        </p>
        <p className="text-xs leading-relaxed text-slate-600">
          Four digits for the family login screen. The PIN is not shown after it is saved.
        </p>
        <p className="text-sm font-medium text-slate-800">
          {member.pinCode ? "PIN is set" : "Set PIN"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MemberField label="New PIN (4 digits)">
            <Input
              inputMode="numeric"
              autoComplete="off"
              type="password"
              value={pinNew}
              maxLength={4}
              onChange={(e) => setPinNew(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </MemberField>
          <MemberField label="Confirm PIN">
            <Input
              inputMode="numeric"
              autoComplete="off"
              type="password"
              value={pinConfirm}
              maxLength={4}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </MemberField>
        </div>
        {pinError ? <p className="text-sm font-medium text-rose-700">{pinError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={applyPinChange}>
            Save PIN
          </Button>
          {member.pinCode ? (
            <Button type="button" variant="secondary" onClick={clearPin}>
              Remove PIN
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <Button
          className="border border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100"
          onClick={onRemove}
          variant="secondary"
        >
          <Trash2 className="h-4 w-4" />
          Remove from household
        </Button>
      </div>
    </div>
  );
}

export function shouldLogMemberUpdate(updates: Partial<FamilyMember>) {
  return Boolean(
    updates.name ||
      updates.nickname ||
      updates.role ||
      updates.roleLabel ||
      updates.status ||
      updates.colorTheme ||
      updates.schoolWorkLabel ||
      updates.ageGroup,
  );
}
