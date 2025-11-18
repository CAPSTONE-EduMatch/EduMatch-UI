# Admin Create Discipline - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/disciplines/create/page.tsx` provides a lightweight form for
creating disciplines and subdisciplines. The current implementation captures
text inputs and leaves TODO hooks for API calls; it serves as the UI blueprint
for connecting to POST endpoints in the admin discipline service.

---

## 1. FRONTEND COMPONENTS

- **`AdminDisciplinePage`** – page-level component rendered at
  `/admin/disciplines/create`.
- UI built with `Card`/`CardContent` wrappers, `motion.button` for animated CTA
  buttons, and standard `<input>` fields styled with utility classes.
- Header includes a “Back” button that routes back to `/admin/disciplines` using
  `useRouter`.

---

## 2. STATE & VALIDATION

- `disciplineName`, `subdisciplineName` – controlled inputs stored in local
  state via `useState`.
- `handleCreateDiscipline` and `handleCreateSubdiscipline` ensure the respective
  field has a non-empty trimmed value before firing API calls (currently TODO
  stubs).
- Extend to include client-side validation (max lengths, uniqueness checks)
  before hitting the server.

---

## 3. EXPECTED API CONTRACTS

1. **POST `/api/admin/disciplines`**
   - Body: `{ name: string }` – creates a new discipline record.
   - Response: `{ success: boolean, data: Discipline }`.

2. **POST `/api/admin/subdisciplines`**
   - Body: `{ name: string, disciplineId: string }` – create subdiscipline tied
     to existing discipline.
   - Consider replacing the free-text discipline field with a select component
     once the API supports listing disciplines.

Both handlers should show success/failure toasts and clear the inputs on
success.

---

## 4. USER FLOW

1. Admin navigates from `/admin/disciplines` to the create page.
2. Inputs the new discipline and/or subdiscipline name.
3. Clicks “Create” or “Create subdiscipline”; corresponding handler validates
   input and (after wiring) calls the API.
4. On success, show confirmation (toast/modal) and optionally redirect or reset
   the form.

---

## 5. NEXT STEPS

- Replace TODO comments with actual fetch/axios calls.
- Add select dropdown for existing disciplines when creating a subdiscipline.
- Handle API errors gracefully (inline text, toasts) and display loading states
  on buttons while requests are in flight.
