# ResearchOS — Frontend Specification & UX Architecture
**Version**: 1.0.0  
**Stack**: React 18+ / TypeScript / Vite / Tailwind CSS / TanStack Query / React Router  

---

## 1. Page Hierarchy & Route Inventory

```
/ (Root)
├── /login                            -> Login View
├── /register                         -> Account Registration
├── /dashboard                        -> Global User Dashboard
├── /projects                         -> Project List / Management
└── /projects/:projectId              -> Active Workspace Container
    ├── /overview                     -> Project Workspace Overview
    ├── /papers                       -> Literature Library
    ├── /papers/:paperId              -> Paper Detail & Split PDF Viewer
    ├── /assistant                    -> Grounded AI Workspace Assistant
    ├── /reviews                      -> Literature Review Generator & Editor
    ├── /gap-analysis                 -> Research Gap Analyzer Matrix & Insights
    ├── /experiments                  -> Experiment Tracker & Metric Comparison
    ├── /analytics                    -> Project Metrics & Aggregations
    ├── /reports                      -> Report Export Center
    └── /settings                     -> Project Membership & Configuration
```

---

## 2. Global Layout & Workspace Shell

The UI enforces a persistent project context shell (`AppShell.tsx`):
* **Sidebar**: Workspace navigation divided into **Core Literature** (Overview, Papers, Experiments) and **Intelligence Tools** (Assistant, Reviews, Gap Analysis, Analytics, Reports).
* **Topbar**: Project Selector dropdown, global Search trigger (`Cmd + K`), Processing Job Indicator badge, User Avatar & Profile Menu.
* **Main Content Area**: Active page rendering with explicit loading skeletons and boundary error states.

---

## 3. Screen Specifications & Key Interactions

### 3.1 Literature Library (`/projects/:projectId/papers`)
* **Header**: "Literature Library", Paper count badge, Bulk Actions (`Tag`, `Delete`, `Export Citations`), and `Upload Papers` button (triggers Modal).
* **Search & Filter Toolbar**: Search bar (Title, Author, Method), Multi-select Filter Pills (Methods, Datasets, Publication Year, Tags, RIE Status).
* **Data Table**:
  * Columns: Title & DOI, Authors, Year, Extracted Method, Datasets, Status Badge (`QUEUED`, `PROCESSING`, `READY`, `REQUIRES_OCR`, `FAILED`), Upload Date, Actions.
  * Selection: Checkbox per row for bulk operations.
  * Clicking a row navigates to `/papers/:paperId`.

### 3.2 Paper Detail & PDF Viewer (`/papers/:paperId`)
* **Layout**: Two-column split pane (resizable divider).
* **Left Panel (PDF Viewer)**: Canvas PDF view with page navigation, zoom, and highlight jump functionality for cited passages.
* **Right Panel (Extracted Knowledge & Metadata)**:
  * Tab 1: **Structured Metadata** (Title, Authors, Year, DOI, Abstract, Method, Datasets, Metrics, Findings, Stated Limitations, Future Work). Editable with inline "Save Correction" state.
  * Tab 2: **Extracted Chunks & Provenance** (Searchable chunk list with exact page numbers).
  * Tab 3: **Notes & Annotations** (User-created page-referenced notes).

### 3.3 Grounded AI Assistant (`/projects/:projectId/assistant`)
* **Scope Bar**: Radio pills selecting `Selected Papers (N)`, `Entire Project (M)`, or `Single Paper`.
* **Chat Container**:
  * Scrollable conversation history.
  * Messages support Markdown formatting, code blocks, LaTeX formula rendering.
  * Assistant responses embed inline citation tags `[Paper Title, p. X]`.
* **Citation Drawer / Popover**: Clicking a citation tag opens a side drawer displaying the exact quoted passage, confidence score, and a link to view the source PDF.

### 3.4 Research Gap Analyzer (`/projects/:projectId/gap-analysis`)
* **Top Summary Stats**: Uploaded papers analyzed, unique methods cataloged, unique datasets identified, limitation frequency metrics.
* **Visual Distribution Charts**: Recharts bar charts showing Method Frequencies and Dataset Utilization.
* **Candidate Gaps Section**:
  * Expandable Gap Cards displaying Title, Category (`Method-Dataset Gap`, `Unaddressed Limitation`), Grounding Confidence (`High`, `Medium`), and Explanation.
  * Supporting Evidence drawer listing relevant extracted paper quotes.

---

## 4. UI State Conventions

Every data component strictly implements 5 standard states:
1. **Loading State**: Shimmering skeleton loaders matching table/card structures.
2. **Success State**: Complete rendered data with interactive micro-animations.
3. **Empty State**: Instructive message with single primary CTA (e.g., "No papers uploaded yet. Upload your first PDF to enable RIE features.").
4. **Processing State**: Progress bar / spinner indicating active background processing with job status step indicator.
5. **Error State**: Non-blocking alert badge with explicit failure reason and a "Retry" button.
