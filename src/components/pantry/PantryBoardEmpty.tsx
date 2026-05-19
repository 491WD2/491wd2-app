export type PantryBoardEmptyProps = {
  emoji?: string;
  title: string;
  hint: string;
  compact?: boolean;
};

export function PantryBoardEmpty({
  emoji = "📋",
  title,
  hint,
  compact = false,
}: PantryBoardEmptyProps) {
  return (
    <div className={compact ? "fh-pantry-board__empty" : "fh-pantry-board__global-empty"}>
      <span className="fh-pantry-board__empty-emoji" aria-hidden>
        {emoji}
      </span>
      <p className="fh-pantry-board__empty-title">{title}</p>
      <p className="fh-pantry-board__empty-hint">{hint}</p>
    </div>
  );
}
