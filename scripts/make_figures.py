"""
Generates the figures and sample-tokenization table for the mid-progress report:
  1. results/figures/tokens_per_word.png - bar chart of tokens/word by language x tokenizer
  2. results/sample_tokenizations.json - qualitative fragmentation examples (Maya vs Spanish/English)
"""
import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from transformers import AutoTokenizer

with open("results/tokenization_benchmark.json", encoding="utf-8") as f:
    results = json.load(f)

LANG_LABELS = {
    "yua_maya_cplm": "Maya\n(CPLM)",
    "spa_cplm": "Spanish\n(CPLM, same domain)",
    "spa_flores200": "Spanish\n(FLORES-200)",
    "hin_flores200": "Hindi\n(FLORES-200)",
    "eng_flores200": "English\n(FLORES-200)",
}
order = ["yua_maya_cplm", "spa_cplm", "spa_flores200", "hin_flores200", "eng_flores200"]

fig, ax = plt.subplots(figsize=(8, 4.5))
x = range(len(order))
width = 0.35
mbert_vals = [results["mBERT"][k]["tokens_per_word"] for k in order]
mt5_vals = [results["mT5"][k]["tokens_per_word"] for k in order]

ax.bar([i - width/2 for i in x], mbert_vals, width, label="mBERT", color="#4C72B0")
ax.bar([i + width/2 for i in x], mt5_vals, width, label="mT5", color="#DD8452")
ax.set_xticks(list(x))
ax.set_xticklabels([LANG_LABELS[k] for k in order], fontsize=9)
ax.set_ylabel("Tokens per word")
ax.set_title("Tokenization fertility by language (500 sentences/language)")
ax.axhline(1.0, color="gray", linewidth=0.8, linestyle="--")
ax.legend()
for i, v in enumerate(mbert_vals):
    ax.text(i - width/2, v + 0.05, f"{v:.2f}", ha="center", fontsize=8)
for i, v in enumerate(mt5_vals):
    ax.text(i + width/2, v + 0.05, f"{v:.2f}", ha="center", fontsize=8)

plt.tight_layout()
import os
os.makedirs("results/figures", exist_ok=True)
plt.savefig("results/figures/tokens_per_word.png", dpi=150)
print("Saved results/figures/tokens_per_word.png")

# Sample fragmentation examples
tokenizer_mbert = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
tokenizer_mt5 = AutoTokenizer.from_pretrained("google/mt5-base")

with open("data/raw/cplm_maya_spanish/dev.maya", encoding="utf-8") as f:
    maya_lines = [l.strip() for l in f if l.strip()][:5]
with open("data/raw/cplm_maya_spanish/dev.spanish", encoding="utf-8") as f:
    spa_lines = [l.strip() for l in f if l.strip()][:5]

samples = []
for maya, spa in zip(maya_lines, spa_lines):
    samples.append({
        "maya_sentence": maya,
        "spanish_sentence": spa,
        "maya_mbert_tokens": tokenizer_mbert.tokenize(maya),
        "maya_mt5_tokens": tokenizer_mt5.tokenize(maya),
        "maya_word_count": len(maya.split()),
        "maya_mbert_token_count": len(tokenizer_mbert.tokenize(maya)),
        "maya_mt5_token_count": len(tokenizer_mt5.tokenize(maya)),
    })

with open("results/sample_tokenizations.json", "w", encoding="utf-8") as f:
    json.dump(samples, f, indent=2, ensure_ascii=False)
print("Saved results/sample_tokenizations.json")
for s in samples:
    print(f"\nMaya: {s['maya_sentence']}")
    print(f"  words={s['maya_word_count']}  mBERT_tokens={s['maya_mbert_token_count']}  mT5_tokens={s['maya_mt5_token_count']}")
    print(f"  mBERT: {s['maya_mbert_tokens']}")
