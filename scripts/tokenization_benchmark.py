"""
Phase 1-2 tokenization benchmark: compares tokens-per-word (compression ratio)
of standard Latin-subword multilingual tokenizers (mBERT, mT5) across
Yucatec Maya, Spanish, Hindi, and English.

Maya + Spanish sentences come from the CPLM corpus (dev split).
Hindi/English/Spanish reference sentences come from FLORES-200 devtest.
"""
import json
from transformers import AutoTokenizer

from orthography_normalizer import normalize as normalize_orthography

LANG_FILES = {
    "yua_maya_cplm": "data/raw/cplm_maya_spanish/dev.maya",
    "spa_cplm": "data/raw/cplm_maya_spanish/dev.spanish",
    "yua_maya_ccc": "data/raw/yua_es_ccc/yua_only.txt",
    "spa_ccc": "data/raw/yua_es_ccc/es_only.txt",
    "eng_flores200": "data/raw/flores200/eng_Latn.devtest",
    "hin_flores200": "data/raw/flores200/hin_Deva.devtest",
    "spa_flores200": "data/raw/flores200/spa_Latn.devtest",
}
# Languages where we additionally report a normalized-orthography variant,
# to measure whether the Phase 1 normalizer reduces token count on its own.
NORMALIZE_VARIANTS = ["yua_maya_cplm", "yua_maya_ccc"]

TOKENIZERS = {
    "mBERT": "bert-base-multilingual-cased",
    "mT5": "google/mt5-base",
}

N_SENTENCES = 500  # cap per language for a fast, reproducible mid-progress run


def load_sentences(path, n=N_SENTENCES):
    with open(path, encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]
    return lines[:n]


def main():
    sentences = {lang: load_sentences(path) for lang, path in LANG_FILES.items()}
    for lang in NORMALIZE_VARIANTS:
        sentences[lang + "_normalized"] = [normalize_orthography(l) for l in sentences[lang]]

    results = {}
    for tok_name, tok_id in TOKENIZERS.items():
        print(f"Loading tokenizer: {tok_name} ({tok_id})")
        tokenizer = AutoTokenizer.from_pretrained(tok_id)
        results[tok_name] = {}
        for lang, lines in sentences.items():
            total_words = sum(len(l.split()) for l in lines)
            total_tokens = sum(len(tokenizer.tokenize(l)) for l in lines)
            ratio = total_tokens / total_words
            results[tok_name][lang] = {
                "n_sentences": len(lines),
                "total_words": total_words,
                "total_tokens": total_tokens,
                "tokens_per_word": round(ratio, 3),
            }
            print(f"  {lang:18s} words={total_words:7d} tokens={total_tokens:7d} "
                  f"tokens/word={ratio:.3f}")

    with open("results/tokenization_benchmark.json", "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nSaved results/tokenization_benchmark.json")


if __name__ == "__main__":
    main()
