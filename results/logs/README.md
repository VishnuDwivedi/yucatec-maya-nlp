# Slurm job logs

Raw `.out` logs from the Baseline 2 (mT5 fine-tuning) debugging cycle on ASU
Research Computing's `sol` cluster, kept as the provenance trail behind the
BLEU/ChrF numbers in `results/mt5_maya_es_test_metrics.json` and the report.

Expected files (named `mt5-maya-es-<job_id>.out`, matching the
`#SBATCH --output=%x-%j.out` pattern in `scripts/submit_mt5_baseline.sbatch`):

| Job ID    | Outcome | Issue |
|-----------|---------|-------|
| 1635501   | FAILED  | `ModuleNotFoundError: No module named 'tiktoken'` |
| 1636795   | FAILED  | `Seq2SeqTrainer.__init__()` got unexpected keyword `tokenizer` (API renamed to `processing_class`) |
| 1637843   | COMPLETED (invalid) | Ran to completion but produced `NaN` loss / 0.0 BLEU-ChrF (fp16 instability) |
| 1638583   | FAILED  | `Seq2SeqTrainingArguments.__init__()` got unexpected keyword `warmup_ratio` (unpinned `transformers` drift) |
| 1639176   | COMPLETED (valid) | Real result: BLEU 4.28, ChrF 21.87 |

To add a log: copy it from `sol` (e.g. `scp vdwived2@sol.asu.edu:~/yucatec-maya-nlp/mt5-maya-es-1639176.out .`)
into this directory under the name above, then commit it.
