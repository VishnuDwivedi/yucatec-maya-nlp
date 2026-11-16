#!/bin/bash
#SBATCH --job-name=mt5-maya-es
#SBATCH --account=class_cse57669240fall2026
#SBATCH --partition=general
#SBATCH --qos=class
#SBATCH --time=3:00:00
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --output=%x-%j.out

module load mamba/latest

# Pinned to the versions this script was actually tested against locally,
# to stop chasing API renames from whatever version pip would otherwise grab
# (already hit two: Trainer's tokenizer=->processing_class=, and
# TrainingArguments dropping warmup_ratio on an untested newer release).
pip install --quiet --user --force-reinstall \
  transformers==4.53.2 datasets==4.8.4 evaluate==0.4.6 \
  sacrebleu sentencepiece accelerate protobuf tiktoken

cd "$SLURM_SUBMIT_DIR"
python3 scripts/finetune_mt5.py --epochs 3 --batch_size 16
