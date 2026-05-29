---
name: quarterly-outlook-workflow
description: Load when the user asks for a quarterly equity outlook, a half-year outlook, or a major synthesis piece pulling from multiple asset managers. Covers the full end-to-end recipe — research, synthesis, writing, QC, and compilation into a client-ready deliverable. Use this for the big set-piece deliverables (e.g. "write our H2 2026 market outlook"). For event-driven flash memos, use flash-update-workflow instead.
---

# When to use this workflow

Trigger this when the user asks for any of:

- "Write our quarterly outlook"
- "Put together our H1 / H2 outlook"
- "Synthesise the latest manager views for clients"
- A scheduled deliverable that draws on multiple managers and covers the full geography sweep

This is the heavyweight workflow. Plan on it taking a substantial number of tool calls. If the user wants something faster and event-driven, redirect to flash-update-workflow.

# The five phases

This workflow has five phases. Do not skip steps. Do not collapse phases. The QC step in particular is non-negotiable.

## Phase 1 — Scope and confirm (before any research)

Use AskUserQuestion to confirm:

- **Period covered**: which quarter or half? (Default to current.)
- **Audience version**: single dual-purpose, or separate advisor + client versions?
- **Length expectation**: roughly how long? (Default: 8–12 pages for a quarterly outlook docx, 4–6 for a mid-quarter update.)
- **Any specific themes the user wants emphasised or de-emphasised** (e.g. "go deeper on Japan this time" or "skip EM, we covered it last month").
- **Any additional or fewer source managers** beyond the standing six.

Do not skip this even when in a rush — the rework cost from missing one of these is high.

## Phase 2 — Research

Load the `research-sources` skill. Then, for each source manager in scope:

1. Search for "[Manager name] Q[N] [YYYY] outlook."
2. Verify the URL is the manager's official domain.
3. Fetch the document. If the page is client-rendered, escalate to the Chrome browser tools.
4. Extract the per-manager fields listed in `research-sources` (headline stance, regional views, headwinds, tailwinds, data points, time horizon, factor tilts).
5. Capture publication date and canonical URL for citations.

Run searches in parallel where possible — six independent manager searches in a single batched tool call is fine. Fetches can also be parallelised once you have URLs.

If you cannot find the current-quarter outlook for a manager, use the most recent prior outlook and note it explicitly for the citations section.

## Phase 3 — Synthesis

Before writing, synthesise into working notes (these are scratch — they don't go in the deliverable):

- **Consensus map**: what do four or more of the six agree on? Group these into themes.
- **Divergence map**: where do they disagree? Pull out the sharpest two or three disagreements — these are the most interesting paragraphs for clients.
- **Regional cuts**: for each of US, Europe, Asia (developed), EM — who is OW, who is UW, who is neutral, and why.
- **Bullish vs bearish summary**: for each region, group the bullish stances and the bearish stances with their specific reasons.
- **Headwinds / tailwinds**: cross-manager tallies of what is most commonly named.
- **Data anchor points**: the specific figures (GDP, EPS, rate path) that managers cite as anchoring their view.

Aim to leave this phase with a clear set of three to five "this is the story" lines that the piece will hang on. If you don't have a story, you don't have a piece — go back and re-read.

## Phase 4 — Writing

Load `client-audience-profile` and `house-style-voice`. Then draft the piece against this structure (adjust headings to fit the period and emphasis, but cover the substance):

1. **Title and date stamp.** Period covered explicit.
2. **Executive summary.** Three to five short paragraphs. The consensus picture, the sharpest disagreement, the dominant macro narrative, and the one or two things clients should actually do (or actively not do) with their fund/ETF positioning.
3. **What drove the period.** Story of the past three to six months — the events and data the managers themselves keep coming back to.
4. **The data behind the calls.** A short table or set of bullets anchoring the specific economic figures driving outlooks.
5. **Regional outlook**: one subsection each for US, Europe, Asia (developed), EM. For each region, give the consensus view, then bullish stances with attribution, then bearish stances with attribution, then headwinds and tailwinds, then a "where they disagree" line.
6. **Consensus and divergence.** The cross-cut summary. This is where clients should land if they only read one section.
7. **Portfolio implications for fund/ETF investors.** This is the bridge to action. Not specific tickers; tilts and considerations. Hedge appropriately.
8. **Citations.** Numbered. Publication dates, not access dates. URLs.

Write in our voice (see `house-style-voice`). Lead each section with a story or stake, not a number. Use analogies. Keep paragraphs short.

If producing dual versions, write the advisor version first (denser, fully cited, trade-level language) then derive the client version from it (lighter citations, portfolio-implication framing, more analogies).

## Phase 5 — QC and compile

Load `qc-checklist` and run every item against the draft. Do not skip.

If a separate QC agent is available, hand off the draft to that agent for independent review *before* the user sees it. Independent eyes catch things the writer misses — that's the whole point of having a QC step.

Once QC passes:

- Use the `docx` skill to compile to .docx. Filename pattern: `[period]-equity-outlook-[YYYY]Q[N].docx` (e.g. `h2-2026-equity-outlook.docx`).
- Save to the user's workspace folder.
- Use `mcp__cowork__present_files` to share the file with the user.
- Provide a one-paragraph summary in chat — no more. The user wants the document, not a recap of it.

# Common failure modes to watch for

- **Burying the story in research dump.** A 12-page outlook with no clear "this is the call" line is a brief, not an outlook. Always have a story.
- **One-sided framing.** Real cross-manager research has disagreements; if the piece reads as one-sided, you've lost the counterpoint. Check.
- **Stock names creeping in.** Magnificent 7 references are fine. Single-name analysis is not. Sweep before delivery.
- **Citation slippage.** Every claim attributed to a manager must be traceable. Skipped citations are an integrity failure, not a polish issue.
- **Marketing voice creeping in.** "Robust," "unprecedented," exclamation points — the longer the piece, the more these sneak in. Search and remove.

# What to do if material is missing

If, after good-faith searching, you cannot find a current-quarter outlook for one of the source managers, do not invent or paraphrase. Either:

- Use the most recent prior outlook and note it explicitly in citations, or
- Drop that manager from this piece and note the omission, or
- Pause and ask the user how they want to handle it.

Never fabricate a number, a quote, or a stance.
