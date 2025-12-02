window.BENCHMARK_DATA = {
  "lastUpdate": 1764680136673,
  "repoUrl": "https://github.com/astandrik/ydb-qdrant",
  "entries": {
    "Load Test - Soak (multi_table, 768D)": [
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b7733ce3a8904dcfe30a3c1bca479c0c8117508d",
          "message": "chore: load testing (#116)\n\n* chore: load testing\n\n* fix: better load\n\n* fix: tests\n\n* fix: review fixes\n\n* fix: better breaking point\n\n* fix: increase VUS\n\n* fix: increase bus\n\n* fix: load test\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests formatting\n\n* fix: formatting\n\n* Update loadtest/stress-test.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update loadtest/BreakingPointRunner.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update loadtest/BreakingPointRunner.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* fix: tests\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T15:51:40+03:00",
          "tree_id": "afdc47d6a80695509a86cff36731840130e9305f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b7733ce3a8904dcfe30a3c1bca479c0c8117508d"
        },
        "date": 1764680135511,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 134,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 105,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      }
    ],
    "Load Test - Soak Capacity (multi_table, 768D)": [
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b7733ce3a8904dcfe30a3c1bca479c0c8117508d",
          "message": "chore: load testing (#116)\n\n* chore: load testing\n\n* fix: better load\n\n* fix: tests\n\n* fix: review fixes\n\n* fix: better breaking point\n\n* fix: increase VUS\n\n* fix: increase bus\n\n* fix: load test\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests\n\n* fix: tests formatting\n\n* fix: formatting\n\n* Update loadtest/stress-test.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update loadtest/BreakingPointRunner.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update AGENTS.md\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* Update loadtest/BreakingPointRunner.js\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n* fix: tests\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T15:51:40+03:00",
          "tree_id": "afdc47d6a80695509a86cff36731840130e9305f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b7733ce3a8904dcfe30a3c1bca479c0c8117508d"
        },
        "date": 1764680136452,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 44.24100047246617,
            "unit": "ops/s"
          }
        ]
      }
    ]
  }
}