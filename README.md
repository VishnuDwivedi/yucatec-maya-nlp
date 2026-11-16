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
- **FLORES-200 devtest** (`data/raw/flores200/`): 1,012 sentences each for
  English (`eng_Latn`), Hindi (`hin_Deva`), and Spanish (`spa_Latn`), pulled
  directly from Meta's public `flores200_dataset.tar.gz` (not the gated HF
  mirror). Yucatec Maya is **not** included in FLORES-200 — this was verified
  by enumerating all 200+ language files in the release; see the report for
  how this changed the data plan.

## How to run

Requires Python 3.10+ and `pip install transformers matplotlib sentencepiece`.

```bash
# 1. (Already done) Re-download FLORES-200 devtest sets if missing:
python scripts/download_flores.py

# 2. Run the tokenization benchmark (mBERT + mT5 tokens/word by language):
python scripts/tokenization_benchmark.py
# -> writes results/tokenization_benchmark.json

# 3. Generate the bar chart and sample fragmentation examples:
python scripts/make_figures.py
# -> writes results/figures/tokens_per_word.png and results/sample_tokenizations.json
```

No GPU is required for anything currently in this repo — the benchmark only
calls each tokenizer's `.tokenize()` method, no model forward pass or
training.

## Status

See `PROGRESS_REPORT.md` (and the fuller mid-progress submission) for the
current phase breakdown, results, and next steps. Short version: the
tokenization-tax hypothesis has been tested empirically (Maya sees
~2.0–2.3x more tokens/word than English, ~1.5x more than Hindi, under both
tokenizers); baseline MT fine-tuning, the orthography normalizer, and the
glyph/SEETOK work are still pending.
