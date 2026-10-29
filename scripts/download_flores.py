import os
from datasets import load_dataset

os.makedirs("data/raw/flores200", exist_ok=True)

for code in ["eng_Latn", "hin_Deva", "spa_Latn"]:
    ds = load_dataset("Muennighoff/flores200", code)
    devtest = ds["devtest"]
    with open(f"data/raw/flores200/{code}.devtest.txt", "w") as f:
        for row in devtest:
            f.write(row["sentence"].strip() + "\n")
    print(code, len(devtest))
