# Design Guidelines - Sistema de Gestão de Certidões Negativas

## Design Approach
**Selected System**: Modern Dashboard Pattern inspired by Linear, Notion, and enterprise productivity tools
**Justification**: This is a data-intensive productivity application requiring clarity, efficiency, and robust information architecture. The design prioritizes scanability, quick decision-making, and reducing cognitive load for daily operational use.

## Typography System
- **Primary Font**: Inter (via Google Fonts CDN) for exceptional readability in data-heavy interfaces
- **Hierarchy**:
  - Page Titles: text-3xl font-semibold
  - Section Headers: text-xl font-semibold
  - Card Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Labels/Metadata: text-sm font-medium
  - Helper Text: text-xs font-normal

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12 consistently
- Component padding: p-6 or p-8
- Card spacing: gap-6
- Section margins: mb-8
- Icon-text gaps: gap-2
- Form field spacing: space-y-4

**Grid Structure**:
- Sidebar: Fixed 256px width (w-64) on desktop, collapsible on mobile
- Main content: flex-1 with max-w-7xl container and px-6 lg:px-8
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Certificate listings: Full-width tables with structured columns

## Core Components

### Navigation Sidebar
- Fixed left sidebar spanning full viewport height
- Logo/brand at top (h-16 with centered content)
- Main navigation items with icons from Heroicons (outline style)
- Active state: Subtle background treatment and medium font-weight
- Bottom section for user profile with avatar, name, and role badge
- Compact state on mobile (icons only, expandable)

### Dashboard Layout
- **Status Cards Grid** (4 cards on desktop):
  - Total Certidões, Válidas, Vencidas, Próximas ao Vencimento
  - Each card: Large number (text-4xl font-bold), label, icon, and visual indicator
  - Minimum height: h-32
- **Quick Actions Bar**: Horizontal row of primary action buttons (+ Nova Certidão, Gerar Relatório)
- **Recent Activity Table**: Last 10 certificates with quick-view columns (Cliente, Tipo, Vencimento, Status)
- **Upcoming Expirations Section**: Visual timeline or list view with date prominence

### Certificate Management Table
- **Structure**: Dense, scannable table with zebra striping (optional subtle treatment)
- **Columns**: Cliente, Tipo de Certidão, Órgão Emissor, Data de Emissão, Validade, Status, Ações
- **Status Badges**: Pill-shaped badges with distinct visual treatments for Válida/Vencida/Próxima ao Vencimento
- **Row Actions**: Dropdown menu (3-dot icon) for Ver, Editar, Download, Excluir
- **Filters**: Top bar with search input, status filter dropdowns, date range picker
- **Pagination**: Bottom controls with items-per-page selector

### Forms (Cadastro/Edição)
- **Layout**: Single column form with consistent field spacing (space-y-6)
- **Field Groups**: Related fields grouped with section headers
- **Input Types**:
  - Text inputs: Full-width with labels above (text-sm font-medium mb-2)
  - Select dropdowns: For Tipo, Órgão Emissor, Cliente
  - Date pickers: For datas de emissão and validade
  - File upload: Drag-and-drop zone for PDF with file preview list
- **Actions**: Right-aligned button group (Cancelar, Salvar) with spacing gap-3

### Notification Center
- **Panel**: Slide-in from right (w-96 on desktop)
- **Item Structure**: Icon, title, timestamp, read/unread indicator
- **Grouping**: By date (Hoje, Ontem, Esta Semana)
- **Empty State**: Illustration or icon with helpful message
- **Mark All as Read**: Top-right action button

### User Management (Admin)
- **User Table**: Nome, Email, Perfil, Último Acesso, Status, Ações
- **Profile Badges**: Visual distinction for Administrador/Contador/Visualizador
- **Add User Modal**: Centered modal (max-w-md) with form fields
- **Permission Matrix**: Clear visual representation of access levels

## Component Library
- **Buttons**: Consistent height (h-10), rounded corners (rounded-lg), icon support, loading states
- **Input Fields**: Consistent height (h-10), rounded borders (rounded-lg), focus states with subtle treatment
- **Cards**: Rounded corners (rounded-xl), subtle border, hover states for interactive cards
- **Modals**: Centered overlay with backdrop (max-w-2xl for forms, max-w-md for confirmations)
- **Toasts**: Top-right notifications for success/error feedback
- **Icons**: Heroicons (24px for navigation, 20px for buttons, 16px for inline)

## Responsive Behavior
- **Desktop (lg:)**: Full sidebar + multi-column layouts
- **Tablet (md:)**: Collapsible sidebar + 2-column grids
- **Mobile (base)**: Hidden sidebar (hamburger menu) + single-column stacking

## Animations
**Minimal, purposeful motion only**:
- Sidebar collapse/expand: 200ms ease-in-out
- Modal entrance: Subtle fade + scale (150ms)
- Dropdown menus: Fade in (100ms)
- No scroll-triggered animations
- No decorative motion

## Images
**No hero images required** - This is a dashboard application focused on data and functionality, not marketing. Use icons and illustrations only for:
- Empty states (centered, small illustrations)
- Error states
- User avatars (circular, 40px for sidebar, 32px for tables)