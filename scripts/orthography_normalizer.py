"""
Phase 1 deliverable: minimal rule-based Yucatec Maya orthography normalizer.

Yucatec Maya text in the wild mixes (at least) two conventions: the modern
INALI/ALMG-descended practical orthography used in CPLM and YUA-ES-CCC, and
older colonial-missionary transcription conventions that still show up in
historical/religious texts. This is a FIRST PASS covering only the handful of
divergences that are well-documented and safe to auto-correct without a
lexicon or a linguist's review. It is explicitly NOT a complete converter --
see Known Limitations below.

Sources for the rules implemented: MustGo "Yucatec Language, Dialects and
Structure" (cited in the project's lit review); general Mayan-orthography
colonial/modern correspondence (c/qu -> k) documented across Mayan-language
orthography literature.
"""
import re
import unicodedata

# 1. Glottal-stop marker normalization.
# Colonial and informal digital text uses several different characters for
# the glottal stop: the ASCII apostrophe ('), the Unicode right single quote
# (’), the modifier letter apostrophe (ʼ), and occasionally the
# digit 7 (a common ASCII-only workaround predating Unicode support). All are
# normalized to the ASCII apostrophe, which is what CPLM and YUA-ES-CCC use.
_GLOTTAL_VARIANTS = ["’", "ʼ", "‘", "ˀ", "`"]


def normalize_glottal_stop(text: str) -> str:
    for ch in _GLOTTAL_VARIANTS:
        text = text.replace(ch, "'")
    # Digit-7-as-glottal-stop is only safe to convert between letters, since
    # "7" is also a literal digit elsewhere in text (sentence/verse numbers,
    # as seen in the CPLM dev examples, e.g. "20Xeene'ex...").
    text = re.sub(r"(?<=[A-Za-zÁÉÍÓÚáéíóúÑñ])7(?=[A-Za-zÁÉÍÓÚáéíóúÑñ])", "'", text)
    return text


# 2. Colonial c/qu -> modern k.
# Colonial-era transcription (Spanish missionary orthography) represented the
# Maya /k/ phoneme with Spanish spelling conventions: "c" before a/o/u, "qu"
# before e/i -- exactly as in Spanish. Modern INALI/ALMG orthography uses "k"
# uniformly. This mapping is applied case-insensitively, preserving case.
_C_BEFORE_AOU = re.compile(r"(?<![a-zA-Z])[cC](?=[aouAOU])")
_QU_BEFORE_EI = re.compile(r"(?<![a-zA-Z])[qQ][uU](?=[eiEI])")


def normalize_colonial_k(text: str) -> str:
    def repl_c(m):
        return "K" if m.group(0).isupper() else "k"

    def repl_qu(m):
        return "K" if m.group(0)[0].isupper() else "k"

    text = _C_BEFORE_AOU.sub(repl_c, text)
    text = _QU_BEFORE_EI.sub(repl_qu, text)
    return text


# 3. Unicode form normalization (NFC), so accented vowels that arrive as a
# base letter + combining diacritic are collapsed to a single precomposed
# codepoint. Tokenizers see combining-diacritic sequences as 2+ codepoints,
# which silently inflates the token count independent of any real linguistic
# difference -- this is a pure text-encoding fix, not an orthographic one.
def normalize_unicode_form(text: str) -> str:
    return unicodedata.normalize("NFC", text)


def normalize(text: str) -> str:
    text = normalize_unicode_form(text)
    text = normalize_glottal_stop(text)
    text = normalize_colonial_k(text)
    return text


if __name__ == "__main__":
    import sys

    examples = [
        "Ba’ale’ ilawile’ex",       # right single quote
        "cux tal",                                  # colonial c before u
        "quiimac",                                  # colonial qu before i
        "20Xeene7ex, wa7alene7ex",                   # digit-7 glottal stop
    ]
    for ex in examples:
        print(f"{ex!r:45s} -> {normalize(ex)!r}")

    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding="utf-8") as f:
            for line in f:
                print(normalize(line.rstrip("\n")))
