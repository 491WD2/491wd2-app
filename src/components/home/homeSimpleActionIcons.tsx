import type { ReactNode } from "react";

type HomeGlyphProps = {
  className?: string;
};

function Glyph({ className, children }: HomeGlyphProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 56 56" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

function ButtonGlyph({ className, children }: HomeGlyphProps & { children: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function HomeScanCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M16 18h24v20H16z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path
        d="M20 22v12M24.5 22v12M29 22v12M33.5 22v12M38 22v12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M11 20h4M11 36h4M41 20h4M41 36h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 20v4M11 32v4M45 20v4M45 32v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </Glyph>
  );
}

export function HomeShoppingCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <path
        d="M12 20h32l-2.8 18H14.8L12 20Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M18 20l3-6h14l3 6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="42" r="2.8" fill="currentColor" />
      <circle cx="35" cy="42" r="2.8" fill="currentColor" />
    </Glyph>
  );
}

export function HomePantryCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <path
        d="M19 16h18l2 6v22H17V22l2-6Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M17 28h22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M37 14c3 0 5.2 2.2 5.2 4.8 0 3.2-2.8 5.6-5.8 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M37 14v5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M34.5 18.5c1.2-1.8 2.8-2.8 4.5-2.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Glyph>
  );
}

export function HomeChoreCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <path d="M14 42 32 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M32 24 42 14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M12 40 16 44" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M40 10 44 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M44 12 48 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38 8 41 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Glyph>
  );
}

export function HomeMessageCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <path
        d="M12 16h32a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H24l-8 7v-7h-4a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="28" r="2" fill="currentColor" />
      <circle cx="28" cy="28" r="2" fill="currentColor" />
      <circle cx="34" cy="28" r="2" fill="currentColor" />
    </Glyph>
  );
}

export function HomeCalendarCardIcon({ className }: HomeGlyphProps) {
  return (
    <Glyph className={className}>
      <rect x="12" y="16" width="32" height="30" rx="3" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12 24h32" stroke="currentColor" strokeWidth="2.6" />
      <path d="M21 11v7M35 11v7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22" cy="32" r="2" fill="currentColor" />
      <circle cx="28" cy="32" r="2" fill="currentColor" />
      <circle cx="34" cy="32" r="2" fill="currentColor" />
      <circle cx="22" cy="38" r="2" fill="currentColor" />
      <circle cx="28" cy="38" r="2" fill="currentColor" />
      <circle cx="34" cy="38" r="2" fill="currentColor" />
    </Glyph>
  );
}

export function HomeBarcodeButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <path d="M2.5 3.5v9M5 3.5v9M7.5 3.5v9M10 3.5v9M12.5 3.5v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </ButtonGlyph>
  );
}

export function HomeCameraButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <rect x="1.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 4.5 6.8 2.8h2.4l1.3 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    </ButtonGlyph>
  );
}

export function HomePlusRingButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </ButtonGlyph>
  );
}

export function HomeListButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </ButtonGlyph>
  );
}

export function HomePencilButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <path d="M10.5 2.5 13.5 5.5 5.5 13.5 2.5 13.5 2.5 10.5 10.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </ButtonGlyph>
  );
}

export function HomeClockButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5V8l2.2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </ButtonGlyph>
  );
}

export function HomeCalendarButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </ButtonGlyph>
  );
}

export function HomeMailButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="m1.5 4.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </ButtonGlyph>
  );
}

export function HomeArrowButtonIcon({ className }: HomeGlyphProps) {
  return (
    <ButtonGlyph className={className}>
      <path d="M3 8h8.5M8.5 5.5 11 8 8.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </ButtonGlyph>
  );
}
