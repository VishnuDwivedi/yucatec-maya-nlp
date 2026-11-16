const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, AlignmentType, PageBreak,
} = require("docx");

const PAGE_W = 12240, PAGE_H = 15840; // US Letter, DXA

function H1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}
function H2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
}
function P(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 120 } });
}
function Bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 1000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, color: "auto", fill: "D9E2F3" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.header, size: 20 })] })],
  });
}

const statusRows = [
  ["Phase", "Planned", "Status"],
  ["1 — Lit review, data collection, orthography normalizer", "Weeks 1–2", "~85% done"],
  ["2 — Baseline tokenization audit, MT fine-tuning, back-translation calibration", "Weeks 3–4", "Tokenization audit complete (full data, with glottal-stop-aware word counting); MT fine-tuning not started (GPU access pending)"],
  ["3 — SEETOK-Maya, glyph annotation, semantic mapping", "Weeks 5–6", "Not started"],
  ["4 — Evaluation, error analysis", "Weeks 7–8", "Not started"],
  ["5 — Interface prototype, community feedback, final report", "Weeks 9–10", "Not started"],
];

const colWidths = [4200, 2500, 5900];
const statusTable = new Table({
  width: { size: colWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: colWidths,
  rows: statusRows.map((r, i) => new TableRow({
    children: r.map((t, j) => cell(t, { header: i === 0, width: colWidths[j] })),
  })),
});

const resultRows = [
  ["Language / corpus", "mBERT tok/word", "mT5 tok/word", "Inflation vs. English"],
  ["Yucatec Maya (CPLM, dev+test, n=2,706)", "3.09", "3.19", "2.33x (mBERT) / 2.05x (mT5)"],
  ["Spanish (CPLM, same domain)", "1.49", "1.76", "—"],
  ["Spanish (FLORES-200)", "1.43", "1.69", "—"],
  ["Hindi (FLORES-200)", "2.01", "2.08", "1.54x (mBERT) / 1.53x (mT5) vs. Maya"],
  ["English (FLORES-200)", "1.32", "1.56", "1.00x (reference)"],
];
const rcolWidths = [4800, 2200, 2200, 3400];
const resultTable = new Table({
  width: { size: rcolWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: rcolWidths,
  rows: resultRows.map((r, i) => new TableRow({
    children: r.map((t, j) => cell(t, { header: i === 0, width: rcolWidths[j] })),
  })),
});

const sourceRows = [
  ["Source named in proposal", "Verification result"],
  ["FLORES-200 “Maya, Hindi, English” comparison", "Yucatec Maya is not in FLORES-200 (confirmed by enumerating all 200+ language files in the official release). Retained Hindi/English/Spanish as the cross-lingual comparator arm per the proposal's own fallback framing."],
  ["AmericasNLP 2024 “14,438 sentences, CENTROGEO/Yucatán culture ministry”", "Could not locate this exact resource under that name/size. Likely corresponds to a separately documented YUA-ES-CCC corpus (~14,332 pairs); not yet locatable as a direct download. Flagged as an open Phase 1 follow-up."],
  ["CPLM Corpus (28,135 Chol–Yucatec Maya pairs)", "Found and downloaded via RIKEN-DKO/iikim_translator (GitHub). Actual counts: 10,822 train / 1,352 dev / 1,354 test Maya–Spanish pairs (13,528 total) — fewer than 28,135, likely because that figure covers Chol and Maya combined."],
];
const scolWidths = [4600, 8000];
const sourceTable = new Table({
  width: { size: scolWidths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
  columnWidths: scolWidths,
  rows: sourceRows.map((r, i) => new TableRow({
    children: r.map((t, j) => cell(t, { header: i === 0, width: scolWidths[j] })),
  })),
});

const sampleData = JSON.parse(fs.readFileSync("results/sample_tokenizations.json", "utf-8"));
// pick two illustrative, non-degenerate samples (skip the 1-word BOM artifact)
const picks = [sampleData[2], sampleData[3]];

function sampleBlock(s) {
  return [
    new Paragraph({ children: [new TextRun({ text: "Maya: ", bold: true }), new TextRun({ text: s.maya_sentence })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: `Words: ${s.maya_word_count}   mBERT tokens: ${s.maya_mbert_token_count}   mT5 tokens: ${s.maya_mt5_token_count}`, italics: true, size: 20 })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: "mBERT fragmentation: ", bold: true, size: 20 }), new TextRun({ text: s.maya_mbert_tokens.join(" | "), size: 18, font: "Courier New" })], spacing: { after: 160 } }),
  ];
}

const imageBuf = fs.readFileSync("results/figures/tokens_per_word.png");

const children = [
  new Paragraph({ text: "Mid-Progress Report", heading: HeadingLevel.TITLE }),
  new Paragraph({
    children: [new TextRun({ text: "Semantic Sovereignty in NLP: Optimizing Data Efficiency and Reducing Orthographic Friction in Yucatec Maya Through Native-Script Semantic Interfaces", bold: true, size: 26 })],
    spacing: { after: 160 },
  }),
  P("Vishnu Dwivedi — vdwived2@asu.edu — CSE 576, November 2026"),

  H1("1. Progress and Implementation"),
  H2("1.1 Status Summary"),
  statusTable,
  new Paragraph({ text: "", spacing: { after: 160 } }),
  P("The highest-value, highest-risk item in the proposal — the tokenization-penalty hypothesis — has been tested empirically, ahead of schedule, because it required no GPU and no model training, only tokenizer inference. All numbers below are real measurements on real data, not placeholders or projections."),

  H2("1.2 Methods Implemented"),
  P("The implemented pipeline (scripts/tokenization_benchmark.py, scripts/make_figures.py) does the following:"),
  Bullet("Loads sentence sets from each corpus (Maya and Spanish from CPLM; English, Hindi, Spanish from FLORES-200)."),
  Bullet("Tokenizes each sentence with two standard multilingual subword tokenizers named in the proposal as Baseline 1 and Baseline 2: mBERT (bert-base-multilingual-cased) and mT5 (google/mt5-base)."),
  Bullet("Computes tokens-per-word (fertility) = total subword tokens / total whitespace-delimited words, aggregated per language per tokenizer."),
  Bullet("In this revision, word counts additionally account for Yucatec Maya's glottal-stop orthography (apostrophes marking glottalized consonants, e.g. k'iin), so naive whitespace splitting does not silently merge or split glottalized forms incorrectly — a methodological fix flagged as a to-do in the prior checkpoint."),
  Bullet("Generates a comparison bar chart (Figure 1) and a qualitative sample-fragmentation table (Section 2.3) for direct inspection, not just aggregate ratios."),

  H2("1.3 Datasets Used"),
  P("Two corpora are in active use:"),
  Bullet("CPLM Maya–Spanish corpus: 10,822 train / 1,352 dev / 1,354 test sentence pairs (13,528 total), legal-register text, obtained via the RIKEN-DKO/iikim_translator GitHub release. This is the project's primary Maya text source."),
  Bullet("FLORES-200 devtest: 1,012 sentences each for English, Hindi, and Spanish, pulled directly from Meta's public flores200_dataset.tar.gz. Used as the cross-lingual comparator arm (the “Hindi as reference point” framing from the proposal)."),
  P("Both are committed under data/raw/ with train/dev/test splits intact; results/tokenization_benchmark.json and results/sample_tokenizations.json hold the raw measurements for reproducibility."),

  H2("1.4 Changes from the Original Proposal, and Why"),
  P("Two of the three data sources named in the original proposal do not exist in the form described. This was discovered during Phase 1 verification, not assumed, and the project plan was adjusted using exactly the contingency logic the proposal's own risk table anticipated (“Corpus denied → CPLM + AmericasNLP 2024 only”):"),
  sourceTable,
  new Paragraph({ text: "", spacing: { after: 160 } }),
  P("Revised Phase 1 data plan: CPLM (Maya ↔ Spanish) as the primary Maya text source; FLORES-200 Hindi/English/Spanish as the cross-lingual comparator arm; continued effort to source YUA-ES-CCC or the full AmericasNLP Maya set in parallel, with CPLM alone as the confirmed fallback. No other scope changes were made to Phase 1."),

  H1("2. Intermediate Results"),
  H2("2.1 Tokenization Fertility by Language"),
  P("Table 2 reports tokens-per-word on the full available data (CPLM dev+test combined, n=2,706 Maya sentences; FLORES-200 devtest, n=1,012 per language), an extension beyond the 500-sentence cap used in the prior checkpoint."),
  resultTable,
  new Paragraph({ text: "", spacing: { after: 160 } }),
  new Paragraph({
    children: [new ImageRun({ type: "png", data: imageBuf, transformation: { width: 580, height: 326 } })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ children: [new TextRun({ text: "Figure 1. Tokens-per-word by language and tokenizer. Maya is tokenized less efficiently than every comparator, including Hindi.", italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),

  H2("2.2 Relation to the Original Research Questions"),
  P("The project's central hypothesis — that Yucatec Maya pays a measurable “tokenization tax” under standard multilingual subword tokenizers, consistent with the literature's 3–5x figure for non-Latin/agglutinative languages — is partially supported:"),
  Bullet("Maya/English inflation is 2.33x (mBERT) / 2.05x (mT5): directionally consistent with the hypothesis, but below the 3–5x range reported for other non-Latin languages in the cited literature."),
  Bullet("Maya is tokenized even less efficiently than Hindi (1.54x / 1.53x worse), which is itself documented in the literature as a penalized non-Latin script. This strengthens the claim that Maya sits near the worst case for tokenization fairness, even relative to another disadvantaged language, not only relative to English."),
  Bullet("The cleanest same-domain comparison (Maya vs. Spanish, both CPLM legal text) shows a 2.07x inflation (mBERT) even when register and topic are held constant, which rules out “it's just that the corpora are different genres” as the explanation."),
  P("This is reported as a genuine, partially-disconfirming finding rather than adjusted to fit the proposal's framing: the 3–5x figure in the literature review was explicitly a motivating estimate to test, not a guaranteed outcome, and the measured 2.0–2.3x range is the first direct evidence specific to Yucatec Maya."),

  H2("2.3 Sample Outputs and Qualitative Error Analysis"),
  P("To make the aggregate ratios concrete, two representative CPLM dev sentences and their tokenizer fragmentation are shown below (full set in Appendix A):"),
  ...sampleBlock(picks[0]),
  ...sampleBlock(picks[1]),
  P("Qualitative pattern observed: both tokenizers repeatedly split glottal-stop sequences (apostrophe + following vowel/consonant, e.g. ex’, ol’, le’) into separate subword pieces rather than treating the glottalization as part of a coherent morpheme, and frequently fall back to single-character or [UNK]-adjacent fragments on sequences containing accented vowels (ú, é, ó, í). This is consistent with the “morphological incoherence” tax described in the literature review (Kamali, 2026): the subword vocabulary was never trained on Maya's orthography, so it has no efficient representation for glottalization or vowel-length marking, and pays for both with extra tokens."),

  H2("2.4 Caveats"),
  Bullet("Domain mismatch between CPLM (legal/formal register) and FLORES-200 (general-domain Wikipedia-style text) is a real confound; the same-domain Maya-vs-Spanish comparison in Section 2.2 is the more defensible number for final reporting."),
  Bullet("These are tokenizer-inference measurements only (no model forward pass, no training); they establish the input-side cost but do not yet show downstream translation-quality impact, which baseline fine-tuning (Section 4) is intended to measure next."),

  H1("3. GitHub and Demo"),
  P("Code and data are in a GitHub repository with a README covering dependencies, dataset provenance, and exact run commands for every script referenced in this report (tokenization_benchmark.py, make_figures.py, download_flores.py). No GPU or paid API access is required to reproduce anything in this report — every result here comes from tokenizer inference on public data."),
  P("Repository: [GitHub URL to be inserted before submission]."),
  P("No video demo was produced this cycle; Figure 1 and the sample-fragmentation table in Section 2.3 are the primary visual evidence of progress at this stage. A short demo (CLI run of the benchmark script end-to-end) is planned for the next checkpoint once baseline MT fine-tuning produces translation outputs worth showing."),

  H1("4. Team and Individual Contributions"),
  P("This is a solo project. All work to date — literature review, data sourcing and verification, corpus acquisition and cleaning, pipeline implementation (tokenization_benchmark.py, download_flores.py, make_figures.py), the tokenization-fertility experiment, figure and table generation, and this report — was completed by Vishnu Dwivedi (vdwived2@asu.edu)."),

  H1("5. Challenges and Next Steps"),
  H2("5.1 What Is Working"),
  Bullet("The tokenization-tax hypothesis is testable and has been tested without GPU access, producing real, reproducible numbers one checkpoint ahead of the proposal's own schedule for this measurement."),
  Bullet("Data-source verification caught two incorrect assumptions in the original proposal before they could derail later phases, and the fallback was resolved using the proposal's own contingency plan rather than an ad hoc fix."),
  H2("5.2 What Is Not Working / Not Started"),
  Bullet("Baseline MT fine-tuning (mT5 on CPLM for Maya→Spanish, BLEU/ChrF) — blocked on GPU access. ASU Research Computing (RC) access was set up and connection-verified this cycle; the next step is submitting the actual fine-tuning job."),
  Bullet("Orthography normalizer (INALI vs. Academia de la Lengua Maya rule-based converter) — not started; needs a linguist-reviewed rule set."),
  Bullet("SEETOK-Maya visual tokenizer and glyph annotation (Phase 3) — not started; this remains the project's highest schedule risk because it depends on recruiting a Maya linguist or community annotator, a scheduling task rather than a coding task."),
  Bullet("Back-translation augmentation and ChrF-based filtering — not started."),
  H2("5.3 Realistic Timeline to Final Deliverables"),
  Bullet("Week of Nov 16: submit mT5-small fine-tuning job on CPLM train split via ASU RC (sol cluster); report BLEU/ChrF on held-out test split. If RC job queueing delays this, substitute a zero-shot mT5/NLLB baseline as a clearly-labeled stand-in, per the proposal's contingency logic."),
  Bullet("Week of Nov 23: draft orthography normalizer (minimal INALI↔ALMG character/digraph mapping table covering apostrophe placement and x/sh conventions); begin outreach for a Maya-language annotator/linguist in parallel (does not block other work)."),
  Bullet("Weeks of Nov 30–Dec 7: if an annotator is secured, begin SEETOK-Maya glyph annotation at small scale; otherwise, deepen the baseline MT error analysis and expand the tokenization benchmark to additional tokenizers (e.g., NLLB, XLM-R) for a broader comparator set."),
  Bullet("Final report: consolidate baseline MT results, tokenization analysis, and (if completed) the orthography normalizer and/or SEETOK-Maya prototype into the final writeup and interface demo."),

  new Paragraph({ children: [new PageBreak()] }),
  H1("References"),
  P("Ahia, O., Mielke, S. J., et al. (2023). Do All Languages Cost the Same? Tokenization in the Era of Commercial Language Models. As cited in Crowdsourcing Piedmontese to Test LLMs on Non-Standard Orthography (2026), arXiv:2602.14675."),
  P("Joshi, P., Santy, S., Budhiraja, A., Bali, K., & Choudhury, M. (2020). The State and Fate of Linguistic Diversity and Inclusion in the NLP World. ACL 2020."),
  P("Kamali, O. (2026). Tokenization is Killing our Multilingual LLM Dream. Hugging Face Blog. huggingface.co/blog/omarkamali/tokenization"),
  P("Kornai, A. (2013). Digital Language Death. PLOS ONE. journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0077056"),
  P("Petrov, A., La Malfa, E., Torr, P., & Bibi, A. (2023). Language Model Tokenizers Introduce Unfairness Between Languages. As cited in Tokenization Disparities as Infrastructure Bias (2026), arXiv:2510.12389."),
  P("Rangel, D., & Kobayashi, V. B. (2024). AmericasNLP 2024 Shared Task: Machine Translation into Indigenous Languages. Proceedings of the 4th Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP 2024). ACL Anthology. aclanthology.org/volumes/2024.americasnlp-1"),
  P("Tokenization Disparities as Infrastructure Bias (2026). arXiv:2510.12389. arxiv.org/pdf/2510.12389"),
  P("See the Text: From Tokenization to Visual Reading (2026). arXiv:2510.18840. arxiv.org/pdf/2510.18840 (SEETOK)"),
  P("Rosado van der Gracht, C. (2025, December 12). Sáastun AI, A New Breakthrough Language Model Capable of Deciphering Maya Glyphs. Yucatán Magazine. yucatanmagazine.com/saastun-ai-deciphering-maya-glyphs"),
  P("Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. NAACL 2019. (mBERT)"),
  P("Xue, L., Constant, N., Roberts, A., et al. (2021). mT5: A Massively Multilingual Pre-trained Text-to-Text Transformer. NAACL 2021."),
  P("NLLB Team et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation. (FLORES-200 benchmark)."),

  new Paragraph({ children: [new PageBreak()] }),
  H1("Appendix A: Additional Sample Tokenizations"),
  P("Remaining qualitative examples from the sample-fragmentation set (results/sample_tokenizations.json), supplementing Section 2.3:"),
  ...sampleBlock(sampleData[0]),
  ...sampleBlock(sampleData[1]),
  ...sampleBlock(sampleData[4]),

  H1("Appendix B: Repository Structure"),
  new Paragraph({
    children: [new TextRun({
      text: "cse576/\n├── README.md\n├── PROGRESS_REPORT.md / .docx\n├── data/raw/\n│   ├── cplm_maya_spanish/   # train/dev/test .maya + .spanish files\n│   └── flores200/           # eng_Latn, hin_Deva, spa_Latn devtest\n├── scripts/\n│   ├── download_flores.py\n│   ├── tokenization_benchmark.py\n│   └── make_figures.py\n└── results/\n    ├── tokenization_benchmark.json\n    ├── sample_tokenizations.json\n    └── figures/tokens_per_word.png",
      font: "Courier New", size: 18,
    })],
  }),
];

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      title: { run: { font: "Calibri", size: 36, bold: true }, paragraph: { spacing: { after: 160 } } },
      heading1: { run: { font: "Calibri", size: 28, bold: true, color: "1F3864" }, paragraph: { spacing: { before: 280, after: 140 }, keepNext: true } },
      heading2: { run: { font: "Calibri", size: 24, bold: true, color: "2E5496" }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true } },
    },
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Mid_Progress_Report.docx", buf);
  console.log("Wrote Mid_Progress_Report.docx");
});
