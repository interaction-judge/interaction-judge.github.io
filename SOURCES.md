# Content provenance

The source of truth is the user's local paper at `../Interaction-as-a-Judge-Arxiv-/`. Website content is based on the active manuscript sections, excluding commented-out material and legacy files. Author affiliations and the internship footnote were verified against both `root.tex` and the first page of `root.pdf` on October 12, 2026. The downloadable PDF is that directory's `root.pdf`, created October 12, 2026.

## Author affiliations

1. Carnegie Mellon University
2. Arena
3. University of California, Berkeley
4. University of California, Los Angeles

Wayne Chi: 1, 2; I-Hung Hsu: 2; Li Chen: 2; Wei-Lin Chiang: 2; Ion Stoica: 2, 3; Anastasios Nikolas Angelopoulos: 2; Ameet Talwalkar: 1; Chris Donahue: 1; Cho-Jui Hsieh: 2, 4. Wayne Chi's footnote reads: “Work done as part of an internship at Arena.”

| Website content                        | Manuscript source                     |
| -------------------------------------- | ------------------------------------- |
| Title, author order, affiliations      | `root.tex`                            |
| Abstract and headline findings         | `sections/00_abstract.tex`            |
| Dataset sizes, filtering, requirements | `sections/04_problem.tex`             |
| Preference-category counts             | `sections/appendix/data.tex`          |
| Preference and correctness results     | `sections/04_setting1_arena.tex`      |
| Repairs and reinforcement learning     | `sections/05_setting2_complaints.tex` |
| Framework figure                       | `figures/fig_main.pdf`                |
| Human preference figure                | `figures/webdev_overall_comparison.pdf` |
| Correctness verification figure         | `figures/correctness_scaling.pdf`     |
| Inference-time scaling figure           | `figures/iterative_solving_v3.pdf`    |
| Training figure                         | `figures/training_comparison.pdf`    |

## Result context

- Preference accuracy: **65.6 → 69.1%**, Gemini 3 Flash; code+screenshot reaches **67.6%**. The **70.8%** reward-model result is the full-code setting (the introduction's **70.2%** result uses the App.tsx setting).
- The manuscript reports no statistically significant preference improvement for GPT 5.6 Luna. The website explicitly notes this exception.
- Requirement verification: **77.0 → 81.6%** with GPT 5.6 Sol.
- Repair: **55.4 → 75.5%** within five attempts. GPT 5.6 Luna repairs; GPT 5.6 Sol evaluates. The headline values use interaction-based verification. These are model-verified repair rates, not human-verified repairs.
- Training: **6.7 percentage-point** win-rate gain over the base model, conditional on successful builds, using an auto-rubrics judge. **35.7%** less generated code and **7.2 percentage-point** fewer build failures compare against a code-only reward signal. Training excludes games.
- Dataset totals: **6,858** pairs across seven categories; **222** application versions, **412** requirements (**323** broken and **89** working), **67** traces, **828** user turns.

The website presents the paper’s four main results in separate sections: human preferences, correctness verification, inference-time scaling, and training. Each includes a concise explanation and the corresponding original paper figure, rasterized from PDF at 2,400 pixels wide. All four result figures and the overview link to their full-size images.

No public arXiv identifier, code URL, or dataset URL was present in the manuscript source. The site serves the local manuscript and does not fabricate release links or publication status.
