# CUET General Test v4 - Section Import Fixtures

Use **One section** import scope. Select the named destination section and upload its matching Word + Excel pair.
Word files use Heading 1/2/3 and tables; they do not use END markers. Each pair demonstrates embedded image content.

## English Language

- Destination: `CUET_SLOT_1 / LANGUAGE`
- Subject: `ENGLISH`
- Word: `01-language-english-content.docx`
- Excel: `01-language-english-mapping.xlsx`
- Questions: 5

## Quantitative Aptitude

- Destination: `CUET_SLOT_1 / QUANT`
- Subject: `MATHEMATICS`
- Word: `02-quant-mathematics-content.docx`
- Excel: `02-quant-mathematics-mapping.xlsx`
- Questions: 5

## Logical Reasoning

- Destination: `CUET_SLOT_1 / REASONING`
- Subject: `REASONING`
- Word: `03-reasoning-logical-reasoning-content.docx`
- Excel: `03-reasoning-logical-reasoning-mapping.xlsx`
- Questions: 5

## Complete exam - all sections

- Import scope: **Full exam**
- Word: `00-full-exam-all-sections-content.docx`
- Excel: `00-full-exam-all-sections-mapping.xlsx`
- Sections: `LANGUAGE`, `QUANT`, `REASONING`
- Subjects: `ENGLISH`, `MATHEMATICS`, `REASONING`
- Questions: 15 (5 per section)
- Uses new `CUET-FULL-*` question codes so it can be tested after the one-section fixtures.
