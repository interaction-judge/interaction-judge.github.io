# Content provenance

The source of truth is the user's local paper at `../Interaction-as-a-Judge-Arxiv-/`, read on October 10, 2026. Website content is based on the active manuscript sections, excluding commented-out material and legacy files. The PDF was copied from that directory's `root.pdf` (created October 10, 2026).

| Website content                        | Manuscript source                     |
| -------------------------------------- | ------------------------------------- |
| Title, author order, affiliations      | `root.tex`                            |
| Abstract and headline findings         | `sections/00_abstract.tex`            |
| Dataset sizes, filtering, requirements | `sections/04_problem.tex`             |
| Preference-category counts             | `sections/appendix/data.tex`          |
| Preference and correctness results     | `sections/04_setting1_arena.tex`      |
| Repairs and reinforcement learning     | `sections/05_setting2_complaints.tex` |
| Framework figure                       | `figures/fig_main.pdf`                |

## Result context

- Preference accuracy: **65.6 → 69.1%**, Gemini 3 Flash; code+screenshot reaches **67.6%**. The **70.8%** reward-model result is the full-code setting (the introduction's **70.2%** result uses the App.tsx setting).
- The manuscript reports no statistically significant preference improvement for GPT 5.6 Luna. The website explicitly notes this exception.
- Requirement verification: **77.0 → 81.6%** with GPT 5.6 Sol.
- Repair: **55.4 → 75.5%** within five attempts. GPT 5.6 Luna repairs; GPT 5.6 Sol evaluates. The headline values use interaction-based verification. These are model-verified repair rates, not human-verified repairs.
- Training: **6.7 percentage-point** win-rate gain over the base model, conditional on successful builds, using an auto-rubrics judge. **35.7%** less generated code and **7.2 percentage-point** fewer build failures compare against a code-only reward signal. Training excludes games.
- Dataset totals: **6,858** pairs across seven categories; **222** application versions, **412** requirements (**323** broken and **89** working), **67** traces, **828** user turns.

The website presents the three main evaluation and repair results in a table. The overview figure is reproduced directly from the paper and links to the full-size image.

No public arXiv identifier, code URL, or dataset URL was present in the manuscript source. The site serves the local manuscript and does not fabricate release links or publication status.
