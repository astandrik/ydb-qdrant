## Evaluation, CI, and Release

The repository includes workflows and tests to validate both correctness and information retrieval quality.

### CI Workflows

GitHub Actions workflows cover:

- Build and typecheck.
- Unit and integration tests.
- Integration tests against YDB using the integration suite.
- Recall and F1 evaluation for different storage layouts.

Badges in the root README link to:

- Build: `ci-build.yml`
- Tests: `ci-tests.yml`
- Integration tests: `ci-integration.yml`
- Recall/F1: `ci-recall.yml` with badges for multi_table and one_table layouts.

### Recall and F1 Evaluation

Semantic recall and F1 metrics are computed using seeded datasets and integration tests that query YDB and compare retrieved results against ground truth.

High-level IR evaluation background (precision/recall/F1, MAP, nDCG) follows the guidelines from:

- [Manning et al., *Introduction to Information Retrieval*, Chapter 8](https://nlp.stanford.edu/IR-book/pdf/08eval.pdf).

### Releasing and Publishing

Releasing and publishing to npm is automated but can also be done manually.

Versioning:

- Use semantic versioning as described in the npm docs.
- From `ydb-qdrant/`, run:

```bash
npm version patch|minor|major
```

to bump the version and create a git tag (for example, `ydb-qdrant-v0.2.0`).

Manual publish:

- Ensure you are logged in to npm (`npm whoami`).
- From `ydb-qdrant/`, run:

```bash
npm publish
```

This will run tests and build via the `prepublishOnly` script before uploading the tarball.

CI publish:

- GitHub Actions workflow `.github/workflows/publish-ydb-qdrant.yml` publishes on tags matching `ydb-qdrant-v*`.
- Configure the `NPM_TOKEN` secret in the repository; the workflow runs:

```bash
npm ci
npm test
npm run build
npm publish
```


