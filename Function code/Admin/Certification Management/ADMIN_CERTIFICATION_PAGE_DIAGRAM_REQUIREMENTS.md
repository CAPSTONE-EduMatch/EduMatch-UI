# Admin Certification Management - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/certifications/page.tsx` is currently a placeholder form
mirroring the discipline creation UI. It is intended to handle certification
category creation or verification workflows (e.g., accreditation types) but
still uses the mock discipline fields. This document captures the existing
structure and the requirements for converting it into a certification-specific
flow.

---

## 1. CURRENT UI STRUCTURE

- Page renders a centered heading (“Add discipline”) and a card containing two
  text inputs plus two `motion.button` CTAs.
- Input fields are generic text boxes bound to `disciplineName` and
  `subdisciplineName` state variables.
- Buttons call `handleCreateDiscipline` / `handleCreateSubdiscipline`, which
  currently just validate non-empty strings and leave TODO comments for API
  calls.

---

## 2. TARGET CERTIFICATION WORKFLOW

1. **Certification Type Creation** – Replace the first input with fields
   relevant to certifications (e.g., accreditation name, issuing authority).
2. **Document Category Creation** – Second input can represent document
   categories (e.g., operating license, tax certificate) to standardize uploads.
3. **API Integration** – Connect buttons to admin certification endpoints:
   - `POST /api/admin/certifications` for new certification types.
   - `POST /api/admin/certification-categories` for document categories.
4. **Validation** – Enforce naming constraints, uniqueness, and optionally add
   dropdowns to select country/jurisdiction.
5. **Feedback** – Show toasts or inline success/error messages; disable buttons
   while API requests run.

---

## 3. STATE & NAVIGATION

- State hooks mirror those in the discipline page (`useState` for input values,
  `useState` for toggling success states if needed).
- Consider adding a “Back” button similar to the discipline page to return to
  `/admin/certifications/list` (once such a listing exists).

---

## 4. EXTENSIONS

- Add table/list to review existing certification types with edit/delete
  actions.
- Provide bulk import (CSV) for accreditation authorities.
- Tie into institution onboarding so that required document types map to these
  certification definitions.
