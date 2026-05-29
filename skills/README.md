# Skills — installation and care

This folder contains six skills that act as the firm's persistent writing memory. Read this once, install them, and then mostly forget about this README — the skills do their job automatically.

## What's in here

| Skill | What it does |
|---|---|
| `client-audience-profile` | Who we write for (advisors + end-investors), what's off-limits, dual-audience framing rules |
| `house-style-voice` | The firm's distinctive voice — plain English, slight humour, storytelling, real-life analogies. With examples. |
| `research-sources` | The standing six asset managers (BlackRock, Russell, Morningstar, Dimensional, Goldman, Morgan Stanley), where to find their outlooks, what to extract |
| `qc-checklist` | The 25-item quality bar every deliverable must pass before shipping |
| `quarterly-outlook-workflow` | End-to-end recipe for big quarterly / half-year synthesis pieces |
| `flash-update-workflow` | End-to-end recipe for short event-driven memos |

## Where to put them

Two choices. Pick global unless you have a reason not to.

### Global (recommended) — available in every project, every session

```
~/.claude/skills/
├── client-audience-profile/
│   └── SKILL.md
├── house-style-voice/
│   └── SKILL.md
├── research-sources/
│   └── SKILL.md
├── qc-checklist/
│   └── SKILL.md
├── quarterly-outlook-workflow/
│   └── SKILL.md
└── flash-update-workflow/
    └── SKILL.md
```

From Terminal:

```bash
mkdir -p ~/.claude/skills
cp -R "/Users/alvintanwt/Documents/Claude/Projects/aiReportGen/skills/"* ~/.claude/skills/
```

### Project-level — only available when working in this project folder

Leave them where they are (inside this project's `skills/` folder). Claude will pick them up when you're working in this project. They won't be available in other projects.

## How they get used

You don't invoke skills manually. Claude reads the descriptions in the YAML frontmatter and loads the relevant skill automatically when your request matches. So when you say "write me a flash update on X," Claude will see `flash-update-workflow`'s description, load it, and follow it. Same for the rest.

The one nuance: skills are loaded by whoever is doing the work. If you spawn a subagent, the subagent only sees skills if its own descriptions / instructions reference them. For the orchestrator-led workflow (the most likely setup for your use case), this isn't a concern.

## The improvement loop — this is the whole point

These skills are not finished products. They are the first draft of your firm's writing memory. They get better when you spot something you wish the output had done differently, and you edit the relevant skill.

A few examples of what that looks like in practice:

- You get a flash update back and think "I wish it had led with the market-reaction number first." → open `flash-update-workflow`, add that to the structure section. Every flash update from then on does it.

- A piece uses "robust" three times. → add "robust" to the banned-words list in `house-style-voice`.

- You start citing J.P. Morgan AM regularly. → add them to the source list in `research-sources` with notes on what they're good for.

- The QC keeps missing a specific failure mode. → add a new item to `qc-checklist`.

Do this for a few months and you'll have a tight, opinionated, very specific set of skills that nobody else has — which is the actual moat. The skills are short on purpose. They are meant to be lived in.

## What's deliberately not here

A few things you might expect to see but won't, for good reasons:

- **No compliance disclaimer block.** Add this when you know what your compliance team requires verbatim — it's better blank than wrong.
- **No specific fund / ETF ticker list.** Stays off the skills by design. Tickers should be approved per-piece, never auto-generated.
- **No agent definitions.** This setup uses the main Claude (the orchestrator) as the writer, with skills as the persistent layer. A separate QC subagent can be added later if you want truly independent eyes — let me know when you're ready and we'll add it.

## A note on the equity-research-analyst.md file

In an earlier turn we built an agent file at the project root for an "equity research analyst" subagent. With the skills now in place, most of what that agent's prompt encoded is now in `research-sources` and the two workflow skills — which is where it belongs. You can delete the standalone agent file unless you specifically want a subagent for research (which, per the discussion, is probably unnecessary for your workflows).

If you do want to keep it as an agent, move it to `~/.claude/agents/equity-research-analyst.md`. If you don't, just delete it.
