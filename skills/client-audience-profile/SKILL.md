---
name: client-audience-profile
description: Load whenever you are researching, writing, reviewing, or compiling any client-facing investment commentary — quarterly outlooks, flash updates, thematic memos, talking-points decks, or anything that will eventually be read by a financial advisor or an end-investor client. Defines who the readers are, what they care about, what is off-limits (no stock-level commentary, no fundamental analysis), and how to produce the dual advisor-and-client framing the firm uses.
---

# Who we write for

Our readers come in two layers, and most pieces need to work for both:

1. **Financial advisors (B2B2C).** Professionals who use our commentary to talk to their own end-clients. They want institutional substance — actual data, attribution to source managers, a clear point of view they can defend in a client meeting. They have investment vocabulary; you do not need to define basic terms (duration, multiple expansion, OW/UW) for them.

2. **End-investor clients (B2C).** Individuals investing primarily via **mutual funds and ETFs**. They are intelligent but generally not financial professionals. They care about what a piece of macro news means for *their portfolio*, not about the macro for its own sake. Define jargon casually when it appears, or write around it.

# How to handle the two registers

Default to producing the piece in a single voice that works for both — that is the firm's house preference. Concretely this means:

- Lead with the human stakes or the bottom line, not with the data point.
- Use language an intelligent non-professional can follow, but never water down the substance an advisor would want.
- When an advisor-only data point matters (e.g. "Russell is now overweight EM"), still include it, but follow with one line on what it means in practice ("which translates to a tilt toward EM-focused ETFs in client portfolios").

If the user explicitly asks for an "advisor version" and a "client version" of the same piece, produce both, anchored to the same facts and the same view, but:
- **Advisor version**: keeps full manager attribution, technical data points, and trade-level language ("favouring EM equity ETFs over US large-cap broad exposure in the next quarter").
- **Client version**: keeps the same takeaways but reframes around "what this means for your portfolio" / "what we'd consider doing on your behalf," strips most of the inline citations into a short "sources" footer, and softens trade-level language.

# What our clients invest in

- Open-ended mutual funds
- ETFs (broad-market, sector, factor, thematic, regional)
- Occasionally model portfolios built from the above

They do not pick individual stocks. They generally do not trade options, futures, or single bonds.

This shapes everything you write:

- Translate sector or stock-level manager calls into **fund/ETF-level positioning implications**. If BlackRock is overweight US tech, the client-relevant translation is "broad-market US equity ETFs are still your core; a tech-tilt sector ETF is the cleanest way to express a slightly more aggressive AI view."
- Translate factor calls similarly: "Morningstar's barbell of high-quality value and high-growth AI tech" becomes "a quality value ETF paired with a thematic AI / tech ETF in roughly equal weight."
- Avoid implying market timing. Frame moves as "tilts," "rebalances," or "considerations" — not buy/sell signals on specific names.

# What is off-limits

These are firm rules — every agent and every piece must follow them:

- **No individual stock commentary.** Do not name a single stock as attractive, unattractive, undervalued, or anything else. If a source manager names a stock, do not pass that through. Translate to the index / sector / factor / fund level.
- **No fundamental analysis of companies.** No P/E commentary on individual names. Sector-aggregate or index-aggregate is fine.
- **No earnings forecasts on individual companies.** Aggregate index EPS is fine ("S&P 500 EPS tracking +20% YoY"); company-level is not.
- **No specific fund or ETF recommendations by ticker** unless the user has explicitly approved the ticker list for that piece. Generic descriptions ("a broad US large-cap ETF") are safe; "buy SPY" is not.
- **No personalised investment advice tone.** The voice is "we think" / "our view is," not "you should buy."
- **No predictions in our own voice.** All forward-looking calls must be attributed to a named source manager ("Morgan Stanley's GIC sees..." — not "the market will...").

# What our clients actually care about

When choosing what to elevate in any piece, weight these higher:

- What does this mean for the **risk** in my portfolio? (Volatility, drawdown, concentration.)
- What does this mean for the **return** I can reasonably expect? (Time-horizon framed.)
- Is there an action I — or my advisor — should consider? (Tilt, rebalance, hold steady.)
- What's the consensus, and what's the contrarian read? (Helps them sense-check.)

De-emphasise the inside-baseball macro stuff unless it directly bears on one of those four questions.

# Tone reminder

The voice that wins both audiences is plain English with substance underneath — see the `house-style-voice` skill for the full treatment. Never use marketing language, never use exclamation points, never pretend to certainty we don't have.

# A quick sanity check before you ship

Read your draft asking: "If a thoughtful retail investor read this on a Sunday morning, would they (a) understand it, (b) feel they got real value, and (c) not feel sold to?" If any of those three is a no, revise.
