# Dashboard Preview Visual Specification

## 1. Design Direction

DashboardPreview is a modern household command center with restrained glassmorphism.

The interface should feel:

- clean
- colorful
- calm
- polished
- contemporary
- spacious without feeling empty
- useful from a normal desktop distance
- friendly without feeling childish
- premium without feeling corporate

Target:

80% clean product interface
20% glass/color personality

The design references are inspiration for:

- structured dashboard grids
- crisp typography
- systematic spacing
- controlled use of color
- modern card geometry
- compact navigation
- strong information hierarchy
- subtle glass/material depth

They are NOT inspiration for:

- analytics charts
- financial dashboards
- CRM widgets
- giant KPI graphics
- fake statistics
- excessive gradients
- enterprise dashboard terminology

This is a family household dashboard.

---

## 2. Page Background

Base:

#F4F7FB

Use subtle atmospheric color behind the application.

Supporting atmospheric colors:

Blue:
#DCEBFF

Lavender:
#E9E2FF

Peach:
#FFE4D6

Mint:
#DDF5EC

Suggested background:

background:
  radial-gradient(
    circle at 10% 10%,
    rgba(220, 235, 255, 0.75),
    transparent 30%
  ),
  radial-gradient(
    circle at 90% 12%,
    rgba(233, 226, 255, 0.55),
    transparent 32%
  ),
  radial-gradient(
    circle at 80% 88%,
    rgba(255, 228, 214, 0.45),
    transparent 30%
  ),
  #F4F7FB;

The background should feel softly illuminated.

It must NOT look like an obvious rainbow gradient.

---

## 3. Desktop Application Frame

This first design pass is desktop-first.

The application should visibly sit inside the browser rather than touching every edge.

Preferred viewport outer padding:

24px

Allowed range:

20px–28px

Application width:

calc(100vw - 48px)

Suggested maximum width:

1720px

Center horizontally.

Outer shell radius:

28px

Outer shell surface:

rgba(255,255,255,0.46)

Outer shell border:

1px solid rgba(255,255,255,0.78)

Outer shell shadow:

0 20px 60px rgba(30,41,59,0.08)

Outer shell backdrop blur:

18px

The shell should look like an application surface sitting naturally in the browser.

Do NOT create a fake laptop/device frame.

---

## 4. Layout Architecture

DashboardPreview should retain the application's existing navigation architecture but visually modernize it only inside the preview.

Preferred desktop structure:

Application shell
├── Sidebar
├── Main application area
│   ├── Compact top bar
│   └── Dashboard content
│       ├── Household status header
│       ├── Family access strip
│       ├── Quick Add + Today Snapshot
│       └── Main household grid

Primary dashboard information order:

1. Date / time / weather / household status
2. Family members
3. Quick Add
4. Today Snapshot
5. Kitchen duty + today's chores
6. Calendar + Upcoming
7. Messages / notifications
8. Shopping List
9. Pantry / storage alerts

This hierarchy is intentional.

Do not rearrange it without approval.

---

## 5. Sidebar

Preferred desktop width:

220px

Allowed:

208px–232px

Padding:

16px

Navigation item height:

44px

Navigation horizontal padding:

12px

Navigation gap:

6px

Navigation radius:

12px

Section spacing:

24px above section heading
8px below section heading

Sidebar background:

rgba(255,255,255,0.62)

Sidebar border:

1px solid rgba(255,255,255,0.72)

Active navigation background:

rgba(255,255,255,0.82)

The active state may use:

- a small accent indicator
- subtle tinted background
- slightly stronger text/icon color

Do not recreate the large warm-orange Home pill from the production dashboard.

The sidebar should visually recede behind the dashboard content.

---

## 6. Top Bar

Preferred height:

60px

Allowed:

56px–64px

Horizontal padding:

18px

Control gap:

8px

Background:

rgba(255,255,255,0.62)

Backdrop blur:

16px

Border:

1px solid rgba(255,255,255,0.70)

Radius:

16px–18px where appropriate

Standard icon button:

40px × 40px

Icon size:

18px–20px

The top bar should feel lightweight and functional.

---

## 7. Main Dashboard Spacing

Content padding:

22px

Primary grid gap:

18px

Allowed:

16px–20px

Use the following spacing rhythm whenever practical:

4px
8px
12px
16px
20px
24px
32px

Avoid arbitrary values where one of these will work.

---

## 8. Primary Glass Card

Default major dashboard surface:

background:
rgba(255,255,255,0.72)

border:
1px solid rgba(255,255,255,0.82)

backdrop-filter:
blur(14px)

border-radius:
20px

box-shadow:
0 10px 30px rgba(30,41,59,0.07)

padding:
18px

Large cards may use:

20px padding

Compact cards:

14px–16px

Glass should create subtle depth.

Glass is not the primary visual feature.

---

## 9. Glassmorphism Limits

Maximum normal card blur:

18px

Preferred:

14px

Do not exceed:

20px

Avoid:

- ultra-transparent surfaces
- 30px–40px blur
- heavy white glowing borders
- glass card inside glass card inside glass card

Nested information surfaces should usually be opaque or nearly opaque.

The interface must remain understandable if backdrop-filter is unavailable.

---

## 10. Nested Content Surfaces

Use for:

- chore rows
- upcoming events
- messages
- notifications
- shopping items
- pantry alerts

Background:

rgba(248,250,252,0.82)

Radius:

12px

Padding:

10px–12px

Border:

1px solid rgba(226,232,240,0.72)

Shadow:

none or extremely subtle

Nested rows should feel quieter than their containing card.

---

## 11. Radius Hierarchy

Application shell:

28px

Large major surface:

22px

Standard dashboard card:

20px

Compact card:

16px

Nested row:

12px

Button:

10px–12px

Chip:

9999px

Do not introduce random radius values.

---

## 12. Typography

Use the existing project sans-serif font.

Do not install or import another font for DashboardPreview.

Primary text:

#18212F

Secondary:

#667085

Muted:

#98A2B3

Strong secondary:

#475467

Optional dashboard page title:

28px
700
line-height 1.15

Time:

40px–48px
700
line-height 1

Never exceed:

52px

Card heading:

18px
650–700
line-height 1.25

Section heading:

14px–15px
700

Body:

14px
line-height 1.45

Secondary/meta:

12px–13px
line-height 1.4

Small label:

11px–12px
600
letter-spacing approximately 0.02em

Do not use the large decorative serif typography from the current Home screen.

---

## 13. Semantic Color System

### Primary Accent

Blue:

#4F7CFF

Soft:

#E8EFFF

### Calendar / Events

Blue-violet:

#6376F6

Soft:

#ECEEFF

### Messages / Notifications

Lavender:

#8B6FE8

Soft:

#F0EBFF

### Shopping

Mint:

#32B88B

Soft:

#E2F7F0

### Kitchen / Chores

Coral:

#F18B64

Soft:

#FFF0E8

### Pantry / Storage

Amber:

#EAA43A

Soft:

#FFF4DC

### Success

#32A675

Soft:

#E6F6EF

### Warning

#D99124

Soft:

#FFF3DA

### Error

#D95757

Soft:

#FDEAEA

Use semantic color intentionally.

Do not make every card a different saturated color.

---

## 14. Approved Gradients

Gradients are accents, not default surfaces.

Blue / lavender:

linear-gradient(
  135deg,
  rgba(79,124,255,0.16),
  rgba(139,111,232,0.12)
)

Peach / lavender:

linear-gradient(
  135deg,
  rgba(241,139,100,0.15),
  rgba(139,111,232,0.10)
)

Mint / blue:

linear-gradient(
  135deg,
  rgba(50,184,139,0.12),
  rgba(79,124,255,0.10)
)

Gradients may be used for:

- compact household status header
- selected state
- subtle visual accent

Do not fill ordinary list cards with gradients.

---

## 15. Shadow System

Use three levels only.

LOW

0 4px 14px rgba(30,41,59,0.045)

STANDARD

0 10px 30px rgba(30,41,59,0.07)

ELEVATED

0 16px 40px rgba(30,41,59,0.10)

Elevated is reserved for:

- popovers
- menus
- drawers
- modals
- genuinely floating interactive controls

Static dashboard cards should normally use STANDARD or LOW.

---

## 16. Borders

Primary glass card:

1px solid rgba(255,255,255,0.82)

Neutral divider:

1px solid rgba(226,232,240,0.72)

Stronger neutral divider if necessary:

#E4E7EC

Avoid dark card outlines.

---

## 17. Buttons

Primary:

height: 40px
radius: 10px–12px
horizontal padding: 14px–16px
background: #4F7CFF
text: white

Compact:

height: 36px

Icon button:

40px × 40px

Secondary:

background:
rgba(255,255,255,0.76)

border:
1px solid rgba(208,213,221,0.85)

Avoid turning every button into a pill.

Pill geometry is reserved primarily for statuses, filters and compact chips.

---

## 18. Icons

Use Lucide.

Do not install another icon package.

Standard:

18px

Small:

16px

Prominent status:

20px–22px

Preferred stroke width:

1.75–2

Avoid oversized decorative icons in every card.

---

## 19. Status Chips

Height:

28px–32px

Horizontal padding:

8px–10px

Font:

12px–13px

Radius:

9999px

Kitchen:

background #FFF0E8
text #B95F3C

Shopping:

background #E2F7F0
text #247A61

Calendar:

background #ECEEFF
text #4F5FC7

Messages:

background #F0EBFF
text #674EC1

Status chips should communicate information, not simply decorate a surface.

---

## 20. Compact Household Header

This replaces the oversized current Home masthead treatment in the preview.

Preferred desktop height:

160px

Allowed:

145px–180px

Padding:

22px

Radius:

22px

Suggested information architecture:

LEFT
- greeting
- current time
- date

CENTER
- household status
- kitchen status

RIGHT
- weather
- compact secondary status

The exact column distribution may adapt naturally to content.

No giant FamilySite title.

No giant banner.

No decorative floating circles occupying large portions of the component.

No fake AQI/weather display.

A low-opacity gradient or atmospheric highlight is acceptable.

---

## 21. Family Access Strip

Avatar:

32px

Selected avatar maximum:

36px

Gap:

8px

Member control height:

36px

Member padding:

6px 10px 6px 6px

Family members should feel quickly accessible.

Do not create large individual cards for each member.

Preserve current navigation/access behavior.

---

## 22. Quick Add

Quick Add is operationally important and must remain prominent.

Present it as a compact command area.

Use the existing four Quick Add actions.

Do not redesign Quick Add into a promotional hero.

Prefer:

icon
short action label

Controls may use small soft semantic backgrounds.

Maintain existing route URLs exactly.

---

## 23. Today Snapshot

Exactly four household status metrics:

1. chores
2. events
3. shopping
4. messages

Preferred desktop layout:

4 equal columns

Preferred height:

96px–110px

Minimum:

88px

Padding:

14px

Count:

24px–28px
700

Label:

12px–13px

Icon:

18px

Use semantic accent colors.

Do NOT use:

- graphs
- sparklines
- trend percentages
- finance-style indicators
- fake comparison metrics

These are household counts, not analytics.

---

## 24. Main Dashboard Grid

Use CSS Grid.

Do not use absolute positioning.

Primary desktop split:

LEFT UTILITY REGION:
approximately 38%

RIGHT INFORMATION REGION:
approximately 62%

Conceptually:

grid-template-columns:
minmax(300px, 0.38fr)
minmax(0, 0.62fr)

Gap:

18px

LEFT region:

1. Kitchen duty + today's chores
2. Shopping List
3. Pantry / storage alerts

RIGHT region:

Top:
- Calendar
- Upcoming

Bottom:
- Messages / notifications

The layout should feel asymmetric but balanced.

---

## 25. Calendar / Upcoming Split

Inside the right region:

Calendar:

approximately 62%–66%

Upcoming:

approximately 34%–38%

Gap:

16px–18px

Calendar useful minimum height:

360px

IMPORTANT:

The production Home dashboard uses its own mini-month generated by buildFridgeMiniMonth.

DashboardPreview must preserve that model.

Do NOT substitute FullCalendar into the Home preview.

The full Calendar route may use FullCalendar separately.

Calendar day cells should use:

- light neutral structure
- subtle current-day indication
- restrained event dots/markers
- minimal visual chrome

Upcoming should display concise chronological rows.

---

## 26. Kitchen Duty + Today's Chores

Kitchen section should answer immediately:

- who has kitchen duty?
- is the duty completed?
- what chores remain today?

Use:

- member avatar/initial
- name
- compact status
- concise chore rows

Do not build analytics.

A small progress indicator may only be used if the underlying real data makes it genuinely useful.

Existing mutation behavior must remain unchanged.

---

## 27. Messages / Notifications

Use a unified presentation.

Show:

- sender/source
- concise message
- relevant status
- time where currently available
- unread state where applicable

Do not recreate a full inbox.

Use lavender as the primary semantic accent.

Message and notification actions must continue navigating to the existing routes.

---

## 28. Shopping

Use mint/green as the semantic accent.

Present:

- outstanding items
- concise rows
- inline add
- open-shopping action

Preserve:

- duplicate detection
- redirect behavior
- createActivity behavior
- existing setData mutation path

Do not mock shopping content.

---

## 29. Pantry / Storage Alerts

Use amber as the primary alert accent.

Surface existing real information such as:

- low stock
- expiring food
- fridge count
- freezer count
- pantry count

Do not fabricate alerts.

Avoid making normal storage information look like an emergency.

---

## 30. Weather

Current production Home has no real weather integration.

It currently displays a static placeholder.

DashboardPreview must NOT invent weather data.

Use an honest state such as:

Weather
Local forecast unavailable

or preserve the current placeholder concept in a cleaner visual treatment.

Do not show:

- fake temperatures
- fake AQI
- fake forecast icons representing real conditions
- fake location data

Real weather integration can be a separate future task.

---

## 31. List Density

Minimum desktop row height:

44px

Comfortable target:

48px

Row gap:

6px–8px

Avoid unnecessarily tall list rows.

The dashboard should show meaningful information without becoming cramped.

---

## 32. Motion

Hover:

150ms–180ms ease

Modal/drawer:

180ms–240ms

Allowed card interaction:

- small background change
- up to 1px–2px translation
- slightly stronger shadow

Avoid:

- bouncing
- floating animations
- large scaling
- constant motion
- animated decorative blobs

Respect prefers-reduced-motion.

---

## 33. Accessibility

Glassmorphism must not reduce usability.

Ensure:

- readable text contrast
- visible keyboard focus
- semantic states do not depend solely on color
- icon-only buttons have accessible labels
- important controls have approximately 40px–44px targets
- the design remains understandable without backdrop-filter
- reduced-motion preferences are respected

---

## 34. Explicit Design Prohibitions

Do NOT introduce:

- analytics charts
- CRM widgets
- finance widgets
- revenue cards
- trend charts
- donut analytics
- fake weather
- fake AQI
- giant hero graphics
- giant brand title
- decorative paper stacks
- scrapbook visual metaphors
- large floating pastel blobs
- excessive gradients
- excessive blur
- high-saturation neon
- multiple icon libraries
- another typography system

---

## 35. Functional Constraints

Visual redesign must not alter existing household logic.

According to the existing Home functionality map:

- production Home receives data and setData from useFamilyData
- Home itself does not call Supabase directly
- Quick Add navigates using existing /quick-add query contracts
- kitchen duty has a special local mutation path
- today's chore rows have existing inline toggle behavior
- Shopping inline-add has duplicate detection and createActivity behavior
- the Home mini-calendar uses buildFridgeMiniMonth
- weather is currently only a placeholder
- messages and notifications are local-only in cloud preview
- kitchen schedule/completion data are local-only in cloud preview

Those behaviors are contracts.

DashboardPreview may replace presentation, not these contracts.

---

## 36. Preview Token Layer

Prefer preview-scoped CSS variables.

Recommended starting point:

.dashboard-preview {
  --dp-bg: #F4F7FB;

  --dp-text: #18212F;
  --dp-text-secondary: #667085;
  --dp-text-muted: #98A2B3;

  --dp-blue: #4F7CFF;
  --dp-calendar: #6376F6;
  --dp-message: #8B6FE8;
  --dp-shopping: #32B88B;
  --dp-kitchen: #F18B64;
  --dp-pantry: #EAA43A;

  --dp-card:
    rgba(255,255,255,0.72);

  --dp-card-strong:
    rgba(255,255,255,0.86);

  --dp-nested:
    rgba(248,250,252,0.82);

  --dp-border:
    rgba(255,255,255,0.82);

  --dp-divider:
    rgba(226,232,240,0.72);

  --dp-radius-shell: 28px;
  --dp-radius-large: 22px;
  --dp-radius-card: 20px;
  --dp-radius-compact: 16px;
  --dp-radius-row: 12px;

  --dp-gap: 18px;

  --dp-shadow-low:
    0 4px 14px rgba(30,41,59,0.045);

  --dp-shadow:
    0 10px 30px rgba(30,41,59,0.07);

  --dp-shadow-elevated:
    0 16px 40px rgba(30,41,59,0.10);

  --dp-blur: 14px;
}

Tailwind v4 utilities may be used where doing so improves readability.

Do not alter global Tailwind values solely for DashboardPreview.

---

## 37. Desktop Review Widths

Review the preview at approximately:

1280px
1440px
1600px
1728px
1920px

The intended sweet spot is approximately:

1440px–1728px

At larger desktop widths, the application should retain visible breathing room around the shell.

At 1280px, reduce unnecessary exterior space rather than creating horizontal scrolling.

Do not perform the tablet/mobile redesign yet.

However:

- use Grid/Flexbox
- use minmax
- avoid absolute positioning
- avoid fragile fixed widths
- avoid unnecessary horizontal overflow

so future responsive work remains possible.

---

## 38. Visual Restraint Test

Before a component is accepted, ask:

1. Does it use more than one strong accent color?
If yes, simplify.

2. Is glass nested inside glass?
If yes, simplify.

3. Is blur contributing to hierarchy?
If no, reduce/remove it.

4. Is the card taller than the information requires?
If yes, reduce it.

5. Could a flat soft tint replace a gradient?
If yes, strongly consider the flat tint.

6. Is an icon conveying information?
If no, consider removing it.

7. Does this look like financial analytics software?
If yes, simplify.

8. Does this resemble the old warm scrapbook Home?
If yes, modernize.

9. Does decoration compete with household information?
If yes, remove decoration.

10. Does the dashboard feel calm when viewed as one whole screen?
It should.

---

## 39. Final Intended Feeling

The finished preview should feel like:

a polished contemporary household operating system.

Not:

a Figma concept,
a bank dashboard,
an analytics template,
a CRM,
a scrapbook,
or a glassmorphism demonstration.

Color should make the dashboard pleasant.

Structure should make it useful.

Glass should provide depth.

Household information should remain the star.
