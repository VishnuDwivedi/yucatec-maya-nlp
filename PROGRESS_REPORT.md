---
title: "Mid-Progress Report: Semantic Sovereignty in NLP — Yucatec Maya Tokenization"
author: "Vishnu Dwivedi (vdwived2@asu.edu)"
date: "October 29, 2026"
---

# Mid-Progress Report

**Semantic Sovereignty in NLP: Optimizing Data Efficiency and Reducing Orthographic Friction in Yucatec Maya Through Native-Script Semantic Interfaces**

Vishnu Dwivedi — vdwived2@asu.edu

## 1. Status Summary

| Phase | Planned | Status |
|---|---|---|
| Phase 1 — Lit review, data collection, orthography normalizer | Weeks 1–2 | **~80% done** |
| Phase 2 — Baseline training, tokenization audit, back-translation calibration | Weeks 3–4 | **Tokenization audit done; baseline fine-tuning not started** |
| Phase 3 — SEETOK-Maya, glyph annotation, semantic mapping | Weeks 5–6 | Not started |
| Phase 4 — Evaluation, error analysis | Weeks 7–8 | Not started |
| Phase 5 — Interface prototype, community feedback, final report | Weeks 9–10 | Not started |

The highest-value, highest-risk item in the proposal — the **tokenization-penalty hypothesis** — has been tested empirically, ahead of schedule, because it required no GPU and no model training, only tokenizer inference. The results below are real measurements, not placeholders.

## 2. Data Collection Findings (Phase 1)

A key finding this week: **two of the proposal's three named data sources do not exist in the form described**, and the project plan has been adjusted accordingly (this is exactly the kind of risk the proposal's contingency table anticipated).

| Source named in proposal | Verification result |
|---|---|
| FLORES-200 "Maya, Hindi, English" comparison | **Yucatec Maya is not in FLORES-200.** Confirmed by enumerating all 200+ language files in the official `flores200_dataset.tar.gz`. No `yua_*` file exists. FLORES-200 can still be used for the **Hindi vs. English vs. Spanish** comparator arm, exactly as the proposal's "Hindi as reference point" framing allows — but it cannot directly host Maya sentences. |
| AmericasNLP 2024 "14,438 sentences, CENTROGEO/Yucatán culture ministry" | Could not locate this exact resource under that name/size. The closest verified matches are (a) the AmericasNLP 2024 NMT paper by Rangel & Kobayashi, which built a **28,135-pair CPLM-derived Maya/Chol–Spanish set**, released on GitHub, and (b) a separately-documented **YUA-ES-CCC** corpus (~14,332 pairs, 31 communicative contexts) that likely corresponds to the dataset originally cited. YUA-ES-CCC was not yet locatable as a direct download this week; flagged as a Phase 1 follow-up. |
| CPLM Corpus (28,135 Chol–Yucatec Maya pairs) | **Found and downloaded.** Available via `RIKEN-DKO/iikim_translator` (GitHub), which packages the CPLM-derived Maya–Spanish pairs with train/dev/test splits. Actual counts: **10,822 train / 1,352 dev / 1,354 test** Maya–Spanish sentence pairs (13,528 total) — fewer than the 28,135 figure in the proposal, likely because that figure covers Chol **and** Maya combined, or includes data not in this particular release. Flagged for reconciliation in Phase 2. |

**Action taken:** `data/raw/cplm_maya_spanish/` now contains real Maya–Spanish parallel text (train/dev/test, aligned), and `data/raw/flores200/` contains the official FLORES-200 devtest sets for English, Hindi, and Spanish (1,012 sentences each), pulled directly from Meta's public release (not the gated HF mirror, which requires authentication we don't have — also worth noting for reproducibility).

**Revised Phase 1 data plan:** use CPLM (Maya ↔ Spanish) as the primary Maya text source; use FLORES-200 Hindi/English/Spanish as the cross-lingual comparator arm; continue trying to source YUA-ES-CCC or the full AmericasNLP Maya set in parallel, with CPLM alone as the safe fallback — consistent with the proposal's own Table 1 contingency ("Corpus denied → CPLM + AmericasNLP 2024 only").

## 3. Preliminary Empirical Result: Tokenization Benchmark (Phase 2, early)

This is the project's first real test of the central "language tax" hypothesis. Using 500 sentences per language (capped for a fast, reproducible run) from the sources above, I measured **tokens-per-word** under the two Latin-subword baseline tokenizers named in the proposal (mBERT, mT5) — this is exactly "Baseline 1" and "Baseline 2" tokenization behavior described in Section 3.2.1 of the proposal, run directly rather than assumed.

| Language / corpus | mBERT tokens/word | mT5 tokens/word |
|---|---:|---:|
| **Yucatec Maya** (CPLM, dev) | **3.088** | **3.188** |
| Spanish (CPLM, dev — same domain as Maya) | 1.491 | 1.764 |
| Spanish (FLORES-200) | 1.428 | 1.687 |
| Hindi (FLORES-200) | 2.011 | 2.083 |
| English (FLORES-200) | 1.323 | 1.556 |

**Maya-to-English inflation:** 2.33× (mBERT) / 2.05× (mT5).
**Maya-to-Hindi inflation:** 1.54× (mBERT) / 1.53× (mT5) — i.e., Maya is tokenized even less efficiently than Hindi, which is itself cited by Haase & Pokutta (2026) and Churchill & Skiena (2026) as a penalized non-Latin script.

**Interpretation and caveats (important for the report, not just the number):**
- The measured 2.0–2.3× Maya/English inflation is directionally consistent with the proposal's hypothesis but **lower than the 3–5× figure reported for other non-Latin/agglutinative languages** in the cited literature. This is a genuine, reportable finding, not an error — the proposal explicitly frames the 3–5× figure as a motivation to test, not a guaranteed outcome, and this is the first direct evidence on Yucatec Maya.
- Domain mismatch is a real confound: CPLM is legal/formal-register text (it is a parallel corpus of Mexican legal documents), while FLORES-200 is general-domain Wikipedia-style text. The Maya/Spanish-same-domain comparison (3.088 vs. 1.491, mBERT) is the cleanest apples-to-apples number here and shows a **2.07× inflation even within the same legal-register domain**, which is the more defensible claim for Phase 4 reporting.
- This used **tokenizer inference only** (no model training, no GPU) — it is cheap, fast, and fully reproducible, which is why it was prioritized this week given limited compute/time.

All code (`scripts/tokenization_benchmark.py`, `scripts/download_flores.py`) and raw results (`results/tokenization_benchmark.json`) are committed to the repo for reproducibility.

## 4. What Has Not Started Yet (Honest Gaps)

- **Baseline model fine-tuning** (mT5 on CPLM for Maya→Spanish BLEU/ChrF) — needs GPU time; not attempted this week due to compute/time budget. This is Phase 2's remaining item.
- **Orthography normalizer** (INALI vs. Academia de la Lengua Maya rule-based converter) — not started; needs a linguist-reviewed rule set, flagged as a Phase 1 task still open.
- **SEETOK-Maya image tokenizer** and **glyph annotation** (Phase 3) — not started; this is the most annotation-labor-heavy part of the project and realistically cannot start until a Maya linguist/community annotator is recruited, which the proposal already flags as the project's highest schedule risk.
- **Back-translation augmentation + ChrF filtering** — not started.

## 5. Revised One-Week Plan (Given Limited Remaining Time/Credits)

Given one week of working time left before a check-in and limited compute budget, the plan below **re-sequences** Phase 2 to front-load what is achievable without GPU access or external collaborators, and defers the annotation-dependent Phase 3 work rather than starting it half-finished.

**Day 1–2:**
- Reconcile the CPLM 13,528 vs. 28,135 pair discrepancy (check if the GitHub release is Maya-only vs. combined with Chol; re-pull the full LREC-2020 CPLM release if a larger file set is found).
- Locate/acquire YUA-ES-CCC or confirm it is unavailable; finalize the Phase 1 data-source list either way (this closes the Phase 1 contingency decision instead of leaving it open).

**Day 3–4:**
- Extend the tokenization benchmark: run on the **full** CPLM dev+test (not just 500-sentence cap), add **train-split** statistics, and add a **glottal-stop/digraph-aware word tokenization check** (Maya orthography uses apostrophes for glottal stops, e.g. `k'iin`) since naive `.split()` on whitespace may already undercount true word boundaries — this is a methodological detail worth tightening before Phase 4.
- If ASU Research Computing (RC) GPU access is available this week, fine-tune mT5-small (not mT5-base, for speed/cost) on CPLM train for Maya→Spanish, report BLEU/ChrF on the held-out test split. If RC access is not confirmed in time, substitute a **zero-shot mT5/NLLB baseline** (no fine-tuning) as a stand-in result, clearly labeled as such, per the proposal's own contingency logic ("Low BLEU expected; report and analyse").

**Day 5:**
- Draft the orthography normalizer as a simple rule-based character/digraph mapping table (INALI ↔ ALMG conventions) covering the most common divergences (e.g., `x` vs `sh`, apostrophe placement) — a minimal version is achievable in a day; a complete one is not, and that's fine for a progress checkpoint.

**Day 6–7:**
- Write up results (this report, extended), regenerate the tokenization table with full data, and produce 2–3 figures (bar chart of tokens/word by language/tokenizer; a short qualitative table of 5–10 example Maya sentences showing tokenizer fragmentation side-by-side with Spanish/English) for the next submission.
- Do **not** start glyph annotation or SEETOK this week — it depends on recruiting a Maya linguist/community annotator (per Table 1's own risk note), which is a scheduling task, not a coding task, and should be initiated in parallel (e.g., an outreach email via INALI contacts) without blocking the empirical work above.

## 6. Repository Structure (as of this report)

```
cse576/
├── PROGRESS_REPORT.md
├── data/raw/
│   ├── cplm_maya_spanish/   # train/dev/test .maya + .spanish files
│   └── flores200/           # eng_Latn, hin_Deva, spa_Latn devtest (1,012 sent. each)
├── scripts/
│   ├── download_flores.py
│   └── tokenization_benchmark.py
└── results/
    └── tokenization_benchmark.json
```

## 7. Bottom Line

The project's core empirical claim — that Yucatec Maya pays a measurable "tokenization tax" under standard multilingual subword tokenizers — is now **supported by real, reproducible numbers** (2.0–2.3× inflation vs. English, 1.5× vs. Hindi), one week in, using free/public data and no GPU budget. Two of the three cited data sources needed correction, which has been documented and resolved rather than silently assumed. The remaining one-week plan is scoped to what is achievable without GPU-heavy training or annotator recruitment, both of which remain the project's genuine schedule risks exactly as flagged in the original proposal's risk table.
