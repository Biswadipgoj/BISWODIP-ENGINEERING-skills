<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Orchestration — how `/dip` plans and runs subagents

`/dip <goal>` runs in five steps:

1. **Load the law**: the router skill.
2. **Plan**: `dip plan` reads the repository and the goal and writes `.biswodip/PLAN.md` and `plan.json`.
3. **Refine**: `dip-planner` checks the plan against the code, writes acceptance criteria, and gives every file area one owner (`.biswodip/TASKS.md`).
4. **Run the waves**: the build agents run in parallel, then `dip-quality` and a security review run in parallel on the diff.
5. **Gate**: the main agent fixes what was found and runs the release gate.

## Why a deterministic planner

The same repository and goal always give the same starting plan, so it can be inspected, tested and diffed. The agent's judgement goes into cutting and refining that plan instead of recalling libraries from memory. The planner keeps **few** entries (at most six, `--max`):

| Rule | Effect |
|---|---|
| Goal keyword match | +2 per keyword |
| Dependency already in the repo | +5 (only if the goal touches that agent's area) |
| Marker file present (`app.json`, `schema.prisma`, …) | +3 |
| Entry language matches the project (Node/Python) | +3 |
| Alternative group (`scraper`) | only the best-scoring member is kept |
| `fallbackFor` | dropped when its primary is chosen; noted as the fallback |
| Mobile-only goal | web-only entries dropped, React Native equivalents suggested |
| Vague goal | `ideasFirst`: offer 3 options, wait for a pick |

The phase skills are chosen the same way: security words add `biswodip-security-review`, UI words add `biswodip-design-review`, "release" adds `biswodip-release-gate`. Any backend or mobile work also adds the security review.

## Commands

```bash
dip plan --root . "android app with login and smooth animations"
dip plan --root . --json "…"          # machine-readable
dip catalog                           # all entries
dip add prisma,redis --root .         # install (project deps + skills); manual ones are printed
dip add expo --root . --dry-run
```

## The catalog (`integrations/catalog.json`)

These entries are referenced, not vendored: nothing is redistributed, so check each project's licence upstream before you ship. `manual` entries scaffold projects, start services, write hooks, install plugins or install globally. They are never run automatically.

| Project | id | Agent | Kind |
|---|---|---|---|
| [Motion](https://github.com/motiondivision/motion) | `motion` | dip-frontend | library |
| [Anime.js](https://github.com/juliangarnier/anime) | `anime` | dip-frontend | library |
| [Animate.css](https://github.com/animate-css/animate.css) | `animate-css` | dip-frontend | library |
| [Bootstrap](https://github.com/twbs/bootstrap) | `bootstrap` | dip-frontend | library |
| [Font Awesome](https://github.com/FortAwesome/Font-Awesome) | `font-awesome` | dip-frontend | library |
| [css.gg](https://github.com/astrit/css.gg) | `css-gg` | dip-frontend | library |
| [Impeccable](https://github.com/pbakaus/impeccable) | `impeccable` | dip-frontend | skill · manual |
| [Front-End Checklist](https://github.com/thedaviddias/Front-End-Checklist) | `front-end-checklist` | dip-frontend | reference |
| [App Ideas](https://github.com/florinpop17/app-ideas) | `app-ideas` | dip-planner | reference |
| [React Native](https://github.com/react/react-native) | `react-native` | dip-mobile | framework · manual |
| [Expo](https://github.com/expo/expo) | `expo` | dip-mobile | framework · manual |
| [Appwrite](https://github.com/appwrite/appwrite) | `appwrite` | dip-mobile | service |
| [Prisma ORM](https://github.com/prisma/orm) | `prisma` | dip-backend | library |
| [Redis](https://github.com/redis/redis) | `redis` | dip-backend | service |
| [Meilisearch](https://github.com/meilisearch/meilisearch) | `meilisearch` | dip-backend | service |
| [ClickHouse](https://github.com/ClickHouse/ClickHouse) | `clickhouse` | dip-backend | service |
| [TiDB](https://github.com/pingcap/tidb) | `tidb` | dip-backend | service · manual |
| [Netdata](https://github.com/netdata/netdata) | `netdata` | dip-backend | service · manual |
| [Keploy](https://github.com/keploy/keploy) | `keploy` | dip-quality | cli · manual |
| [Open Code Review](https://github.com/alibaba/open-code-review) | `open-code-review` | dip-quality | cli · needs model |
| [Archify](https://github.com/tt-a1i/archify) | `archify` | dip-quality | skill |
| [Superpowers](https://github.com/obra/superpowers) | `superpowers` | dip-quality | plugin |
| [Matt Pocock skills](https://github.com/mattpocock/skills) | `mattpocock-skills` | dip-quality | skill |
| [Claude plugins (official)](https://github.com/anthropics/claude-plugins-official) | `claude-plugins-official` | dip-quality | plugin |
| [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) | `awesome-claude-code` | dip-quality | reference |
| [Jev Ultrafast](https://github.com/browser-use/jev-ultrafast) | `jev-ultrafast` | dip-browser | tool · manual · needs model |
| [Browser Use](https://github.com/browser-use/browser-use) | `browser-use` | dip-browser | library · needs model |
| [Crawlee](https://github.com/apify/crawlee) | `crawlee` | dip-browser | library |
| [Scrapling](https://github.com/D4Vinci/Scrapling) | `scrapling` | dip-browser | library |
| [Kubernetes The Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) | `kubernetes-the-hard-way` | dip-infra | reference |
| [Awesome Scalability](https://github.com/binhnguyennus/awesome-scalability) | `awesome-scalability` | dip-infra | reference |
| [n8n](https://github.com/n8n-io/n8n) | `n8n` | dip-infra | service · manual |
| [Ruflo](https://github.com/ruvnet/ruflo) | `ruflo` | dip-infra | plugin · manual |
| [Paperclip](https://github.com/paperclipai/paperclip) | `paperclip` | dip-infra | service · manual |

### Adding an entry

Add an object with `id`, `name`, `repo` (GitHub URL), `agent` (a key of `agents` that has a file in `templates/claude/agents/`), `kind`, `use`, `install` and `signals` (`deps`, `files`, `keywords`). Optional fields: `platform: "web"`, `group`, `lang`, `fallbackFor`, `manual`, and `llm.env` (tool variable → `apiKey` | `baseUrl` | `model` | `protocol`), plus `llm.extraKeys`. `dip verify-package` checks ids, repos, owners and fallbacks.

## Subagents

| Agent | Role |
|---|---|
| `dip-planner` | criteria, task split, file ownership; never writes product code |
| `dip-frontend` | web UI, CSS, icons, animation, design quality |
| `dip-mobile` | React Native + Expo apps, Appwrite |
| `dip-backend` | API, data, cache, search, analytics, monitoring |
| `dip-browser` | jev-ultrafast browser automation (Browser Use fallback), Crawlee/Scrapling |
| `dip-infra` | deploy, Kubernetes, scaling, n8n, agent orchestration |
| `dip-quality` | tests, review, diagrams, TDD discipline |
| `dip` | the general agent; runs the security review in the verify wave |

Every agent reads `PLAN.md` first, edits only the paths it owns, installs through `dip add`, runs model-backed tools through `dip exec`, and reports the commands it ran, their results and a status per criterion.
