# Semantic Sovereignty in NLP: Yucatec Maya Tokenization

CSE 576 project measuring the "tokenization tax" that standard multilingual
subword tokenizers (mBERT, mT5) impose on Yucatec Maya, an agglutinative,
tonal, low-resource Indigenous language, relative to Spanish, Hindi, and
English.

**Author:** Vishnu Dwivedi (vdwived2@asu.edu)

## What's here

```
cse576/
├── PROGRESS_REPORT.md / .docx     # mid-progress report (early version)
├── data/raw/
│   ├── cplm_maya_spanish/         # Maya <-> Spanish parallel text (train/dev/test)
│   └── flores200/                 # FLORES-200 devtest: English, Hindi, Spanish
├── scripts/
│   ├── download_flores.py         # pulls FLORES-200 devtest sets from Meta's release
│   ├── tokenization_benchmark.py  # computes tokens/word under mBERT and mT5
│   └── make_figures.py            # generates the bar chart + sample fragmentation table
└── results/
    ├── tokenization_benchmark.json
    ├── sample_tokenizations.json
    └── figures/tokens_per_word.png
```

## Datasets

- **CPLM Maya–Spanish corpus** (`data/raw/cplm_maya_spanish/`): 10,822 train /
  1,352 dev / 1,354 test sentence pairs, legal-register text, sourced from the
  `RIKEN-DKO/iikim_translator` GitHub release of the CPLM corpus.
- **YUA-ES-CCC** (`data/raw/yua_es_ccc/`): 14,332 Maya–Spanish phrase pairs,
  everyday register, 31 communicative contexts (market, school, family,
  weather, etc.). CC-BY-4.0, from `github.com/alemol/yua-es-ccc`
  (CentroGeo + SEDECULTA). This is the corpus the original proposal's
  "14,438 sentences" figure referred to; a subset of it was used in the
  AmericasNLP 2024 Shared Task 2.
- **AmericasNLP 2024 Shared Task 2 — Maya** (`data/raw/americasnlp2024_st2/`):
  595 train / 150 dev / 311 test rows. This is a *morphosyntactic
  transformation* task (negation, tense, person, etc. changes on a base
  sentence), not a parallel translation corpus — useful for tokenization
  benchmarking and morphological evaluation, not for MT fine-tuning.
- **Maya hieroglyph sign catalog + epigraphic database**
  (`data/raw/maya_sign_catalog/`, `data/raw/maya_corpus_epigraphic/`):
  2,449 glyph signs (Thompson/Montgomery numbers, logographic readings,
  image URLs) and a 141MB SQLite database of Classic Maya hieroglyphic
  inscriptions (sites, museum objects, glyph blocks) from mayacorpus.org.
  **This is Classic Maya hieroglyphic script data, not modern Yucatec Maya
  text** — it's the right source for Phase 3 (SEETOK-Maya / glyph
  annotation), not for the Phase 1–2 tokenization-tax measurement, which
  uses the alphabetic corpora above. Keep these two kinds of "Maya data"
  separate in any analysis. The `.db` file itself is gitignored (141MB);
  only the 25MB gzip is committed — decompress with
  `gunzip data/raw/maya_corpus_epigraphic/maya_corpus.db.gz`.
- **FLORES-200 devtest** (`data/raw/flores200/`): 1,012 sentences each for
  English (`eng_Latn`), Hindi (`hin_Deva`), and Spanish (`spa_Latn`), pulled
  directly from Meta's public `flores200_dataset.tar.gz` (not the gated HF
  mirror). Yucatec Maya is **not** included in FLORES-200 — verified by
  enumerating all 200+ language files in the release. (A `yua_Latn` file
  under this name elsewhere is not real FLORES-200 data — see Known Issues.)

## Known issues / things to double check

- Any file named `flores200/yua_Latn.dev` or `.devtest` containing the
  literal text `404: Not Found` is a failed download placeholder, not real
  data — Yucatec Maya genuinely is not in FLORES-200. Do not use it.
- The CPLM corpus used here (13,528 pairs) was obtained via a GitHub mirror,
  not by request to the original LREC-2020 authors. If a different session
  claims CPLM requires emailing UNAM for access, that's outdated relative to
  this repo's actual state — the data is already here.

## How to run

Requires Python 3.10+ and `pip install transformers matplotlib sentencepiece datasets evaluate sacrebleu accelerate`.

```bash
# 1. (Already done) Re-download FLORES-200 devtest sets if missing:
python scripts/download_flores.py

# 2. Run the tokenization benchmark (mBERT + mT5 tokens/word by language,
#    including a normalized-orthography variant for Maya):
PYTHONPATH=scripts python scripts/tokenization_benchmark.py
# -> writes results/tokenization_benchmark.json

# 3. Generate the bar chart and sample fragmentation examples:
python scripts/make_figures.py
# -> writes results/figures/tokens_per_word.png and results/sample_tokenizations.json

# 4. Try the orthography normalizer directly:
python scripts/orthography_normalizer.py
```

Steps 1–4 need no GPU — they only call each tokenizer's `.tokenize()` method
or do plain string rewriting, no model forward pass or training.

### Baseline 2: mT5 fine-tuning on ASU Research Computing (GPU required)

`scripts/finetune_mt5.py` fine-tunes mT5-small on CPLM for Maya→Spanish
translation and reports BLEU/ChrF on the held-out test split.
`scripts/submit_mt5_baseline.sbatch` is a ready-to-submit Slurm job for the
ASU RC `sol` cluster (1 GPU, `general` partition, `class` QOS, account
`class_cse57669240fall2026`, ~3hr walltime). From this directory on `sol`:

```bash
sbatch scripts/submit_mt5_baseline.sbatch
```

Check status with `squeue -u $USER`; results land in
`results/mt5_maya_es_test_metrics.json`. This has been smoke-tested locally
(data loading + tokenization pipeline only, no actual training) but not yet
run end-to-end on the cluster — do that before citing BLEU/ChrF numbers.

## Status

See `PROGRESS_REPORT.md` (and the fuller mid-progress submission) for the
current phase breakdown, results, and next steps. Short version: the
tokenization-tax hypothesis has been tested empirically (Maya sees
~2.0–2.3x more tokens/word than English, ~1.5x more than Hindi, under both
tokenizers); baseline MT fine-tuning, the orthography normalizer, and the
glyph/SEETOK work are still pending.
