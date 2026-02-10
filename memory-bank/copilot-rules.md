## 🚨 Security: Never Upload Secrets

- Do not store API keys or `.env` in repo.
- Use `.env.example` with placeholders.
- If a secret is leaked: rotate credentials, purge history, notify team.

---

## 🚦 Feature Development Workflow Rules

### Phase Gates
- **Never skip phases** - PRD must be approved before Design, Design before Tasks, Tasks before Code
- **Never code without tasks** - All implementation must be tracked in tasks.md
- **One task at a time** - Complete and test each task before moving to the next

### Memory Bank Updates
- **Update incrementally** - Don't wait until the end to update memory bank files
- **Update activeContext.md** - After every significant change or decision
- **Update progress.md** - After completing each task
- **Update copilot-rules.md** - When discovering new patterns or project-specific rules

### Documentation Standards
- **Use Mermaid for diagrams** - Prefer flowcharts and sequence diagrams in markdown
- **Task IDs are required** - Format: `FEATURE-001`, `FEATURE-002`, etc.
- **Acceptance criteria per task** - Every task needs clear definition of done

### Code Quality
- **Tests are mandatory** - Write tests alongside code, not after
- **Review before completion** - Validate task acceptance criteria before marking done
- **Update docs with code** - Keep documentation in sync with implementation

---

## 🎯 Project-Specific Patterns

_This section will grow as project patterns emerge. Add patterns discovered during development._
