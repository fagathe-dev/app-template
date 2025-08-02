# Commit Workflow Guide

This project uses automated conventional commits based on branch naming conventions.

## Branch Naming Convention

Create branches using this pattern: `(us|archi|fix|docs)-<issue-number>-<description>`

### Branch Type Mapping

- `us-` → `feat`: New features/user stories
- `fix-` → `fix`: Bug fixes
- `docs-` → `docs`: Documentation updates
- `archi-` → `chore`: Architecture/maintenance tasks

### Examples

```bash
# Feature branch
git checkout -b us-123-add-user-authentication

# Bug fix branch
git checkout -b fix-456-resolve-login-error

# Documentation branch
git checkout -b docs-789-update-api-docs

# Architecture/maintenance branch
git checkout -b archi-101-setup-docker-config
```

## Commit Process

### 1. Check your branch is valid

```bash
npm run commit:validate
```

### 2. Check what files need to be committed

```bash
npm run commit:status
# or
git status
```

### 3. Add files to staging

```bash
# Add all files
git add .

# Add specific files
git add src/file.php templates/file.twig
```

### 4. Commit with any description

```bash
git commit -m "add user authentication system"
```

The commit message will be **automatically formatted** to:

```
feat(#123): add user authentication system
```

## Automated Features

### Pre-commit Hook

- Validates branch name format
- Shows git status
- Runs code formatting and linting

### Commit Message Hook

- Auto-formats commit messages to conventional format
- Extracts issue number from branch name
- Maps branch type to commit type
- Validates final message format

### Prepare Commit Message Hook

- Suggests commit message based on branch name
- Provides helpful comments in commit editor

## Manual Commands

```bash
# Get help
npm run commit:help

# Check git status
npm run commit:status

# Validate current branch
npm run commit:validate

# Format and lint code
npm run lint-staged
```

## Commit Message Format

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(#issue): description
```

- **type**: feat, fix, docs, chore (auto-determined from branch)
- **#issue**: Issue number (auto-extracted from branch)
- **description**: Your commit description (use imperative mood)

## Examples of Valid Commits

```
feat(#123): add user authentication system
fix(#456): resolve login page redirect issue
docs(#789): update API documentation
chore(#101): configure CI/CD pipeline
```

## Validation Rules

The system validates:

- Branch name follows the required pattern
- Issue number is numeric
- Commit message follows conventional format
- Code passes linting and formatting checks

## Troubleshooting

### Invalid Branch Name

If you get an error about invalid branch name:

```bash
# Rename your current branch
git branch -m new-valid-branch-name

# Or create a new branch with correct format
git checkout -b us-123-your-feature-description
```

### Commit Message Rejection

If commitlint rejects your message:

- Check the branch name follows the pattern
- Ensure issue number is numeric
- The system will auto-format most cases

### Pre-commit Failures

If pre-commit hook fails:

```bash
# Fix linting issues
npm run lint

# Fix formatting
npm run format

# Try commit again
git commit -m "your message"
```
