---
name: flash-update-workflow
description: Load when the user asks for a fast, event-driven memo for clients — something has just happened (geopolitical shock, central bank surprise, major data release, market dislocation) and clients need a short note that explains what happened, what it means for portfolios, and what we'd do (or not do) about it. Use this for "write a flash update on X" type requests. For scheduled quarterly synthesis pieces, use quarterly-outlook-workflow instead.
---

# When to use this workflow

Trigger this when the user asks for any of:

- "Write a flash update on [event]"
- "Clients are going to ask about [event] — give me a short memo"
- "Quick take on [Fed decision / geopolitical event / data release]"
- Anything time-sensitive that wouldn't justify a full quarterly synthesis

The piece this produces is short — usually 1.5 to 3 pages — and prioritises speed and clarity over comprehensiveness.

# The principle

A flash update is not a research report. It is a calming, well-informed letter from a friend who happens to follow markets. The reader is mildly anxious (something happened, they saw the headline) and wants three things in this order:

1. Was I right to worry? (What actually happened, plainly.)
2. What does this mean for *my* portfolio? (Not the macro for its own sake.)
3. Should I do anything? (Almost always: no, hold steady — but explain why.)

Build the piece around these three questions.

# The four phases

## Phase 1 — Scope and confirm (very fast)

Use AskUserQuestion with at most two questions:

- **The event in one line**, confirmed back to the user. ("You want a flash update on the Iran-Israel escalation and its impact on equities — correct?")
- **Length expectation**: ~1 page (email-length), ~2 pages (standard flash), or ~3 pages (deeper take)?

Skip the question step entirely if the user has already given clear scope in their initial request.

## Phase 2 — Research (lighter than the quarterly)

For a flash update, you typically need three streams of input:

1. **What actually happened.** A current news search to confirm the facts of the event. Use reputable sources (Reuters, FT, WSJ, Bloomberg). Capture two or three confirming sources.

2. **What the source managers have said about it.** Use the standing source list (see `research-sources`) — search for "[Manager name] [event keyword] 2026." You usually only need two or three managers for a flash; pick the ones whose franchise is most relevant. For geopolitical events, BlackRock and Goldman tend to be fastest. For Fed events, all six.

3. **Historical analogues.** Search for one or two prior events that rhyme — "previous Middle East energy shocks and equity markets," "Fed pause cycles 2015 2019 2024." Real precedents anchor the piece and let you bring the analogy power that the firm's voice depends on.

Run all three streams in parallel where possible.

## Phase 3 — Writing

Load `client-audience-profile` and `house-style-voice`. Then draft against this short structure:

1. **Opening hook (one short paragraph).** A story-led sentence that sets the scene. Not a date stamp, not a headline. Something specific and human — "Markets opened Monday looking like everyone had been drinking the same espresso."

2. **What happened (two to four short paragraphs).** The facts, plainly. Lead with what the reader needs to know first; details after. Anchor any numbers. No jargon you haven't explained.

3. **Why it matters for equities (two to four short paragraphs).** The transmission mechanism, in plain English. "Oil moves → inflation expectations move → rate-cut expectations move → equity multiples move." Use the historical analogue here: "The last time we saw something like this was X, and what happened then was Y — though every situation is different."

4. **What the managers are saying (one to two paragraphs).** Quote the named manager views you gathered, sparingly. One sentence per manager is plenty. Show the disagreement if there is one.

5. **What this means for your portfolio (two to three paragraphs).** Translated to mutual fund and ETF terms. Almost always the right answer is some version of "the things in your portfolio are designed to handle moments like this — your diversification is the plan, not the panic." If there's a genuine consider-this tilt, frame it as a consideration not a directive. Hedge appropriately.

6. **A short close.** One paragraph. Reassuring without being saccharine. Land on a note of perspective — the kind of line a thoughtful friend would actually say.

7. **Sources line at the bottom (no heavyweight citations section).** Three to six links, plain. "Reuters, FT, BlackRock Q2 outlook, Goldman Market Pulse March 2026."

Total length: 600–1200 words for an email-length flash, up to ~2000 for a fuller take.

## Phase 4 — QC and compile

Load `qc-checklist`. For a flash update, prioritise these items in particular:

- **Section A (substance)**: every claim about the event itself is verifiable from a real news source; every manager view is attributed; numbers are accurate.
- **Section B (off-limits)**: zero stock names, zero ticker recommendations, no personalised-advice tone.
- **Section C (voice)**: this is where a flash most often fails. The piece must read as our voice — plain, slightly funny, story-led — not as a research note translated for clients. Run the voice check carefully.
- **Section D (structure)**: opening hook is genuinely a hook. Closing paragraph genuinely closes. No middle paragraph is doing two jobs.

Compile using the `docx` skill (or markdown if the user requested email-ready). Filename pattern: `flash-update-[topic]-[YYYY]-[MM]-[DD].docx` (e.g. `flash-update-middle-east-2026-05-28.docx`).

Save to the user's workspace folder and present.

# Common failure modes for flash updates

- **Too long.** A flash that runs to four pages of dense paragraphs is a quarterly outlook in disguise. Cut.
- **No story.** A flash that opens "On May 28, 2026, the situation in the Middle East escalated" is dead on arrival. Open with a scene, not a date.
- **Catastrophising.** The reader is already worried. Our job is to inform, not amplify. Avoid words like "crisis" unless quoting a source.
- **False reassurance.** The opposite failure — pretending nothing is happening. Honest hedging beats false calm.
- **Buried takeaway.** The reader should know within the first 200 words whether we think they should be worried or steady. Don't make them dig.
- **No portfolio bridge.** A flash that explains the event but doesn't translate to mutual-fund / ETF implications is a Bloomberg article, not our note. Always include the bridge.

# Tone in a crisis

When the event is serious — war, a real market dislocation, a credit event — dial the humour all the way down. Plain English, calm, no analogies that could read as flippant about real harm. The voice still applies, but the dial is on "steady" not "wry." Our voice is permissive of humour, not dependent on it.

# What "doing nothing" looks like as a takeaway

The right answer in 80%+ of flash updates is some version of "your portfolio was built for this; we'd hold." That's not a cop-out — it's the most valuable thing we can tell clients in a panicked moment, and it's almost always the empirically correct call. Write it with conviction, anchor it in the historical analogue, and respect the reader's intelligence enough not to talk them into trading.

If the right answer genuinely is "consider a tilt," frame it as a tilt — small, deliberate, not urgent.
