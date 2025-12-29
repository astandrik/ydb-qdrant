## Evaluation, CI, and Release

The repository includes workflows and tests to validate both correctness and information retrieval quality.

### CI Workflows

GitHub Actions workflows cover:

- Build and typecheck.
- Unit and integration tests.
- Integration tests against YDB using the integration suite.
- Recall and F1 evaluation for the one-table global layout (approximate and exact search modes).

Badges in the root README link to:

- Build: `ci-build.yml`
- Tests: `ci-tests.yml`
- Integration tests: `ci-integration.yml`
- Recall/F1: `ci-recall.yml` with badges for the one_table layout.

### Recall and F1 Evaluation

Semantic recall and F1 metrics are computed following [ANN-benchmarks](https://github.com/erikbern/ann-benchmarks) methodology.

#### Benchmark Parameters

The recall benchmark uses realistic parameters designed to measure actual approximate search quality:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Dimensions | 768 | Matches transformer embeddings (sentence-transformers, BERT) |
| Dataset size | 5,000 | Similar scale to Fashion-MNIST benchmark |
| Query count | 50 | Statistical significance |
| K (top-K) | 10 | Standard ANN-benchmarks setting |
| Distance | Cosine | Angular/cosine similarity |
| Pass threshold | 30% | Realistic for approximate search |

#### Ground Truth Computation

Ground truth is computed via **exact brute-force k-NN**:
1. Generate random normalized vectors for dataset and queries
2. For each query, compute cosine similarity to all dataset points
3. Sort by descending similarity and take top-K as ground truth
4. Compare search results against ground truth

This methodology ensures:
- No artificial cluster separation (random vectors)
- Realistic similarity distributions
- Meaningful recall measurements (30-70% expected)

#### Metrics

- **Recall@K**: `|retrieved ∩ ground_truth| / K`
- **F1**: Harmonic mean of precision and recall
- **Pass threshold**: Mean recall ≥ 30%

High-level IR evaluation background follows:
- [Manning et al., *Introduction to Information Retrieval*, Chapter 8](https://nlp.stanford.edu/IR-book/pdf/08eval.pdf)
- [Aumüller et al., *ANN-Benchmarks*, SISAP 2017](https://itu.dk/~maau/additional/sisap2017-preprint.pdf)

#### CI Output

Tests output metrics for Shields.io badges:
```
RECALL_MEAN_ONE_TABLE <value>
F1_MEAN_ONE_TABLE <value>
```

### Releasing and Publishing

Releasing and publishing to npm is automated but can also be done manually.

Versioning:

- Use semantic versioning as described in the npm docs.
- From `ydb-qdrant/`, run:

```bash
npm version patch|minor|major
```

to bump the version and create a git tag (for example, `v0.2.0`).

Manual publish:

- Ensure you are logged in to npm (`npm whoami`).
- From `ydb-qdrant/`, run:

```bash
npm publish
```

This will run tests and build via the `prepublishOnly` script before uploading the tarball.

CI publish:

- GitHub Actions workflow `.github/workflows/publish-ydb-qdrant.yml` publishes when a GitHub Release is published (typically for `v*` tags created by Release Please).
- Configure the `NPM_TOKEN` secret in the repository; the workflow runs:

```bash
npm ci
npm test
npm run build
npm publish
```


