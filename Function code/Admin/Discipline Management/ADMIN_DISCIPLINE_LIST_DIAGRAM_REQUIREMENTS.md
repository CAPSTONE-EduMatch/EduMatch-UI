# Admin Discipline List - Components & Requirements for Sequence & Class Diagrams

## Overview

The Admin Discipline List page (`src/app/admin/disciplines/page.tsx`) is the
control center for managing disciplines and subdisciplines. It currently uses
`mockSubdisciplines` for UI scaffolding but is structured to connect to
`/api/admin/disciplines` with filters, pagination, and inline editing via modal
dialogs.

---

## 1. FRONTEND COMPONENTS

### 1.1 `AdminDisciplinesPage`

- Handles search, status filter, pagination, and modal state for editing a
  subdiscipline.
- Displays summary cards (total subdisciplines, etc.) using `Card`/`CardContent`
  and `Users` icon.

### 1.2 `AdminTable`

- Receives `columns`, `data`, `currentPage`, `totalPages`, `onPageChange`, etc.
- Columns render ID, subdiscipline name, discipline, status chips, created date,
  and “View Details” button (opens modal).

### 1.3 `Modal`

- When a row is selected, `Modal` opens with editable inputs for name,
  discipline, and status toggles.
- Save button currently logs updates; future implementation should call
  PATCH/PUT API.

### 1.4 Filters & Inputs

- Search input uses `<input>` with `Search` icon styling (component-level state
  `searchQuery`).
- Status pills (All/Active/Inactive) update `statusFilter` state.

---

## 2. FUTURE API FLOW

Replace `mockSubdisciplines` with API calls:

1. **GET `/api/admin/disciplines?search=&status=&page=&limit=`**
   - Returns `{ success, data: Subdiscipline[], pagination }`.
   - Use `useEffect`/`useQuery` to fetch when `searchQuery`, `statusFilter`, or
     `currentPage` change.

2. **PATCH `/api/admin/disciplines/:id`**
   - Payload: `{ subdisciplineName, discipline, status }`.
   - On success, refresh the list and close the modal.

3. **POST `/api/admin/disciplines`** (handled in Create page) for new entries.

---

## 3. STATE MANAGEMENT

- `searchQuery`, `statusFilter`, `currentPage` drive the filtering/pagination
  logic.
- `selectedSubdiscipline`, `isModalOpen`, `editedName`, `editedDiscipline`,
  `editedStatus` store modal context.
- Derived arrays: `filteredSubdisciplines` applies search and status filters;
  `paginatedSubdisciplines` slices current page results.

---

## 4. USER FLOW

1. Admin lands on `/admin/disciplines` and sees summary cards plus table.
2. Typing in search input filters the list in real time (currently client-side;
   will be server-side once API wiring is added).
3. Clicking status pills toggles between all/active/inactive.
4. “View Details” opens the modal with editable fields; Save triggers
   `handleSaveChanges` (TO-DO for API update).
5. Pagination controls adjust `currentPage` to display next set of
   subdisciplines.
6. “Add discipline” CTA (button at top) routes to `/admin/disciplines/create`
   (via Router in the create page) to add new entries.

---

## 5. EXTENSION IDEAS

- Connect to TanStack Query for caching API responses similar to user/post
  management.
- Add bulk import/export actions for disciplines.
- Implement optimistic updates in the modal to improve UI responsiveness.
