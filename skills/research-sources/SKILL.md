---
name: research-sources
description: Load whenever you are researching market outlooks, quarterly reviews, thematic notes, or event commentary from major global asset managers. Contains the firm's trusted source list (BlackRock, Russell Investments, Morningstar, Dimensional, Goldman Sachs, Morgan Stanley), the canonical document each one publishes, publication cadence, what to extract from each, and the verification rules for treating something as a citable source.
---

# The standing source list

For any quarterly synthesis, thematic note, or event commentary, default to these six asset managers. They are the firm's standing roster; if you add a seventh, do it deliberately and tell the user.

## 1. BlackRock — BlackRock Investment Institute (BII)

- **Canonical doc**: Quarterly Investment Outlook + the standalone Equity Market Outlook
- **Cadence**: Annual outlook in December; quarterly refreshes around the start of each quarter; weekly commentary in between
- **Where to find**: blackrock.com/corporate/insights/blackrock-investment-institute/publications/outlook and blackrock.com/us/individual/insights/equity-market-outlook
- **What's useful**: Strong on cross-asset framing, "mega forces" thematic lens (AI, geopolitical fragmentation, demographics, energy transition, financial future). Tend to be directional with overweight / underweight calls.
- **What to watch for**: BII frequently runs ahead of the wealth channel — make sure the document you're citing is the Q-specific one, not a year-old archived piece.

## 2. Russell Investments

- **Canonical doc**: Global Market Outlook (annual + mid-year update) + monthly Markets Wrap-Up
- **Cadence**: Major outlook in November/December; mid-year refresh in June/July; monthly wraps continuously
- **Where to find**: russellinvestments.com/insights and the monthly "Markets Wrap-Up" series
- **What's useful**: Strong on the active-management argument, dispersion themes, factor and style positioning. Reliable on "bigger picture" framing rather than specific stock or sector calls.
- **What to watch for**: Often syndicates content via Advisor Perspectives — same content, different URL. Prefer the russellinvestments.com link for citations.

## 3. Morningstar

- **Canonical doc**: Quarterly Stock Market Outlook + regional outlooks (US, Europe, Asia)
- **Cadence**: Quarterly, with mid-quarter updates if conditions warrant
- **Where to find**: morningstar.com/markets and the morningstar.com/business/insights/research series
- **What's useful**: Sector-level fair-value framework gives you clear "what's cheap, what's expensive" reads at the index/sector level. Best in class for valuation commentary. Asia outlook is genuinely good and frequently overlooked.
- **What to watch for**: Their headline number (e.g. "market is X% discount to fair value") moves a lot quarter-to-quarter; always quote the as-of date.

## 4. Dimensional Fund Advisors

- **Canonical doc**: Quarterly Market Review + Portfolio Consulting Group thematic notes
- **Cadence**: Quarterly review at the start of each quarter for the prior one
- **Where to find**: dimensional.com/insights
- **What's useful**: Portfolio-construction lens — diversification, factor exposure, behavioural pitfalls. Useful as a counterweight to managers making directional calls.
- **What to watch for**: Dimensional by house philosophy does *not* publish forward-looking directional calls. Don't try to extract one. They're the source for "what should the portfolio look like regardless of the call," not "what should the call be."

## 5. Goldman Sachs

Goldman speaks in three voices — be precise about which you're citing:

- **GIR (Global Investment Research)**: Sell-side equity strategy. Sharp, contrarian-friendly. Published as research notes.
- **GSAM / Goldman Sachs Asset Management**: Asset management's "Market Pulse" (monthly) and "Market Know-How" (quarterly). More directly useful for fund/ETF allocation framing.
- **ISG (Investment Strategy Group)**: Goldman Sachs Wealth's flagship annual outlook. The "US Preeminence" thesis lives here.
- **Canonical docs to prefer**: ISG annual outlook + GSAM Market Pulse for monthly data + GSAM Market Know-How for quarterly.
- **Where to find**: am.gs.com/en-us/advisors/insights, goldmansachs.com/insights, marcus.com/us/en/resources/heard-at-gs
- **What's useful**: GSAM Market Pulse is the single most efficient monthly read of the bank's view; ISG is the most structured annual framework.
- **What to watch for**: GIR and ISG sometimes disagree visibly. Note which voice you're attributing.

## 6. Morgan Stanley

Like Goldman, three voices:

- **MS Research equity strategy**: Sell-side, with explicit index targets.
- **MS Wealth Management Global Investment Committee (GIC)**: The wealth-channel quarterly + monthly + weekly. This is what most directly informs client-facing memos.
- **MS Investment Management**: Asset management's quarterly Global Market and Asset Allocation Guide ("May the BEAT" / "BEAT" series).
- **Canonical docs to prefer**: GIC quarterly + MS IM quarterly allocation guide.
- **Where to find**: morganstanley.com/im/publication/insights/articles/ for the IM PDFs; morganstanley.com/insights for the GIC pieces
- **What's useful**: GIC is one of the few wealth channels that publishes specific S&P targets with timeframes — useful for clear directional anchoring.
- **What to watch for**: MS Research targets and GIC targets can differ. For client-memo purposes default to GIC unless you have a reason not to.

# How to find the latest outlook — required process

1. Use the current date — not your training cutoff — to determine which quarter is "latest."
2. Search for "[Manager name] Q[N] [YYYY] outlook" — e.g. "BlackRock Q2 2026 equity outlook." Add "equity" if the manager publishes both cross-asset and equity-specific.
3. Verify the URL belongs to the manager's official domain. Discard third-party summaries unless used for triangulation.
4. Open the actual document. If a page is client-rendered and returns a shell, escalate to the Chrome browser tools.
5. Capture: publication date, full title, canonical URL.

# What to extract from every source

For any synthesis task, capture per manager:

- Headline stance (overweight / neutral / underweight, or directional language)
- Regional view: US, Europe, Asia (developed — Japan, Australia), Emerging Markets
- Explicit headwinds (risks they call out)
- Explicit tailwinds (supports they call out)
- Specific data points: GDP, CPI, PMI, earnings growth, rate path expectations
- Time horizon of the call (next quarter, 6–12 months, strategic)
- Any factor / style tilts (value/growth, quality, small-cap, dividend, low-vol)

# Citation rules

- Cite to **publication date**, not access date.
- Prefer the manager's own domain over syndicated copies.
- If a manager has not yet published the current quarter's outlook, use the most recent prior outlook *and explicitly say so* in the citations section.
- If a search summary is the only source for a claim, mark that claim as "per [Manager] commentary" rather than citing a specific document.
- Never cite a number you have not seen in the actual document. If you only have a paraphrase, attribute the paraphrase, not a fabricated figure.

# Adding new sources

Before adding a seventh manager to a piece, ask: does this source add a view the existing six don't already give us? J.P. Morgan AM and PIMCO are common additions worth considering when the topic is fixed-income or multi-asset; for pure equity outlooks the standing six are usually enough.

# When to override defaults

A user may scope a piece to a subset ("just BlackRock and Goldman this time") or expand it ("add J.P. Morgan AM"). Always follow explicit scoping. Default to the standing six only when scope is not specified.
