# Stitch Prompt: ResearchOS Minimalist Frontend

Copy and paste the exact prompt below into **Stitch** to generate the frontend:

---

```markdown
Create a modern, clean, minimalist, and professional Single Page Application (SPA) web client named "ResearchOS". ResearchOS is an AI-powered academic workspace for researchers to organize papers, extract insights, run grounded RAG queries, discover research gaps, and generate literature reviews.

### Design Aesthetics & Philosophy:
- **Style:** Minimalist, editorial, neat, and distraction-free (inspired by Linear, Notion, and academic platforms).
- **Color Palette:**
  - Background: Crisp off-white `#F9FAFB` and clean white `#FFFFFF` card surfaces.
  - Borders: Subtle 1px neutral gray dividers `#E5E7EB`.
  - Typography: Crisp sans-serif (Inter/system-ui), charcoal `#111827` for high contrast text, slate `#4B5563` for secondary descriptions.
  - Accent: Deep Slate `#1E293B` and focused Royal Blue `#2563EB` for primary action buttons and active states.
  - Status Badges:
    - Ready: Soft green badge (`#ECFDF5`, text `#059669`, border `#A7F3D0`)
    - Extracting / Queued: Soft blue badge with pulse spinner (`#EFF6FF`, text `#2563EB`, border `#BFDBFE`)
    - Failed: Soft red badge with a "Reprocess" action (`#FEF2F2`, text `#DC2626`, border `#FECACA`)
- **Tone:** Professional, reliable, and uncluttered. No loud gradients or gamified elements.

---

### Architecture & Base URL:
- Backend Base URL: `http://localhost:8000/api/v1`
- Authentication: JWT Bearer Token stored in `localStorage` under `access_token`. All authenticated requests include `Authorization: Bearer <access_token>`.
- Responsive layout: Collapsible left sidebar, top context bar with active project switcher, and a fluid main workspace area.

---

### Core Views & Features Required:

#### 1. Authentication (Modal or Dedicated View)
- Login Form: OAuth2 password flow (`POST /auth/login` with `username` as email and `password` as form-urlencoded).
- Register Form: JSON payload (`POST /auth/register` with `{email, password, display_name}`).
- Displays user avatar and name in the top right or bottom sidebar with a "Log out" button.

#### 2. Project Management (Workspace Switcher)
- Sidebar project dropdown / switcher calling `GET /projects`.
- "Create New Project" modal (`POST /projects` with `{name, description, research_objective}`).
- Show project details, paper count, and archive/delete option (`DELETE /projects/{id}`).

#### 3. Papers Library & Extraction Pipeline
- Drag-and-drop file uploader accepting PDF files (`POST /projects/{id}/papers` as multipart/form-data).
- Shows immediate response: `202 Accepted` with paper status set to `QUEUED`.
- Paper List Table: Shows title, file size, upload timestamp, and status badge (`QUEUED`, `EXTRACTING`, `READY`, `FAILED`).
- **Auto-Polling:** When any paper has status `QUEUED` or `EXTRACTING`, automatically poll `GET /projects/{id}/papers` every 3 seconds until status is updated.
- Reprocess Action: If a paper is `FAILED`, display a subtle "Reprocess" icon button that triggers `POST /projects/{id}/papers/{paper_id}/reprocess`.
- Delete action with confirmation (`DELETE /projects/{id}/papers/{paper_id}`).

#### 4. Grounded Research Assistant (RAG Chat)
- Conversational chat UI scoped to the active project (`POST /projects/{id}/assistant/chat`).
- Payload: `{ query: string, scope_type: "project" | "paper", selected_paper_ids?: string[] }`.
- Response handles:
  - `answer`: Rendered as clean Markdown (with bullet points, bolding, code/formula formatting).
  - `citations`: An interactive side panel or inline expandable card showing source paper title, page/chunk index, and matched excerpt text.
  - `grounded`: Green badge "100% Grounded in your papers" when true, or a disclaimer when partial.

#### 5. Literature Review Synthesizer
- Configuration Panel:
  - Input: Research Topic (`topic`).
  - Dropdown: Target Audience (`target_audience`: `general`, `expert`, or `practitioner`).
  - Number Input / Slider: Number of papers to synthesize (`max_papers`, 1–20).
  - "Generate Literature Review" button with a sleek skeleton loading animation.
- API: `POST /projects/{id}/reviews`.
- Results View: Editorial markdown view of the synthesized literature review with a "Copy to Clipboard" button and a list of cited papers at the bottom.

#### 6. Research Gap & Novelty Explorer
- Input: Topic focus query (`POST /projects/{id}/gap-analysis` with `{ project_id, topic_focus }`).
- Two-Column Results Display:
  - Left Column: **Identified Literature Gaps** (unexplored intersections, limitations in current methodologies).
  - Right Column: **Promising Future Directions** (high-impact next steps, actionable experiments).

#### 7. Project Analytics Dashboard
- Summary stat cards (`GET /projects/{id}/analytics`):
  - Total Papers Indexed
  - Total Text Chunks in pgvector
  - Extracted Scientific Entities Count

---

### UX Details:
- Provide smooth tab switching between: **Papers Library**, **Assistant**, **Literature Review**, **Gap Analysis**, and **Analytics**.
- Handle empty states gracefully (e.g., prompt user to upload papers if the library is empty).
- Provide clear error toasts if requests fail or token expires.
```
