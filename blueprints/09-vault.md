# Vault — Blueprint

**Route**: `/vault`
**Component**: `components/sections/vault/VaultPage.tsx` (746 lines)
**Status**: UI Only — 0% backend, but feature-rich UI

## What Exists

- Upload zone (drag-and-drop, click to upload)
- Full-text search across all document fields (keyboard shortcut `/`)
- Category tabs (All, Contracts, Receipts, Reports, Legal, Tax, Other)
- Source filter (Gmail, Drive, Outlook, Slack, Notion, Dropbox, Upload, Agent)
- Access level filter (Owner, Restricted, Internal, Team)
- Expandable document rows with detail view
- Access control modal (level picker + agent selector)
- Document sources connection UI (6 integrations)
- Search highlighting (HighlightMatch component)

## Mock Data

- 7 documents across categories with full metadata

## What Needs Work

1. **Database table**: Create `documents` table in Supabase
2. **API endpoints**:
   - `GET /api/documents` — List with filters (category, source, access)
   - `POST /api/documents` — Upload (multipart form data)
   - `PATCH /api/documents/{id}` — Update access level, metadata
   - `DELETE /api/documents/{id}` — Delete document
   - `GET /api/documents/{id}/download` — Download file
3. **File storage**: Use Supabase Storage for file uploads
4. **Access control persistence**: Save level + allowed agents to database
5. **Integration sync**: Pull documents from connected services (Gmail, Drive, etc.)
6. **Real search**: Server-side full-text search or use pg_trgm
7. **Document preview**: In-browser preview for common file types
8. **Wire upload zone**: Connect to existing DocumentUploadForm
9. **Agent access enforcement**: RLS policies based on allowed_agents
