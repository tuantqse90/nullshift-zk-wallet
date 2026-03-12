# NullShift Project Init System — Meta Prompt v2.1

> **Mục đích**: Prompt này dùng để khởi tạo (init) bất kỳ project nào trong hệ sinh thái NullShift.
> Khi chạy với Claude Code CLI, nó sẽ tự động scaffold toàn bộ docs, planning, và CLAUDE.md cho project đó.

---

## 🔧 SYSTEM CONTEXT

```yaml
brand: NullShift (nullshift.sh)
brand_guidelines: https://humorous-courage-production.up.railway.app/brand-guidelines.html
pillars: [Privacy, AI, Blockchain, ZK Proofs]
pillar_colors: {Privacy: "#00ff41", AI: "#00ffff", Blockchain: "#ff0080", ZK: "#a855f7"}
aesthetic: hacker / terminal / privacy-first / dark-mode-only
owner: Tun — solo indie builder, ~10yr Python, AI/ML/Web3
tools: Claude Code CLI, Docker, GitHub Actions, Railway
```

---

## 🎨 BRAND GUIDELINES

> **Source**: https://humorous-courage-production.up.railway.app/brand-guidelines.html
> Tất cả projects trong NullShift ecosystem PHẢI tuân theo brand system này.

### Logo

```yaml
wordmark: "nullshift.sh"
format: "null" = #00ff41 (green) | "shift.sh" = #888888 (gray)
background: DARK ONLY — #0a0a0a or darker. NEVER light/mid-tone.
clear_space: Height of "n" character on all sides
rules:
  - Never recolor
  - Never change typeface
  - Never place on light backgrounds
```

### Color System

```yaml
# Core Palette
primary:     "#00ff41"   # --color-primary     / Green
secondary:   "#00ffff"   # --color-secondary   / Cyan
accent:      "#ff0080"   # --color-accent      / Pink
warning:     "#ffaa00"   # --color-warning     / Amber

# Pillar Colors (use when referencing specific pillars)
privacy:     "#00ff41"   # --pillar-privacy    / Green
ai:          "#00ffff"   # --pillar-ai         / Cyan
blockchain:  "#ff0080"   # --pillar-blockchain / Pink
zk:          "#a855f7"   # --pillar-zk         / Purple

# Backgrounds
bg_primary:  "#0a0a0a"   # --bg-primary        / Page BG
bg_secondary:"#111111"   # --bg-secondary      / Secondary BG
bg_card:     "#1a1a1a"   # --bg-card           / Card BG
bg_hover:    "#222222"   # --bg-card-hover     / Card Hover

# Text
text_bright: "#ffffff"   # --color-text-bright / Headings
text_body:   "#e0e0e0"   # --color-text        / Body Text
text_dim:    "#888888"   # --color-text-dim    / Muted/Captions
border:      "#333333"   # --border-color      / Borders
```

### Typography

```yaml
primary_font: "JetBrains Mono"  # Monospace — headings, code, labels, nav, buttons, terminal UI
secondary_font: "Inter"         # Sans-serif — body text, descriptions, long-form

weights: [400 Regular, 500 Medium, 600 SemiBold, 700 Bold]

scale:
  xs:  "0.75rem / 12px"
  sm:  "0.875rem / 14px"
  base: "1rem / 16px"
  lg:  "1.125rem / 18px"
  xl:  "1.25rem / 20px"
  2xl: "1.5rem / 24px"
  3xl: "2rem / 32px"
  4xl: "2.5rem / 40px"
```

### Spacing

```yaml
xs:  "0.25rem / 4px"
sm:  "0.5rem / 8px"
md:  "1rem / 16px"
lg:  "1.5rem / 24px"
xl:  "2rem / 32px"
2xl: "3rem / 48px"
3xl: "4rem / 64px"
4xl: "6rem / 96px"
```

### Components & Patterns

```yaml
buttons:
  primary: "> Execute"     # btn btn-primary
  ghost:   "> View Source"  # btn btn-ghost

status_tags:
  live:     "[LIVE]"       # status-live
  building: "[BUILDING]"   # status-building
  concept:  "[CONCEPT]"    # status-concept

pillar_badges:
  format: '<span class="pillar-badge" data-pillar="{name}">{name}</span>'

terminal_prompt:
  format: "nullshift@labs$ {command}"
```

### Tone & Copy Rules

```yaml
voice:
  - Technical, direct, aggressive. No fluff, no filler.
  - Write like composing a README, not a marketing brochure.
  - Short sentences. Active voice. Cut every unnecessary word.
  - NEVER say "leverage" or "synergy." Say "use" and "combine."
  - Dark mode only. No sunshine metaphors. Think midnight, not midday.
  - Litmus test: "Would a cypherpunk say this?"

syntax_conventions:
  actions: "> prefix"              # > Execute, > Deploy, > View Source
  subtitles: "// comment syntax"   # // engineering across four pillars
  status: "[BRACKETS]"            # [LIVE], [BUILDING], [CONCEPT]
  navigation: "/file-path style"   # /services, /projects, /agents
  prompt: "nullshift@labs$"        # Terminal prompt for UI elements
```

### Design System Rules

```yaml
DO:
  - Use CSS custom properties from variables.css
  - Load data from JSON files, render client-side
  - Use inline SVGs for icons (never icon fonts)
  - Respect prefers-reduced-motion for animations

DONT:
  - Add frameworks, build tools, or CSS preprocessors
  - Use light mode, light backgrounds, or light themes
  - Hardcode colors, fonts, or spacing (use CSS variables)
  - Add tracking, analytics cookies, or third-party scripts
```

---

## 📋 INPUT FORMAT

Mỗi project cần 1 prompt file mô tả project. Đặt tại root:

```
projects/
├── project-alpha/
│   ├── PROMPT.md          ← Mô tả project (input)
│   ├── init.md            ← ★ Generated: Init checklist
│   ├── CLAUDE.md          ← ★ Generated: Claude Code instructions
│   ├── progress.md        ← ★ Generated: Progress tracker
│   └── docs/              ← ★ Generated: Full documentation
│       ├── README.md
│       ├── ARCHITECTURE.md
│       ├── TECH_STACK.md
│       ├── API_SPEC.md          (if applicable)
│       ├── DATABASE_SCHEMA.md   (if applicable)
│       ├── DEV_GUIDE.md
│       ├── TESTING_PLAN.md
│       ├── DEPLOYMENT.md
│       ├── SECURITY.md
│       ├── ROADMAP.md
│       └── CHANGELOG.md
├── project-beta/
│   ├── PROMPT.md
│   └── ...
└── ...
```

---

## 🚀 INIT INSTRUCTIONS

Khi nhận lệnh `init project <tên-project>`, Claude PHẢI thực hiện theo thứ tự:

### Phase 1: Analyze — Đọc hiểu PROMPT.md

1. Đọc `PROMPT.md` trong thư mục project
2. Phân loại project type:
   - `web-app` → cần API_SPEC, DATABASE_SCHEMA, UI_SPEC
   - `cli-tool` → cần CLI_USAGE, CONFIG_SPEC
   - `bot` (Telegram/Discord) → cần BOT_COMMANDS, WEBHOOK_SPEC
   - `smart-contract` → cần CONTRACT_SPEC, AUDIT_CHECKLIST
   - `ml-pipeline` → cần DATA_SPEC, MODEL_SPEC, TRAINING_PLAN
   - `automation` → cần WORKFLOW_SPEC, CRON_SCHEDULE
   - `library/sdk` → cần API_REFERENCE, EXAMPLES
   - `content-pipeline` → cần CONTENT_SPEC, PIPELINE_FLOW
3. Xác định tech stack từ prompt
4. Xác định integration points (APIs, DBs, third-party services)

### Phase 2: Generate — Tạo docs

Tạo toàn bộ docs trong `docs/` folder. Mỗi doc PHẢI:

- Có header rõ ràng với project name
- Có version + last updated date
- Dùng Mermaid diagrams khi cần visualize (architecture, flow, sequence)
- Có "Related Docs" section link tới các docs khác
- Viết bằng tiếng Anh (technical docs), notes bằng tiếng Việt nếu cần

#### Core Docs (LUÔN tạo):

| File | Nội dung |
|---|---|
| `README.md` | Overview, quick start, features, tech stack summary |
| `ARCHITECTURE.md` | System design, component diagram (Mermaid), data flow, key decisions |
| `TECH_STACK.md` | Tất cả dependencies, versions, lý do chọn, alternatives considered |
| `DEV_GUIDE.md` | Setup local dev, coding conventions, Git workflow, PR template |
| `TESTING_PLAN.md` | Unit/Integration/E2E strategy, test commands, coverage targets, CI config |
| `DEPLOYMENT.md` | Docker setup, CI/CD pipeline, env variables, Railway/VPS config |
| `SECURITY.md` | Threat model, auth flow, secrets management, privacy considerations |
| `ROADMAP.md` | Phases with milestones, MVP scope, v1/v2 features, estimated timeline |
| `CHANGELOG.md` | Initialized with v0.0.1 — Project scaffolded |

#### Conditional Docs (tạo theo project type):

| File | Khi nào |
|---|---|
| `API_SPEC.md` | Có REST/GraphQL API → endpoints, request/response, auth |
| `DATABASE_SCHEMA.md` | Có database → ERD (Mermaid), tables, indexes, migrations |
| `UI_SPEC.md` | Có frontend → wireframe descriptions, component tree, responsive plan, **must reference Brand Guidelines** |
| `BOT_COMMANDS.md` | Telegram/Discord bot → command list, permissions, conversation flow |
| `CONTRACT_SPEC.md` | Smart contract → functions, events, access control, gas estimates |
| `MODEL_SPEC.md` | ML project → model architecture, hyperparams, metrics, dataset info |
| `WORKFLOW_SPEC.md` | Automation → pipeline diagram, triggers, error handling |
| `INTEGRATION.md` | Third-party APIs → endpoints, rate limits, auth, fallback strategy |
| `CONTENT_SPEC.md` | Content pipeline → formats, templates, publishing flow |
| `BRAND_TOKENS.md` | Có frontend/UI → CSS variables export, color tokens, typography tokens từ Brand Guidelines |

### Phase 3: Create init.md

File `init.md` là checklist để setup project từ zero:

```markdown
# Init Checklist — [Project Name]

## Status: 🟡 Initializing

### Pre-requisites
- [ ] Python/Node version confirmed
- [ ] Required API keys obtained
- [ ] Docker installed (if needed)

### Environment Setup
- [ ] Clone repo
- [ ] Install dependencies
- [ ] Configure .env from .env.example
- [ ] Verify local dev server runs

### Documentation
- [ ] All core docs generated ✅
- [ ] Conditional docs generated ✅
- [ ] CLAUDE.md configured ✅

### First Tasks
- [ ] Implement core module: [specific]
- [ ] Write first test
- [ ] Setup CI pipeline
- [ ] First deployment to staging

### Verification
- [ ] All tests pass
- [ ] Linting clean
- [ ] Docker build succeeds
- [ ] Docs are accurate and complete
```

### Phase 4: Create CLAUDE.md

`CLAUDE.md` là file instructions cho Claude Code CLI khi làm việc trong project này.

```markdown
# CLAUDE.md — [Project Name]

## Project Overview
[1-2 sentences từ PROMPT.md]

## Tech Stack
[Từ TECH_STACK.md]

## Key Documentation
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API Spec: [docs/API_SPEC.md](docs/API_SPEC.md)
- Database: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- Testing: [docs/TESTING_PLAN.md](docs/TESTING_PLAN.md)
- Deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Security: [docs/SECURITY.md](docs/SECURITY.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
[+ conditional docs nếu có]

## Coding Rules
1. Follow conventions in [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md)
2. Write tests for every new feature (target: >80% coverage)
3. Use type hints (Python) / TypeScript strict mode (JS/TS)
4. All commits follow Conventional Commits format
5. No hardcoded secrets — use .env

## Progress Tracking
**QUAN TRỌNG**: Sau MỖI task hoàn thành, UPDATE [progress.md](progress.md):
- Ghi ngày, task đã làm, files changed
- Update status (🟢 Done / 🟡 In Progress / 🔴 Blocked)
- Nếu có decision quan trọng → ghi vào Decision Log

## Workflow
1. Đọc docs liên quan TRƯỚC khi code
2. Implement theo ROADMAP phases
3. Test → Lint → Commit → Update progress.md
4. Mỗi PR phải reference docs nếu thay đổi architecture/API

## NullShift Standards
- Privacy-first: Minimize data collection, no tracking/analytics
- Terminal aesthetic: CLI-friendly, clean logs, dark mode only
- Solo builder mindset: Pragmatic > Perfect

## Brand Guidelines
**Reference**: https://humorous-courage-production.up.railway.app/brand-guidelines.html
- Colors: Use CSS variables (--color-primary: #00ff41, --color-secondary: #00ffff, etc.)
- Fonts: JetBrains Mono (headings/code/UI), Inter (body text)
- Tone: Technical, direct, no fluff. Write like a README, not a brochure.
- Syntax: `> prefix` for actions, `// comment` for subtitles, `[STATUS]` for tags
- Pillar colors: Privacy=#00ff41, AI=#00ffff, Blockchain=#ff0080, ZK=#a855f7
- Dark mode ONLY. No light backgrounds. No sunshine metaphors.
- No tracking, no analytics cookies, no third-party scripts.
```

### Phase 5: Create progress.md

```markdown
# Progress — [Project Name]

## Current Phase: 🏗️ Phase 1 — MVP

### Sprint Log

| Date | Task | Status | Files Changed | Notes |
|------|------|--------|---------------|-------|
| YYYY-MM-DD | Project initialized | 🟢 Done | All docs | Scaffolded by Claude |

### Decision Log

| Date | Decision | Context | Alternatives Considered |
|------|----------|---------|------------------------|
| YYYY-MM-DD | Chose [X] over [Y] | [Why] | [Options] |

### Blockers
_None currently_

### Upcoming
- [ ] Next task from ROADMAP Phase 1
```

---

## 🔄 BATCH INIT (Multiple Projects)

Khi init nhiều projects cùng lúc:

```
init all projects
```

Claude sẽ:
1. Scan `projects/` directory
2. Tìm tất cả folders có `PROMPT.md`
3. Init từng project theo thứ tự
4. Tạo `projects/OVERVIEW.md` — master index link tới tất cả projects

### OVERVIEW.md Format:

```markdown
# NullShift Projects Overview

> Last updated: YYYY-MM-DD
> Total projects: N

| # | Project | Type | Status | Stack | Phase |
|---|---------|------|--------|-------|-------|
| 1 | project-alpha | web-app | 🟡 Init | Python, FastAPI | Phase 1 |
| 2 | project-beta | bot | 🟡 Init | Python, Telegram | Phase 1 |
| ... | ... | ... | ... | ... | ... |
```

---

## ⚡ QUICK COMMANDS

Sau khi init, user có thể dùng các lệnh:

| Command | Action |
|---------|--------|
| `init project <name>` | Init 1 project |
| `init all projects` | Init tất cả projects có PROMPT.md |
| `update progress <name>` | Mở progress.md và thêm entry mới |
| `show roadmap <name>` | Hiển thị ROADMAP.md |
| `add doc <name> <doc-type>` | Thêm 1 doc mới vào project |
| `status` | Hiển thị OVERVIEW.md |

---

## 🛡️ RULES

1. **KHÔNG BAO GIỜ** bắt đầu code mà chưa đọc docs
2. **LUÔN** update progress.md sau mỗi task
3. **LUÔN** tạo .env.example (KHÔNG bao giờ commit .env thật)
4. **LUÔN** viết CHANGELOG khi release
5. Docs là source of truth — code follows docs, not the other way around
6. Nếu thay đổi architecture → update ARCHITECTURE.md TRƯỚC, code SAU
7. Mỗi project PHẢI có ít nhất 1 test trước khi merge bất kỳ feature nào
8. **LUÔN** tuân theo NullShift Brand Guidelines cho mọi UI/frontend code:
   - Dark mode only (#0a0a0a background)
   - Dùng CSS variables, không hardcode colors/fonts/spacing
   - JetBrains Mono cho headings/code, Inter cho body
   - Pillar colors tương ứng: Privacy=green, AI=cyan, Blockchain=pink, ZK=purple
   - Copy tone: technical, direct, cypherpunk. Không "leverage", không "synergy"
   - Status tags: [LIVE], [BUILDING], [CONCEPT]
   - Action prefix: `>`, Subtitle: `//`, Nav: `/path`
9. **KHÔNG BAO GIỜ** thêm tracking, analytics, hoặc third-party scripts
10. **KHÔNG BAO GIỜ** dùng light mode hoặc light backgrounds

---

## 📐 TEMPLATE PROMPT.md

Nếu chưa có PROMPT.md, dùng template này:

```markdown
# [Project Name]

## One-liner
[Mô tả project trong 1 câu]

## Problem
[Project giải quyết vấn đề gì?]

## Solution
[Giải pháp cụ thể]

## Core Features
- Feature 1
- Feature 2
- Feature 3

## Tech Stack (dự kiến)
- Language: 
- Framework: 
- Database: 
- Deployment: 

## Integrations
- [API/Service 1]
- [API/Service 2]

## MVP Scope
[Phiên bản đầu tiên cần gì?]

## Target Users
[Ai sẽ dùng?]

## NullShift Pillar
[Privacy / AI / Blockchain / ZK — project thuộc pillar nào?]
```

---

*Generated by NullShift Project Init System v2.1 — with Brand Guidelines*
*Builder: Tun | Brand: nullshift.sh*
*Brand Reference: https://humorous-courage-production.up.railway.app/brand-guidelines.html*
