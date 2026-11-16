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

# One-time environment setup (safe to re-run; pip skips what's already installed).
pip install --quiet --user transformers datasets evaluate sacrebleu sentencepiece accelerate

cd "$SLURM_SUBMIT_DIR"
python3 scripts/finetune_mt5.py --epochs 3 --batch_size 16
