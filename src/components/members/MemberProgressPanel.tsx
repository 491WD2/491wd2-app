import type { MemberTaskProgress } from "../../types/memberTasks";

export type MemberProgressPanelProps = {
  progress: MemberTaskProgress;
  streakDays: number;
};

function ProgressRing({
  percent,
  label,
  detail,
}: {
  percent: number;
  label: string;
  detail: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <article className="fh-member-progress__card">
      <div className="fh-member-progress__ring-wrap">
        <svg className="fh-member-progress__ring" viewBox="0 0 88 88" aria-hidden>
          <circle className="fh-member-progress__ring-bg" cx="44" cy="44" r={radius} />
          <circle
            className="fh-member-progress__ring-fill"
            cx="44"
            cy="44"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="fh-member-progress__ring-label">
          <span className="fh-member-progress__ring-pct">{percent}%</span>
          <span className="fh-member-progress__ring-sub">done</span>
        </div>
      </div>
      <h3 className="fh-member-progress__title">{label}</h3>
      <p className="fh-member-progress__detail">{detail}</p>
    </article>
  );
}

export function MemberProgressPanel({ progress, streakDays }: MemberProgressPanelProps) {
  const peakLabel =
    progress.peakDays.length > 0 ? progress.peakDays.join(" · ") : "Keep going!";

  return (
    <section className="fh-member-progress" aria-label="Weekly progress">
      <ProgressRing
        percent={progress.weekly.percent}
        label={`${progress.weekly.emoji} ${progress.weekly.label}`}
        detail={`${progress.weekly.completed} of ${progress.weekly.target} completed`}
      />
      <ProgressRing
        percent={progress.monthly.percent}
        label={`${progress.monthly.emoji} ${progress.monthly.label}`}
        detail={`${progress.monthly.completed} of ${progress.monthly.target} completed`}
      />
      <article className="fh-member-progress__card">
        <div className="fh-member-streak">
          <span className="fh-member-streak__emoji" aria-hidden>
            🔥
          </span>
          <span className="fh-member-streak__value">{streakDays}</span>
        </div>
        <h3 className="fh-member-progress__title">Day streak</h3>
        <p className="fh-member-progress__detail">Peak days: {peakLabel}</p>
      </article>
    </section>
  );
}
