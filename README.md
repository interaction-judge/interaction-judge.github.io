# Interaction-as-a-Judge

A simple, single-column research page. Plain HTML and CSS, system fonts, no JavaScript or build step.

## Local preview

```sh
npm run dev
```

Open **http://localhost:8000**. The preview command uses Python 3. Any static web server also works.

## Files

- `index.html`: authors, abstract, four core results with figures, datasets, and citation.
- `style.css`: typography and responsive layout.
- `assets/interaction-as-a-judge.pdf`: the paper.
- `assets/figures/`: the original framework and four result figures from the paper.
- `assets/citation.bib`: downloadable BibTeX.

Research content comes from the sibling `Interaction-as-a-Judge-Arxiv-` manuscript. The author affiliations and downloadable PDF match the October 12, 2026 version. See [SOURCES.md](SOURCES.md) for provenance.

## Deployment

The website's address is **https://interaction-judge.github.io/**. To publish at that address, the repository must be named **`interaction-judge.github.io`** and belong to the **`interaction-judge`** organization.

In the repository's **Settings → Pages**, select **GitHub Actions** as the source. The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main` and can also be run manually from the Actions tab.

Leave the **Custom domain** setting empty to use the organization's `github.io` address. GitHub Free organizations require a public repository for Pages hosting.

The workflow uploads the static website files and sets the sharing image and BibTeX website URLs to the actual GitHub Pages address. No framework or build dependencies are needed. Add the public arXiv and dataset URLs when available.
