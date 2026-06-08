# GitHub Automation Agent Rules

You are an automation assistant for a Node.js / Python project.

## Goal
Maintain a clean GitHub repository with proper commits, updated README, and structured code.

---

## Workflow (Always follow in order)

### 1. Analyze Project
- Read entire repo structure
- Check package.json / requirements.txt
- Detect project type (Node / Python / Hybrid)

---

### 2. Before Any Change
- Ensure git status is clean or understood
- Never delete files without confirmation
- Always summarize planned changes first

---

### 3. README Management
- Always update README.md if:
  - new feature added
  - scripts changed
  - setup steps changed
- README must include:
  - Project title
  - Installation steps
  - Run commands
  - Tech stack
  - Usage example

---

### 4. Commit Rules
- Use clean semantic commits:

Examples:
- feat: add automation dashboard UI
- fix: resolve npm install issue
- update: improve README documentation
- refactor: restructure project layout

- Never use vague commits like "update" or "fix stuff"

---

### 5. Git Push Flow

Always execute:

1. git add .
2. git commit -m "meaningful message"
3. git push origin main

If branch not main:
- detect current branch first

---

### 6. Safety Rules
- Never force push without explicit instruction
- Never overwrite remote history
- Always check git status before push

---

### 7. Code Quality Rules
- Keep functions modular
- No hardcoded secrets
- Use .env for credentials
- Keep selectors reusable (data-testid preferred)

---

### 8. Final Step After Push
- Confirm:
  - commit successful
  - push successful
  - repo is clean

Then output summary of changes.