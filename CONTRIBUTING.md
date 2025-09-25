# Contributing Guidelines

Thank you for considering contributing to our Next.js front-end project! This
document outlines our coding standards and commit conventions.

## Development Setup

Install dependencies:

```bash
npm install
```

## Code Style and Formatting

We use ESLint and Prettier to maintain consistent code quality and formatting.

### ESLint Rules

- Follows Next.js core web vitals recommendations
- Warns on unused variables
- Warns on console statements
- Enforces Prettier formatting rules

### Prettier Configuration

#### Global Settings

- Uses tabs for indentation
- Tab width: 2 spaces
- Print width: 80 characters
- Single quotes (default)
- Uses trailing commas (ES5)
- Includes spaces in brackets

#### File-specific Overrides

**JavaScript/TypeScript (.js, .ts)**

- Tab width: 4 spaces
- Double quotes

**React TSX (.tsx)**

- No semicolons
- Default tab width (2)

**JSON/JSONC Files**

- Tab width: 4 spaces
- Double quotes

**Markdown Files**

- Always wrap prose

## Commit Convention

We follow a industry-standard commit message format to maintain a clean git
history.

### Format

```
<type>(<scope>): <subject>
```

or

```
<type>: <subject>
```

### Types

You can use these types for git commit message:

- `feat` : New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring (code changes that neither add new feature nor
  fix a bug)
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI configuration changes
- `build`: Build system changes
- `revert`: Revert previous changes

### Rules

- Type must be lowercase
- Scope is required and must be lowercase
- Subject must be lowercase
- No period at the end of subject
- Subject cannot be empty

### Examples

Valid commits:

```
feat(auth): add google login
fix(navbar): resolve dropdown issue
style(navbar): update navbar background color
docs(readme): update installation steps
```

Invalid commits:

```
Feat: Add feature    # Wrong casing (uppercase is not allowed to type)
fix: fixed bug.      # Has period
chore:               # Empty subject
fix typo	     # Empty type
```

## Pre-commit Hooks

The project uses Husky and lint-staged to run checks before commits:

1. Code formatting and linting will run automatically on staged files
2. Commit messages will be validated against our convention rules

If any of these checks fail, your commit will be blocked until the issues are
resolved. In case of failure, view command output to see and fix all violations.
