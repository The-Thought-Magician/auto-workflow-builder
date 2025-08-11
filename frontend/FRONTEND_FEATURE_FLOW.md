# Frontend Feature & Flow Document (MUI Redesign Plan)

## 1. Overview
Current frontend uses Mantine components. Goal: migrate visual layer to Material UI (MUI v5) (core + joy selectively) for a coherent Material Design experience, improve information hierarchy, accessibility, responsiveness, and component reuse. Functionality (API calls, state) remains intact.

### Elevated Design Vision (2025 Startup Aesthetic)
We will go beyond a straight MUI swap and adopt a hybrid, token‑driven system combining:
* MUI (structural/layout, data display, form density, theming infra)
* Radix Primitives (headless accessible overlays: dropdown, dialog, navigation menu, tooltip) for finer motion + layering control
* Framer Motion (micro‑interactions, entrance choreography, layout transitions)
* Optional Tailwind (utility sugar for spacing/typography & rapid iteration) layered via `@mui/system` + `tw` macro OR keep pure SX if avoiding dual systems (decision gate: if velocity blocked by SX, add Tailwind)
* CSS Variables Design Tokens: colors, elevation, radii, blur, gradients, translucency for glass / frosted panels
* Iconography: MUI Icons + Lucide (if needed for sharper outline look)

Core stylistic pillars:
1. Dark-first adaptive surface scaling (subtle elevation lightening) + accent gradient (indigo → violet) used sparingly for focus zones (primary actions, active nav, CTA banners).
2. Spatial hierarchy through layered translucency (backdrop-filter blur for side panels / dialogs) rather than heavy borders.
3. Motion as meaning: duration ramp (40ms micro, 120ms primary nav, 240ms modal) with spring easing for chat message arrival & workflow graph reveal.
4. Reduced chrome: flatten non-interactive surfaces, emphasize affordances via contrast + subtle inner/outer glow on focus states.
5. Density toggles (future): ability to switch between Comfortable / Compact data table spacing.

Advanced enhancements roadmap (staged):
| Stage | Enhancement | Libraries | Notes |
|-------|-------------|-----------|-------|
| 1 | Core theme tokens + layout migration | MUI | Replace Mantine, parity baseline |
| 2 | Navigation micro-interactions | Framer Motion, Radix | Animate drawer collapse / indicator glide |
| 3 | Chat message streaming effect | Framer Motion | Type / fade sequence, skeleton bubble pre-fill |
| 4 | Credential modal multi-step patterns | Radix Dialog + Progress + Framer | Animated stepper for OAuth vs API key flows |
| 5 | Glass panels + dynamic blur | Native CSS vars/backdrop-filter | Performance budget check (FPS > 55) |
| 6 | Data views upgrade | MUI DataGrid / Virtualization | Sort / filter / column density |
| 7 | Theming & personalization | CSS Vars + localStorage | Accent color picker, stored mode |
| 8 | Accessibility polish | Axe / Radix semantics | Ensure no color contrast < 4.5:1 |

Key Differentiators vs Commodity Dashboards:
* Elevated onboarding (animated gradient shimmer on auth card, subtle scale-in) 
* Conversational builder area with focus ring “spotlight” when user typing (radial gradient) 
* Credential requirement cards: progress ring + context doc snippet preview hover 
* Workflow graph panel: entrance cascade (nodes stagger in) and highlight path on hover.

Performance Guardrails:
* Target Lighthouse Performance ≥ 90, avoid global heavy shadows; prefer layered subtle shadows + GPU-friendly transforms.
* Bundle splitting: vendor chunk for MUI, separate async chunk for workflow visualizer (React Flow) and Radix heavy primitives.
* Motion reduce: respect `prefers-reduced-motion` (disable large transitions, keep necessary focus outlines).

Implementation Adjustments:
* Introduce `design/tokens.css` exporting CSS variables; hook into MUI theme with `createTheme({ cssVariables: { } })`.
* Wrap app with a `MotionConfig` (Framer) controlling reduced motion.
* Build a `useDesignTokens()` helper to sync selected accent + density into `document.documentElement` vars.
* Radix integration: create thin wrappers (`ui/Dropdown.tsx`, `ui/Dialog.tsx`) applying consistent animation + theming classes.
* Replace action menus (currently Mantine Menu) with Radix DropdownMenu for finer keyboard & animation control.

Risk Mitigation:
* Phase migration: keep Mantine temporarily for notifications only until Snackbar system replacement ready.
* Add visual regression screenshot baseline (future CI) before advanced styling stage.

Success Metrics:
* Time-to-interactive unaffected (< previous +5%).
* Number of distinct spacing values reduced to < 8.
* No accessibility violations (axe) on core flows (Auth, Chat, Workflow detail, Credentials).
* Perceived polish: internal heuristic review checklist (animation consistency, focus clarity, hierarchy, loading states) passes 100%.

Next immediate step after this doc update: implement token + theme scaffolding and migrate Layout + Auth pages with enhanced styling & motion.

## 2. Pages & Purpose
| Route | Page | Purpose |
|-------|------|---------|
| /login | LoginPage | User authentication (email/password) |
| /signup | SignUpPage | Account registration |
| / (redirect) | Layout root | Authenticated shell with nav + header |
| /chat | ChatPage | Conversational workflow creation + credential prompts |
| /workflows | WorkflowsPage | List & manage workflows |
| /workflows/:id | WorkflowDetailPage | Visualize, edit config, view run history |
| /credentials | CredentialsPage | Manage stored service credentials |
| /settings | SettingsPage | Update profile & subscription info |
| * | NotFoundPage | 404 fallback |

## 3. Global Layout
- Use `Box`, `AppBar`, `Toolbar`, `Drawer` (permanent on mdUp, temporary on smDown), `List`, `ListItemButton`, `ListItemIcon`, `ListItemText`, `Avatar`, `Menu`, `MenuItem`, `Typography`, `IconButton`, `Divider`.
- Responsive pattern: mini variant drawer collapsing to icons (using MUI docs: Side Navigation Icons Menu / Vertical Tabs optional). Breakpoints: drawer width 240px desktop, 64px mini, temporary overlay on mobile.
- Theme: dark mode primary palette (blue) with support for switching later (scaffold). Use `CssBaseline`.

## 4. Theming & Styling
- Create `theme.js` with dark theme: primary (indigo / blue), background default #121826, paper #1E2433, success/ error consistent.
- Typography scale: h5 for section titles, body2 for metadata.
- Utilize `sx` prop spacing (system spacing multiples of 8) referencing docs (mb, theme spacing). 
- Provide custom variants if needed for chat bubbles via `styled()` Box wrappers.

## 5. Shared Components (MUI replacements)
| Component | Purpose | MUI Primitive(s) | Notes |
|-----------|---------|------------------|-------|
| AppLayout | Shell (header + drawer + content + user menu) | Drawer, AppBar, Toolbar, Box, Typography, Avatar, Menu | Replaces `Layout.jsx` |
| NavSidebar | Navigation list | List, ListItemButton, ListItemIcon, ListItemText, Tooltip | Collapsed icon-only mini variant |
| ChatMessage | Chat bubble | Paper / Box, Typography | Variant user/assistant coloring |
| CredentialRequestCard | Credential request UI | Card, Typography, Alert, TextField, Button, Chip, List | Replace Mantine card |
| DataTable (basic) | Simple table wrapper | Table, TableHead, TableRow, TableCell, TableBody, IconButton, Menu | Reusable for workflows & credentials |
| StatusSwitch | Workflow status | Switch, FormControlLabel | Inline in table |
| JsonEditor (lightweight) | Config textarea | TextField multiline (monospace) | Could later integrate code editor |
| SectionHeader | Title + actions row | Stack / Box / Typography / ButtonGroup | Consistent spacing |

## 6. Page Component Design
### Login / Signup
- Centered `Container maxWidth="xs"` inside full-screen gradient (or plain dark) background.
- Use `Paper` with elevation, `Typography` for heading, `TextField` (email / name / password), `LoadingButton` (if adding @mui/lab) or `Button` with `startIcon` optional.
- Error helperText via `TextField` `error` & `helperText`.
- Link to opposite page via `Typography` + `Link` component (MUI). Reference docs: Add Button and Link for User Actions; Basic Input Usage.

### ChatPage
- Layout: `Stack` vertical; main chat area: `Paper` height ~70vh flex column.
- Scrollable messages: `Box` with `overflowY: auto` using `ref`.
- Input: multiline `TextField` (variant outlined) capturing Enter (send) vs Shift+Enter (newline).
- Action row: `Chip` (for AI Powered label) + `Button` send.
- Messages: user vs assistant styling using theme palette (primary vs background.paper). Could leverage `Paper` variant or `Box` with `sx`.
- Pending credential requests: map to redesigned `CredentialRequestCard` using `Card`, `Alert`, `List`, `TextField`.

### WorkflowsPage
- Header row: `SectionHeader` (Title + "New Workflow" disabled button placeholder / future dialog).
- Table: MUI `Table size="small"` referencing Dense Table Example snippet (dense variant). Columns: Name (Button / Link), Status (Switch), Updated, Created, Actions (IconButton with Menu). Use `Menu` for actions.
- Loading: `LinearProgress` or `CircularProgress` centered.

### WorkflowDetailPage
- Title + Tabs (`Tabs` variant enclosed). Tabs: Visualizer, Configuration, Run History.
- Visualizer panel: Keep React Flow container with Paper border.
- Configuration: multiline `TextField` (monospace `InputProps={{ sx:{ fontFamily: 'monospace' }}}`) + Save & Reset buttons (`Stack direction="row" spacing={2}`).
- History: Table (reuse DataTable) minimal columns Execution ID, Status, Started.

### CredentialsPage
- Header: SectionHeader (Title + Add Credential Button).
- Table (Service, Added, Actions). Actions menu with Test, Revoke.
- Add Credential Modal: `Dialog` with `DialogTitle`, `DialogContent` containing `TextField select` (or `<TextField select>{MenuItem}</TextField>` or `Autocomplete`), Token field, `DialogActions` Save.
- Testing state indicated by replacing action icon with progress or using `Backdrop` on row cell.

### SettingsPage
- `Paper` container. Fields: Name, New Password using `TextField`, `Button` Save.
- Subscription subsection separated by `Divider` and heading typography.

### NotFoundPage
- Centered `Container` with large `Typography variant="h4"` + Button to go home.

## 7. User Flow Summary
1. Visitor hits /login or /signup -> submits credentials -> token stored -> navigated to /chat.
2. User describes workflow in chat -> assistant replies; if missing credentials, credential request cards appear -> user adds credential -> card disappears.
3. Once workflow created, user navigates to Workflows list, toggles status, views details.
4. In detail page, user can inspect graph, edit raw JSON config, view run history.
5. User manages credentials centrally in Credentials page and tests validity.
6. User updates profile in Settings.

## 8. Component to MUI Mapping (Detailed)
| Feature | Current Mantine | MUI Replacement |
|---------|-----------------|-----------------|
| Layout Flex / Box | Flex / Box / Group / Stack | Box + Stack + Toolbar / Grid v2 where needed |
| Sidebar Nav | Box + NavLink + ThemeIcon | Drawer + List + ListItemButton + ListItemIcon + ListItemText + Tooltip |
| Header user menu | Menu, UnstyledButton, Avatar | AppBar + Toolbar + Avatar + Menu + IconButton |
| Forms | TextInput / PasswordInput | TextField type=email/password |
| Notifications | showNotification (Mantine) | Keep for now or replace later with MUI Snackbar queue (future) |
| Table | Table | MUI Table |
| Switch | Switch | MUI Switch |
| Modal | Modal | Dialog |
| Tabs | Tabs | MUI Tabs |
| Badge | Badge | Chip / Badge |
| Alert | Alert | Alert |
| Card | Paper/Card | Card |
| ScrollArea | ScrollArea | Box with overflowY or `SimpleBar` optional |

## 9. Accessibility & UX Enhancements
- Ensure all interactive elements have `aria-label` where icon-only.
- Focus outlines: rely on MUI focus-visible styles.
- Color contrast: verify dark theme contrast with primary (#1976d2 default) on dark surfaces.
- Keyboard: Drawer togglable with menu button on mobile; Enter to send chat; ESC closes dialogs.

## 10. Migration / Implementation Steps
1. Add MUI dependencies (`@mui/material @emotion/react @emotion/styled @mui/icons-material`). Optionally `@mui/lab` for LoadingButton.
2. Create `src/theme.js` and wrap app in `ThemeProvider` + `CssBaseline` in `main.jsx`.
3. Replace `Layout.jsx` with `AppLayout.jsx` using Drawer & AppBar.
4. Replace `Sidebar.jsx` with integrated drawer nav list.
5. Create shared components folder: `components/layout/AppLayout.jsx`, `components/common/SectionHeader.jsx`, `components/chat/ChatMessage.jsx`, `components/credentials/CredentialRequestCard.jsx` (rewritten), `components/common/DataTable.jsx` as abstraction if helpful.
6. Update each page to swap Mantine imports for MUI.
7. Remove Mantine specific providers/usages (if any). Keep logic/stores intact.
8. Test flows manually with Playwright: login, chat send, credential add (mock), workflows list interactions, workflow detail tabs, settings save.
9. Remove unused Mantine dependencies (optional later PR) after stable.

## 11. Additional Future Enhancements (Not in current scope)
- Snackbar notification system with queue.
- Theme mode toggle (light/dark) stored in localStorage.
- DataGrid Pro for workflow history and credentials (sorting, pagination) if dataset grows.
- Monaco editor for JSON configuration.
- Drag-and-drop workflow builder integrated with MUI panels.

## 12. Verification Checklist
- [ ] All pages render without Mantine imports.
- [ ] Navigation drawer responsive (desktop permanent, mobile temporary).
- [ ] Login & Signup validation errors show under fields.
- [ ] Chat messages styled correctly; Enter vs Shift+Enter works.
- [ ] Credential request card functional (save + notification placeholder).
- [ ] Workflows table actions menu functional (Run, View/Edit, Delete, History nav).
- [ ] Workflow detail tabs switch + configuration save/reset works.
- [ ] History table renders entries.
- [ ] Credentials table list + Test + Revoke + Add dialog works.
- [ ] Settings save updates name; password optional.
- [ ] 404 page reachable.

## 13. Referenced MUI Docs Snippets
Included concepts: Dense Table Example, Basic Input Usage, Input Variants, Bottom Navigation pattern (for possible future mobile nav), List customization, Theme spacing (mb), Alert usage, Tabs vertical example (not implemented yet), etc.

---
This document guides the refactor from Mantine to MUI. Next steps: implement theme & layout foundation, then migrate pages iteratively while keeping functionality parity.
