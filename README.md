# Interaction-as-a-Judge

A simple, single-column research page. Plain HTML and CSS, system fonts, no JavaScript or build step.

## Local preview

```sh
npm run dev
```

Open **http://localhost:8000**. The preview command uses Python 3. Any static web server also works.

## Files

- `index.html`: authors, abstract, key results, datasets, and citation.
- `style.css`: typography and responsive layout.
- `assets/interaction-as-a-judge.pdf`: the paper.
- `assets/figures/overview.png`: the original framework figure.
- `assets/citation.bib`: downloadable BibTeX.

Research content comes from the sibling `Interaction-as-a-Judge-Arxiv-` manuscript as of October 10, 2026. See [SOURCES.md](SOURCES.md) for provenance.

## Deployment

In the repository's **Settings → Pages**, select **GitHub Actions** as the source. The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main` and can also be run manually from the Actions tab.

The workflow uploads the static website files and sets the sharing image and BibTeX website URLs to the actual GitHub Pages address. No framework or build dependencies are needed. Add the public arXiv and dataset URLs when available.
