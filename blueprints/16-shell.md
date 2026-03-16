# Shell — Blueprint

**Components**: Header, Sidebar, CommandBar, KillSwitch, VoiceOverlay, AlwaysOnVoice, AIWizard, CoreBanner, InlineFormSheet, Terminal
**Status**: Working — all shell components functional

## Component Map

### Header (`components/shell/Header.tsx`)
- Business name + logo
- Always-on voice toggle (green indicator when active)
- Command bar trigger (Cmd+K)
- Cost indicator + Health score
- Kill switch button
- **Status**: Fully functional

### Sidebar (`components/shell/Sidebar.tsx`, 668 lines)
- 15 main nav items + 2 pinned bottom items
- Drag-to-reorder in edit mode
- Hide/show toggles (pinned items protected)
- Badge counts from Supabase
- Mobile hamburger menu
- localStorage persistence
- **Status**: Fully functional

### CommandBar (`components/shell/CommandBar.tsx`)
- 40+ voice/text commands
- Local intent parsing (no API needed for most commands)
- Voice auto-start on open
- Live waveform visualization
- Auto-execute high-confidence commands (>0.85)
- API fallback for unknown commands
- Voice feedback (TTS)
- **Status**: Fully functional

### AlwaysOnVoice (`components/shell/AlwaysOnVoice.tsx`)
- Continuous background speech recognition
- Auto-restart on idle
- Bottom-left indicator (green pulse)
- Cmd+Shift+L toggle
- localStorage persistence
- Routes unrecognized commands through CommandBar
- **Status**: Fully functional

### KillSwitch (`components/shell/KillSwitch.tsx`)
- 3 levels: Pause One, Pause All, Full Lockdown
- Agent selector for single-agent pause
- Confirmation flow
- **Status**: Fully functional

### AIWizard (`components/shell/AIWizard.tsx`)
- 3 conversational flows: hire_agent, install_skill, configure_model
- Multi-step form with suggestions
- Summary confirmation
- **Status**: Fully functional

### CoreBanner (`components/shell/CoreBanner.tsx`)
- Contextual insights per page section
- Color-coded by priority
- Dismissible
- Action buttons
- **Status**: Partially functional (needs API implementation)

### Forms (5 form components)
- InvoiceForm, ExpenseForm, ContactForm, ProjectForm, DocumentUploadForm
- All with proper validation
- AI prefill support (Invoice, Contact)
- **Status**: All fully functional

### Terminal (`components/shell/Terminal.tsx`)
- Multi-tab xterm.js terminal
- Split panes (vertical/horizontal)
- Bookmarks + recent directories
- WebSocket PTY connection (port 3100)
- **Status**: Fully functional (requires PTY server)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Open command bar |
| Cmd+Shift+V | Push-to-talk voice |
| Cmd+Shift+L | Toggle always-on voice |
| Cmd+T | New terminal tab |
| Cmd+W | Close terminal tab |
| Cmd+D | Split terminal vertical |
| Cmd+Shift+D | Split terminal horizontal |
| Cmd+N | Open in folder (terminal) |
| Cmd+B | Bookmark directory (terminal) |
| Escape | Close modal/cancel recording |
