# Product Ledger - Architecture Documentation

## Overview
A blockchain-based product traceability system built with React/TypeScript frontend, Supabase backend, and PostgreSQL database. The system supports multiple user roles (Admin, Manufacturer, Retailer, Consumer) for tracking products through QR codes.

---

## Technology Stack

### Languages Used
- **TypeScript** - Primary language for frontend and type definitions
- **SQL (PostgreSQL)** - Database schema and migrations
- **JavaScript/JSX** - React components (via TypeScript/TSX)
- **CSS** - Styling (Tailwind CSS)
- **TOML** - Configuration files

---

## Architecture Layers

### 🎨 FRONTEND
**Technology:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui

#### Core Application Files
```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Main app component with routing
├── App.css                     # Global styles
├── index.css                   # Base styles
└── vite-env.d.ts              # Vite type definitions
```

#### Pages (Route Components)
```
src/pages/
├── Index.tsx                   # Landing/home page
├── Auth.tsx                    # Authentication page (login/signup)
├── AdminDashboard.tsx         # Admin control panel
├── ManufacturerDashboard.tsx  # Manufacturer dashboard
├── RetailerDashboard.tsx      # Retailer dashboard
├── ConsumerDashboard.tsx      # Consumer dashboard
├── PendingApproval.tsx        # Pending user approval page
├── ProfilePage.tsx            # User profile management
├── Unauthorized.tsx           # 403 error page
└── NotFound.tsx               # 404 error page
```

#### Components
```
src/components/
├── auth/
│   └── ProtectedRoute.tsx     # Route protection wrapper
│
├── admin/
│   ├── AllUsersTable.tsx      # User management table
│   ├── CreateAdminDialog.tsx  # Create admin user dialog
│   ├── PendingUserCard.tsx    # Pending approval card
│   ├── RejectUserDialog.tsx   # Reject user dialog
│   └── UserDetailsSheet.tsx   # User details side panel
│
├── manufacturer/
│   ├── AllQRCodesSection.tsx  # All QR codes overview
│   ├── ChildQRDetailsSheet.tsx # Child QR details panel
│   ├── CommitMessageDialog.tsx # Commit message dialog
│   ├── CreateMegaQRDialog.tsx  # Create mega QR dialog
│   ├── GenerateChildrenDialog.tsx # Generate child QRs dialog
│   ├── MegaQRCard.tsx         # Mega QR card component
│   ├── MegaQRDetailsSheet.tsx # Mega QR details panel
│   ├── ParentQROverview.tsx   # Parent QR overview
│   └── QRCodeGrid.tsx         # QR code grid display
│
├── retailer/
│   ├── CommitRetailerMessageDialog.tsx # Retailer commit dialog
│   ├── HashLookup.tsx         # Hash lookup component
│   ├── MegaQRProductsSheet.tsx # Mega QR products panel
│   ├── ProductDetailsSheet.tsx # Product details panel
│   ├── QRScanner.tsx          # QR code scanner
│   ├── RetailerHistoryTable.tsx # Retailer history table
│   └── ScannedProductCard.tsx # Scanned product card
│
├── consumer/
│   ├── ProductVerificationResult.tsx # Verification result display
│   └── ReportCounterfeitDialog.tsx  # Counterfeit report dialog
│
├── layout/
│   ├── AppHeader.tsx          # Application header
│   └── AppLayout.tsx          # Main layout wrapper
│
├── ui/                        # shadcn/ui component library (50+ components)
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── alert.tsx
│   ├── aspect-ratio.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── breadcrumb.tsx
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── carousel.tsx
│   ├── chart.tsx
│   ├── checkbox.tsx
│   ├── collapsible.tsx
│   ├── command.tsx
│   ├── context-menu.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── hover-card.tsx
│   ├── input-otp.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── menubar.tsx
│   ├── navigation-menu.tsx
│   ├── pagination.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── resizable.tsx
│   ├── role-badge.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── sidebar.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── sonner.tsx
│   ├── status-badge.tsx
│   ├── switch.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── toggle-group.tsx
│   ├── toggle.tsx
│   ├── tooltip.tsx
│   └── use-toast.ts
│
└── NavLink.tsx                # Navigation link component
```

#### Services & API Layer
```
src/services/
└── api/
    ├── fabric-api.ts          # REST API client for Hyperledger Fabric
    └── mock-data.ts          # Mock data for development
```

#### Contexts & State Management
```
src/contexts/
└── AuthContext.tsx            # Authentication context provider
```

#### Custom Hooks
```
src/hooks/
├── use-mobile.tsx             # Mobile device detection
├── use-toast.ts               # Toast notification hook
├── useAdminUsers.ts          # Admin users data hook
└── useRetailerData.ts        # Retailer data hook
```

#### Type Definitions
```
src/types/
├── auth.ts                    # Authentication types
└── fabric.ts                  # Hyperledger Fabric data types
```

#### Utilities & Libraries
```
src/lib/
├── logger.ts                  # Logging utility
└── utils.ts                   # General utilities
```

#### Integrations
```
src/integrations/
└── supabase/
    ├── client.ts              # Supabase client initialization
    └── types.ts               # Auto-generated Supabase types
```

#### Configuration Files
```
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node-specific TS config
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── eslint.config.js           # ESLint configuration
├── components.json            # shadcn/ui configuration
├── package.json               # Dependencies and scripts
└── index.html                 # HTML entry point
```

#### Public Assets
```
public/
├── favicon.ico                # Site favicon
├── placeholder.svg            # Placeholder image
└── robots.txt                 # SEO robots file
```

---

### 🔧 BACKEND
**Technology:** Supabase (Backend-as-a-Service) - PostgreSQL + Authentication + Real-time

#### Supabase Configuration
```
supabase/
├── config.toml                # Supabase project configuration
└── migrations/                # Database migration files
    ├── 20251209063550_b5266acc-32a8-42f9-bf7c-9f366c32686a.sql
    ├── 20251209063558_e29fb2b0-4c15-4117-b05b-518081a2aa48.sql
    ├── 20251215063148_48f3cd5e-b5b1-4879-9ac5-714e040ed00e.sql
    └── 20251215065353_53970c54-9acb-4590-9f7e-8ed6e5ab2a2f.sql
```

#### Backend Features
- **Authentication:** Supabase Auth (email/password, JWT tokens)
- **Authorization:** Row Level Security (RLS) policies
- **Real-time:** Supabase real-time subscriptions
- **Storage:** File storage for KYC documents (via Supabase Storage)

---

### 🗄️ DATABASE
**Technology:** PostgreSQL (via Supabase)

#### Database Schema

**Tables:**
1. **profiles** - User profile information
   - id (UUID, PK, FK to auth.users)
   - email, full_name, company_name, gst_number
   - phone, address, kyc_documents
   - approved, approval_status, rejection_reason
   - created_at, updated_at

2. **user_roles** - User role assignments
   - id (UUID, PK)
   - user_id (UUID, FK to auth.users)
   - role (app_role enum: admin, manufacturer, retailer, consumer)
   - created_at

3. **mega_qrs** - Batch/product batch data
   - id (UUID, PK)
   - mega_id (TEXT, UNIQUE)
   - mega_hash (TEXT)
   - product, batch_no, mfg_date, expiry_date
   - manufacturer_id (UUID, FK)
   - manufacturer_name, meta (JSONB)
   - version, status (active, recalled, expired)
   - created_at, updated_at

4. **child_qrs** - Individual product unit QR codes
   - id (UUID, PK)
   - child_id (TEXT, UNIQUE)
   - child_hash (TEXT)
   - mega_id (TEXT, FK to mega_qrs)
   - product_snapshot (JSONB)
   - status (active, sold, recalled, returned)
   - created_at, updated_at

5. **committed_messages** - Immutable message log (blockchain-like)
   - id (UUID, PK)
   - mega_id (TEXT, FK, nullable)
   - child_id (TEXT, FK, nullable)
   - message (TEXT)
   - committed_by (UUID)
   - committed_by_role (TEXT)
   - location, device, tx_hash
   - created_at

6. **scan_logs** - Product scan audit trail
   - id (UUID, PK)
   - mega_id (TEXT, FK, nullable)
   - child_id (TEXT, FK, nullable)
   - scanned_by (UUID)
   - scanned_by_role (TEXT)
   - location, device
   - created_at

#### Database Functions
- `has_role(_user_id UUID, _role app_role)` - Check user role
- `get_user_role(_user_id UUID)` - Get user's primary role
- `is_user_approved(_user_id UUID)` - Check approval status
- `handle_new_user()` - Auto-create profile on signup
- `update_updated_at_column()` - Auto-update timestamp

#### Security (RLS Policies)
- Row Level Security enabled on all tables
- Role-based access control (RBAC)
- User-specific data isolation
- Admin override capabilities

---

## 🌐 REST API

### Planned Hyperledger Fabric API Integration

**Base URL:** Configurable via `VITE_FABRIC_API_URL` environment variable (default: `/api`)

**Authentication:** Bearer token from Supabase session

#### API Endpoints

##### Mega QR Endpoints (Manufacturer)
```
POST   /api/mega                          # Create mega QR
GET    /api/mega/:megaID                  # Get mega QR by ID
GET    /api/mega?manufacturerID=:id      # Get manufacturer's mega QRs
POST   /api/mega/:megaID/generate-children # Generate child QRs
POST   /api/mega/:megaID/commit           # Commit message to mega QR
GET    /api/mega/:megaID/children         # Get children by mega ID
```

##### Child QR Endpoints
```
GET    /api/child/:childID                # Get child QR by ID
POST   /api/child/:childID/commit         # Commit message to child QR
```

##### Verification Endpoints
```
GET    /api/verify/:childID               # Verify child QR authenticity
```

##### Audit & Reporting Endpoints
```
GET    /api/audit/logs                    # Get audit logs (with filters)
POST   /api/report/counterfeit            # Submit counterfeit report
POST   /api/admin/recall                  # Recall product (admin only)
```

**Note:** Currently, the API client (`fabric-api.ts`) is implemented but uses mock data. The actual REST API backend for Hyperledger Fabric integration is planned but not yet implemented.

---

## Project Structure Summary

```
product-ledger/
├── 📁 src/                    # Frontend source code
│   ├── 📁 components/         # React components
│   ├── 📁 pages/              # Route pages
│   ├── 📁 services/           # API services
│   ├── 📁 contexts/           # React contexts
│   ├── 📁 hooks/              # Custom hooks
│   ├── 📁 types/              # TypeScript types
│   ├── 📁 lib/                # Utilities
│   └── 📁 integrations/       # External integrations
│
├── 📁 supabase/               # Backend/Database
│   ├── 📁 migrations/         # SQL migration files
│   └── config.toml            # Supabase config
│
├── 📁 public/                 # Static assets
│
├── 📄 package.json            # Dependencies
├── 📄 vite.config.ts          # Build config
├── 📄 tsconfig.json           # TypeScript config
├── 📄 tailwind.config.ts      # Tailwind config
└── 📄 README.md               # Project documentation
```

---

## Key Technologies & Libraries

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool & dev server
- **React Router 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching & caching
- **shadcn/ui** - Component library (Radix UI primitives)
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation
- **Lucide React** - Icon library
- **qrcode.react** - QR code generation

### Backend/Database
- **Supabase 2.87.0** - Backend-as-a-Service
- **PostgreSQL** - Relational database (via Supabase)
- **Row Level Security (RLS)** - Database-level security

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TS-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## Architecture Patterns

1. **Component-Based Architecture** - Modular React components
2. **Context API** - Global state management (Auth)
3. **Custom Hooks** - Reusable logic abstraction
4. **Service Layer** - API abstraction layer
5. **Type Safety** - Full TypeScript coverage
6. **Row Level Security** - Database-level authorization
7. **Role-Based Access Control (RBAC)** - Multi-role system

---

## Environment Variables Required

```
VITE_SUPABASE_URL=              # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY=  # Supabase anon key
VITE_FABRIC_API_URL=            # Hyperledger Fabric API URL (optional)
```

---

## Build & Deployment

- **Development:** `npm run dev` (runs on port 8080)
- **Production Build:** `npm run build`
- **Preview:** `npm run preview`

---

*Last Updated: Based on current codebase analysis*

