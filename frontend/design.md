# ResearchOS — Design System & Interface Specification (`design.md`)

## 1. Vision & Design Philosophy
**ResearchOS** is a professional, high-precision research workspace built for academics, R&D teams, and scientists. 
The aesthetic is **calm, clean, uncluttered, and editorial**.
- **No gimmicks:** Avoid neon gradients, loud gamified badges, or over-saturated visuals.
- **Content-first:** Typography and whitespace drive hierarchy. Papers, citations, analysis reports, and chat answers take center stage.
- **Subtle visual feedback:** High contrast ratios, delicate 1px borders, gentle state transitions, and clear loading/polling spinners.

---

## 2. Color Palette & Theme Tokens

Light mode is the primary foundation for a distraction-free academic workspace (with optional dark mode support).

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-app: #f9fafb;          /* Clean canvas, subtle gray */
  --bg-surface: #ffffff;      /* Cards, modals, sidebars */
  --bg-surface-hover: #f3f4f6;
  --bg-muted: #f1f5f9;

  /* Borders & Dividers */
  --border-subtle: #e5e7eb;   /* 1px clean separation */
  --border-strong: #d1d5db;

  /* Typography Colors */
  --text-primary: #111827;    /* Slate/Charcoal ink */
  --text-secondary: #4b5563;  /* Subtitles, labels */
  --text-muted: #9ca3af;      /* Placeholders, timestamps */

  /* Brand / Primary Accent (Deep Academic Indigo) */
  --primary: #1e293b;         /* Deep slate primary */
  --primary-accent: #2563eb;  /* Actionable blue link / button */
  --primary-accent-hover: #1d4ed8;

  /* Status Colors */
  --status-ready-bg: #ecfdf5;
  --status-ready-text: #059669;
  --status-ready-border: #a7f3d0;

  --status-pending-bg: #eff6ff;
  --status-pending-text: #2563eb;
  --status-pending-border: #bfdbfe;

  --status-failed-bg: #fef2f2;
  --status-failed-text: #dc2626;
  --status-failed-border: #fecaca;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

---

## 3. Typography & Hierarchy
- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- **Monospace (Citations & Code):** `JetBrains Mono`, `Fira Code`, monospace.
- **Scale:**
  - `Display / Page Title`: 24px–28px, Bold (`font-weight: 700`), Letter-spacing: -0.02em.
  - `Section Header (H2)`: 18px–20px, Semi-bold (`font-weight: 600`), Letter-spacing: -0.01em.
  - `Subheading (H3)`: 15px–16px, Medium (`font-weight: 500`).
  - `Body`: 14px, Regular (`font-weight: 400`), Line-height: 1.6.
  - `Metadata / Badges / Footnotes`: 12px, Medium (`font-weight: 500`).

---

## 4. Layout Architecture

### Global Layout Structure
```
+---------------------------------------------------------------------------------------+
|  [Logo: ResearchOS]   | Project: [Dropdown Select v]   |  Search...  | [User Profile] |
+---------------------------------------------------------------------------------------+
| SIDEBAR               | MAIN CONTENT AREA                                             |
| • Dashboard           |                                                               |
| • Papers Library (12) |  [Tab navigation or active view]                             |
| • AI Assistant (RAG)  |                                                               |
| • Literature Review   |  Dynamic screens render here with clean card boundaries,      |
| • Gap Analysis        |  consistent 24px margins, and responsive layouts.             |
| • Project Analytics   |                                                               |
|                       |                                                               |
| --------------------- |                                                               |
| • Settings / Log Out  |                                                               |
+---------------------------------------------------------------------------------------+
```

### Component Guidelines

#### 1. Paper Cards & Table Items
- Each paper shows: **Title**, **Authors/Year**, **Processing Badge** (`READY`, `EXTRACTING`, `QUEUED`, `FAILED`), and **Actions** (View, Reprocess if failed, Delete).
- Papers currently in `EXTRACTING` or `QUEUED` have an active animated spinner and poll `GET /projects/{id}/papers` every 3 seconds until status transitions to `READY` or `FAILED`.

#### 2. Research Assistant (RAG Chat)
- Conversational chat feed with split viewport:
  - **Left / Center**: Q&A stream with cleanly formatted Markdown answers.
  - **Right Panel (or inline expandable drawer)**: **Citations drawer** showing ground truth chunks, confidence scores, and paper sources.
- Grounded indicator badge: Green checkmark ("100% Grounded in Project Papers") or amber advisory ("Partial Knowledge / General AI Context").

#### 3. Literature Review Generator
- Left sidebar configuration:
  - Input: Topic / Focus Area.
  - Dropdown: Target Audience (`general`, `expert`, `practitioner`).
  - Slider: Number of papers to include (`max_papers`).
  - "Generate Synthesis" primary action button with loading skeleton.
- Main pane: Editorial document renderer with copy-to-clipboard, export Markdown button, and cited paper references at the bottom.

#### 4. Research Gap & Novelty Explorer
- Clean two-column card view:
  - **Identified Gaps** (Left Column): Missing literature intersections, unvalidated hypotheses, dataset gaps.
  - **Proposed Future Directions** (Right Column): Actionable research angles with impact assessment.

#### 5. Project Analytics
- Metric stat cards: Total Papers, Knowledge Chunks, Extracted Entities, Vector Index Status.

---

## 5. Micro-Interactions & States
- **Loading:** Minimal pulse skeletons or quiet circular spinners (16px).
- **Empty States:** Friendly iconography, descriptive copy ("No papers uploaded yet"), and a clear action button ("Drop PDF to start extraction").
- **Error States:** Polite non-blocking toast notifications or contextual alerts with actionable retry buttons (e.g. `Reprocess Paper`).
