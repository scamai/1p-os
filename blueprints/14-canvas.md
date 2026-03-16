# Canvas — Blueprint

**Route**: `/canvas`
**Component**: `components/sections/canvas/CanvasPage.tsx` (291 lines)
**Status**: UI Only — 0% backend, fully hardcoded

## What Exists

- Split-view layout (sidebar + content area)
- Sidebar with canvas list (title, agent, timestamp)
- Main content with markdown-style rendering
- Basic markdown parsing (headings, bullets, checkboxes, tables, bold, italic)
- Prompt input bar for AI editing
- Export and Share buttons (non-functional)

## Mock Data

- 4 canvases: Weekly Report, Proposal, Blog Post, Q2 Growth Plan
- Each with full markdown content

## What Needs Work

1. **Database table**: Create `canvases` table (id, title, content, agent_id, type, created_at, updated_at, business_id)
2. **API endpoints**:
   - `GET /api/canvases` — List all canvases
   - `POST /api/canvases` — Create new canvas
   - `PATCH /api/canvases/{id}` — Update content
   - `DELETE /api/canvases/{id}` — Delete canvas
3. **Real markdown rendering**: Use `react-markdown` or `marked` instead of line-by-line parsing
4. **AI editing**: Wire prompt input to `/api/ai/chat` with canvas content as context
5. **New canvas creation**: Form or AI-driven creation
6. **Real-time editing**: Optimistic updates as user types or AI edits
7. **Export**: PDF/DOCX generation from canvas content
8. **Share**: Generate shareable links
9. **Canvas types**: Template system for reports, proposals, plans
10. **Version history**: Track edits over time
11. **Collaborative editing**: Multiple agents can contribute to same canvas
