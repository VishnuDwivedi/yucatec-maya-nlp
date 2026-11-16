"""
Phase 2 Baseline 2: fine-tune mT5-small on the CPLM Maya<->Spanish corpus for
Maya -> Spanish translation, then report BLEU/ChrF on the held-out test split.

Designed to run on a single GPU (ASU RC `sol` cluster, A100/L40/H100 partitions).
mT5-small (not mT5-base) is used deliberately for speed/cost, per the proposal's
own Phase 2 contingency ("GPU quota -> ASU RC cluster", scope to what fits).
"""
import argparse
import json
import os

import evaluate
import numpy as np
from datasets import Dataset
from transformers import (
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)

DATA_DIR = "data/raw/cplm_maya_spanish"
MODEL_ID = "google/mt5-small"
MAX_SRC_LEN = 128
MAX_TGT_LEN = 128
SRC_PREFIX = "translate Maya to Spanish: "


def load_split(split):
    with open(f"{DATA_DIR}/{split}.maya", encoding="utf-8") as f:
        maya = [l.strip() for l in f if l.strip()]
    with open(f"{DATA_DIR}/{split}.spanish", encoding="utf-8") as f:
        spanish = [l.strip() for l in f if l.strip()]
    assert len(maya) == len(spanish), f"{split}: maya/spanish line count mismatch"
    return Dataset.from_dict({"maya": maya, "spanish": spanish})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch_size", type=int, default=16)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--output_dir", default="results/mt5_maya_es")
    ap.add_argument("--max_train_samples", type=int, default=None,
                     help="Cap train set size for a fast smoke-test run.")
    args = ap.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)

    train_ds = load_split("train")
    dev_ds = load_split("dev")
    test_ds = load_split("test")
    if args.max_train_samples:
        train_ds = train_ds.select(range(min(args.max_train_samples, len(train_ds))))

    def preprocess(batch):
        inputs = [SRC_PREFIX + s for s in batch["maya"]]
        model_inputs = tokenizer(inputs, max_length=MAX_SRC_LEN, truncation=True)
        labels = tokenizer(text_target=batch["spanish"], max_length=MAX_TGT_LEN, truncation=True)
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    train_tok = train_ds.map(preprocess, batched=True, remove_columns=train_ds.column_names)
    dev_tok = dev_ds.map(preprocess, batched=True, remove_columns=dev_ds.column_names)
    test_tok = test_ds.map(preprocess, batched=True, remove_columns=test_ds.column_names)

    collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    bleu = evaluate.load("sacrebleu")
    chrf = evaluate.load("chrf")

    def compute_metrics(eval_preds):
        preds, labels = eval_preds
        if isinstance(preds, tuple):
            preds = preds[0]
        preds = np.where(preds != -100, preds, tokenizer.pad_token_id)
        decoded_preds = tokenizer.batch_decode(preds, skip_special_tokens=True)
        labels = np.where(labels != -100, labels, tokenizer.pad_token_id)
        decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
        bleu_score = bleu.compute(predictions=decoded_preds, references=[[l] for l in decoded_labels])
        chrf_score = chrf.compute(predictions=decoded_preds, references=[[l] for l in decoded_labels])
        return {"bleu": bleu_score["score"], "chrf": chrf_score["score"]}

    training_args = Seq2SeqTrainingArguments(
        output_dir=args.output_dir,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        predict_with_generate=True,
        generation_max_length=MAX_TGT_LEN,
        bf16=True,
        logging_steps=50,
        save_total_limit=1,
        load_best_model_at_end=True,
        metric_for_best_model="chrf",
        report_to=[],
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_tok,
        eval_dataset=dev_tok,
        data_collator=collator,
        processing_class=tokenizer,
        compute_metrics=compute_metrics,
    )

    trainer.train()

    test_metrics = trainer.evaluate(eval_dataset=test_tok, metric_key_prefix="test")
    os.makedirs("results", exist_ok=True)
    with open("results/mt5_maya_es_test_metrics.json", "w", encoding="utf-8") as f:
        json.dump(test_metrics, f, indent=2)
    print("Test metrics:", test_metrics)


if __name__ == "__main__":
    main()
