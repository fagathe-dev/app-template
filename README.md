# App Template

## Development Guidelines

### Git Workflow

#### Branch Naming Convention

Branches should follow this naming pattern:

```
(us|archi|fix|docs)-numero_issue-description
```

Examples:

- `us-123-add-user-authentication`
- `fix-456-fix-login-error`
- `docs-789-update-readme`
- `archi-101-setup-docker`

#### Commit Messages

We use conventional commits with automatic formatting based on branch names. The format is:

```
type(#issue): description
```

Types are automatically mapped from branch prefixes:

- `us-` → `feat`
- `fix-` → `fix`
- `docs-` → `docs`
- `archi-` → `chore`

Examples:

```
feat(#123): add user authentication system
fix(#456): resolve login page redirect issue
docs(#789): update API documentation
chore(#101): configure CI/CD pipeline
```

### Code Quality Tools

The project uses several tools to ensure code quality:

#### Husky

Pre-commit hooks are configured to run:

- Prettier for code formatting
- ESLint for code quality
- Commitlint for commit message validation

#### Lint-staged

Automatically runs linters on staged files:

- JavaScript/TypeScript files: Prettier + ESLint
- JSON/Markdown files: Prettier

### Getting Started

1. Install dependencies:

```bash
npm install
```

2. The following tools will be automatically set up:

- Husky git hooks
- Lint-staged configuration
- Commitlint rules

3. Start developing:

```bash
npm run dev
```

### Available Scripts

- `npm run build:sass`: Build and minify SASS files
- `npm run sass`: Watch SASS files for changes
- `npm run tsc`: Watch TypeScript files
- `npm run tsc:compile`: Compile TypeScript files
- `npm run tsc:build`: Build TypeScript files
- `npm run build`: Build the project
- `npm run dev`: Start development server
- `npm run lint`: Run ESLint
- `npm run format`: Run Prettier
