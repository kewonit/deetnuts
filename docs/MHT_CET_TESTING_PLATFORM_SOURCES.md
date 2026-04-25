# MHT-CET Testing Platform Sources

## Official Sources Checked

- CET Cell home: https://cetcell.mahacet.org/
- Syllabus index: https://cetcell.mahacet.org/syllabus-and-marking-scheme/
- 2024 technical syllabus PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/08/Technical_Education_CET_syllabus2024-25.pdf
- 2026 normalization PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/12/MHT-CET-2026-Result-Processing-Methodology.pdf
- 2025 mock-test links PDF: https://cetcell.mahacet.org/wp-content/uploads/2023/12/Mocktest_links-3.pdf
- 2025 PCM objection notice: https://cetcell.mahacet.org/wp-content/uploads/2023/12/Notice_OT_-MHT-CET-PCM.pdf

## Import Rule

Public mocks may only use questions whose source row is approved and whose imported question row is approved.
Candidate-login or time-window material must be imported only from files supplied by an authorized operator.
Test fixtures must be marked with source_type `test_fixture` and must not be mixed with production mocks.

## Original Practice Content

`data/mht-cet/question-bank/practice-2026-original.json` contains DEETNUTS-authored practice questions for the 2026 practice bank. These rows use `sourceType: "manual_entry"` and are labeled as original syllabus-aligned practice content, not official MHT-CET past-paper or official mock content. Use `npm run seed:mht-cet-practice` to seed the practice rows into an environment with valid Supabase credentials.

## Product Boundary

DEETNUTS should not label question content as official or year-wise unless a source URL, source file hash, or permission note proves it. The platform can automate validation, duplicate detection, rendering checks, and review workflows, but publication still requires source and question approval.
