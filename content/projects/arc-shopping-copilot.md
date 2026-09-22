---
title: "ARC: Ask · Rank · Commit"
summary: "A catalog-grounded shopping agent that knows what to ask, how to rank, and when to commit. Grand Finalist at TikTok TechJam 2026 (Track 4 — Shopping Copilot), top 12 of 600+ teams."
link: "https://github.com/kelvin715/techjam-2026-shopping-copilot"
extraLinks:
  - label: "Live replay"
    url: "https://kelvin715.github.io/techjam-2026-shopping-copilot"
tags: [LLM Agents, Conversational Search, Product Ranking, Retrieval, Python]
date: "2026-09"
category: nlp
role: lead
isOpenSource: true
featured: true
badge: "Grand Finalist"
featuredImage: /images/projects/arc-poster.jpeg
highlights:
  - "Retrieval can surface the right product and still fail the shopper — ARC treats each turn as one state with three decisions: RANK (which products fit best), ASK (which question helps most), and COMMIT (how many products now)."
  - "Matches catalog evidence first and calls an LLM only when the wording actually needs it, so the agent stays cheap and auditable."
  - "Solved 200/200 benchmark sessions with a mean of 1.98 turns, under the organizer's limit of 10 turns and 5 products per turn."
  - "Runs the organizer benchmark with zero model tokens in standard-library Python, at roughly 15 ms per session on a 4 GB machine with no GPU."
  - "The LLM cascade lifts performance from 0.15 to 0.78 when shoppers paraphrase their requests instead of using benchmark templates."
---

**ARC** is a shopping copilot built for Track 4 of TikTok TechJam 2026, where it reached the Grand Finals as one of the top 12 teams out of 600+.

The core idea is that retrieval alone is not enough: a system can rank the right product highly and still lose the shopper by asking the wrong question, or by committing too early. ARC models every turn as a single state with three competing decisions — **ask**, **rank**, and **commit** — scored against one another so the agent only spends a question when the expected ranking gain justifies the turn.

Catalog evidence is matched before any language model is invoked, and the LLM cascade is reserved for the cases where the shopper's wording diverges from the catalog. That keeps the benchmark path fully deterministic and token-free, while still handling paraphrased, real-world requests.
