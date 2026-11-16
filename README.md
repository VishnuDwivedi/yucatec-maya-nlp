# Semantic Sovereignty in NLP: Yucatec Maya Tokenization

CSE 576 project measuring the "tokenization tax" that standard multilingual
subword tokenizers (mBERT, mT5) impose on Yucatec Maya, an agglutinative,
tonal, low-resource Indigenous language, relative to Spanish, Hindi, and
English.

**Author:** Vishnu Dwivedi (vdwived2@asu.edu)

## What's here

```
cse576/
├── Mid_Progress_Report.docx       # mid-progress report (Word)
├── report_tex/                    # mid-progress report (ACL LaTeX + compiled PDF)
│   ├── main.tex
│   ├── main.pdf
│   ├── custom.bib, acl.sty, acl_natbib.bst
│   └── tokens_per_word.png
├── PROGRESS_REPORT.md / .docx     # earlier progress snapshot
├── data/raw/
│   ├── cplm_maya_spanish/         # Maya <-> Spanish parallel text (train/dev/test)
│   ├── yua_es_ccc/                # YUA-ES-CCC Maya <-> Spanish phrase pairs
│   ├── americasnlp2024_st2/       # AmericasNLP 2024 Shared Task 2 (Maya)
│   ├── flores200/                 # FLORES-200 devtest: English, Hindi, Spanish
│   ├── maya_sign_catalog/         # Classic Maya glyph sign catalog
│   └── maya_corpus_epigraphic/    # Classic Maya hieroglyphic epigraphic DB (gzipped)
├── scripts/
│   ├── download_flores.py         # pulls FLORES-200 devtest sets from Meta's release
│   ├── tokenization_benchmark.py  # computes tokens/word under mBERT and mT5
│   ├── make_figures.py            # generates the bar chart + sample fragmentation table
│   ├── orthography_normalizer.py  # glottal-stop / colonial-spelling / NFC normalization
│   ├── finetune_mt5.py            # Baseline 2: mT5-small fine-tuning, Maya->Spanish
│   └── submit_mt5_baseline.sbatch # Slurm batch script for ASU RC `sol`
└── results/
    ├── tokenization_benchmark.json
    ├── sample_tokenizations.json
    ├── mt5_maya_es_test_metrics.json  # real Baseline 2 test-set BLEU/ChrF
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
`class_cse57669240fall2026`, ~3hr walltime). Dependencies are pinned in the
sbatch script itself (`transformers==4.53.2`, `datasets==4.8.4`,
`evaluate==0.4.6`) to avoid API drift from an unpinned `pip install`. From
this directory on `sol`:

```bash
sbatch scripts/submit_mt5_baseline.sbatch
```

Check status with `squeue -u $USER`; results land in
`results/mt5_maya_es_test_metrics.json`.

**This has been run end-to-end on `sol` and produced real results:**
test loss 2.35, **BLEU 4.28**, **ChrF 21.87** (mT5-small, 3 epochs, batch
size 16, single A100, bf16; see `results/mt5_maya_es_test_metrics.json` for
the full output and `report_tex/main.tex` / `report_tex/main.pdf` for
analysis). Getting a valid run required fixing three real issues along the
way: the `transformers` `Trainer` API renaming `tokenizer=` to
`processing_class=`; `fp16` training producing `NaN` loss on T5-family
models (fixed by switching to `bf16`); and an unpinned `pip install`
grabbing a newer `transformers` release that had dropped the
`warmup_ratio` argument (fixed by pinning exact versions). All three fixes
are already applied in `scripts/finetune_mt5.py` and
`scripts/submit_mt5_baseline.sbatch` above.

## Status

See `report_tex/main.pdf` (ACL-format mid-progress report) or
`Mid_Progress_Report.docx` for the full writeup: phase breakdown, results,
error analysis, and next steps. Short version:

- **Tokenization-fertility audit:** done. Maya sees ~2.0–2.3x more
  tokens/word than English and ~1.5x more than Hindi, under both mBERT and
  mT5, across two Maya corpora (CPLM, legal register; YUA-ES-CCC, everyday
  register).
- **Orthography normalizer:** implemented (`scripts/orthography_normalizer.py`);
  glottal-stop unification, colonial `c`/`qu`→`k` mapping, Unicode NFC.
- **Baseline 2 (mT5 fine-tuning):** done, real results above. Low BLEU is
  expected for this corpus size and is analyzed, not hidden, in the report.
- **SEETOK-Maya / glyph annotation (Phase 3):** not started; data source
  (mayacorpus.org epigraphic DB) is secured, blocked on recruiting a Maya
  linguist/annotator.
