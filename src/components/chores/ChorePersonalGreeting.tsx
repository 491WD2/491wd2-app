import { memo } from "react";
import { useChoreShell } from "../../context/ChoreShellContext";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../../types/chore";
import { choreCn, choreTw } from "../../lib/choreUi";

export type ChorePersonalGreetingProps = {
  variant?: "home" | "dashboard";
};

/** Time-aware greeting and household insight from personalization engine. */
function ChorePersonalGreetingInner({ variant = "home" }: ChorePersonalGreetingProps) {
  const { personalization, activeMember, setActiveMember } = useChoreShell();

  return (
    <section
      className={choreCn(
        "wd-chore-hh__greeting",
        variant === "dashboard" && "wd-chore-hh__greeting--dashboard",
        "wd-chore-hh__greeting--enter",
      )}
      aria-labelledby="chore-greeting-title"
    >
      <div className="wd-chore-hh__greeting-main">
        <h2 id="chore-greeting-title" className={choreTw.heading}>
          {personalization.greeting}
        </h2>
        <p className="wd-chore-hh__greeting-sub">{personalization.subtitle}</p>
        {personalization.householdInsight ? (
          <p className="wd-chore-hh__greeting-insight">{personalization.householdInsight}</p>
        ) : null}
        {personalization.aiNudge ? (
          <p className="wd-chore-hh__greeting-ai-nudge" role="status">
            <span className="wd-chore-hh__greeting-ai-nudge-label">Smart tip</span>
            {personalization.aiNudge}
          </p>
        ) : null}
        {personalization.focusTaskTitle ? (
          <p className="wd-chore-hh__greeting-focus">
            <span className="wd-chore-hh__greeting-focus-label">Up next</span>
            {personalization.focusTaskTitle}
          </p>
        ) : null}
      </div>

      <div className="wd-chore-hh__greeting-member" role="group" aria-label="Who is using the kiosk">
        <span className="wd-chore-hh__greeting-member-label">Viewing as</span>
        <div className="wd-chore-hh__greeting-chips">
          <button
            type="button"
            className={choreCn(
              "wd-chore-hh__greeting-chip",
              !activeMember && "wd-chore-hh__greeting-chip--active",
              choreTw.focusRing,
            )}
            onClick={() => setActiveMember(null)}
            aria-pressed={!activeMember}
          >
            Household
          </button>
          {HOUSEHOLD_MEMBERS.map((member) => (
            <button
              key={member}
              type="button"
              className={choreCn(
                "wd-chore-hh__greeting-chip",
                activeMember === member && "wd-chore-hh__greeting-chip--active",
                choreTw.focusRing,
              )}
              aria-pressed={activeMember === member}
              aria-label={`Personalize for ${member}`}
              onClick={() => setActiveMember(member as HouseholdMember)}
            >
              {member}
            </button>
          ))}
        </div>
      </div>

      <div
        className="wd-chore-hh__greeting-meter"
        role="progressbar"
        aria-valuenow={personalization.completionRateToday}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Household completion today"
      >
        <div
          className="wd-chore-hh__greeting-meter-fill"
          style={{ width: `${personalization.completionRateToday}%` }}
        />
        <span className="wd-chore-hh__greeting-meter-label">
          {personalization.completionRateToday}% done today
        </span>
      </div>
    </section>
  );
}

export const ChorePersonalGreeting = memo(ChorePersonalGreetingInner);
