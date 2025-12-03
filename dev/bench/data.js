window.BENCHMARK_DATA = {
  "lastUpdate": 1764796159572,
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
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681504096,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 120,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 53,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705511311,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 127,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 55,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706149666,
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
            "value": 62,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707391643,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 128,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 52,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708718836,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 54,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709917670,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 127,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 58,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710538350,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 58,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744380998,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 140,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 65,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748665787,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 124,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 58,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748799902,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 122,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 53,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795804982,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 129,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 59,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795936404,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 130,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 59,
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
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681505887,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.176027911595625,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705513068,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.35131671796232,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706151689,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.89609542152274,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707393579,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.18136303404588,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708720976,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.9527545738621,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709919964,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.01831391969632,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710540115,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.47586396263309,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744382048,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 49.36373387130528,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748670869,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.1616528037627,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748801263,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.143861226270204,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795806260,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 50.41996818111256,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795937801,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 50.58317557855111,
            "unit": "ops/s"
          }
        ]
      }
    ],
    "Load Test - Soak (one_table, 768D)": [
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
        "date": 1764680136660,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 135,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 128,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681503646,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705512643,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 119,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 61,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705526111,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 119,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 56,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706140529,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 116,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 56,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706140448,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 118,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 53,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707395050,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 52,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707396326,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 123,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 61,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708718410,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 50,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708724456,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 124,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 62.54999999999973,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709925231,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 123,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 52,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709926803,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 124,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 65,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710537005,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 118,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710543750,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 116,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 55,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744361227,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 126,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 57,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744366996,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 126,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 66,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748664848,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 63,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748670154,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 123,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 57,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748815556,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 120,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 51,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748822285,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 122,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 59,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795797203,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 121,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795798043,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 118,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 55,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795906928,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 120,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795916548,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 117,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 51,
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
    "Load Test - Soak Capacity (one_table, 768D)": [
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
        "date": 1764680138207,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 38.9643434551224,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681504968,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.04760277329963,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705514011,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.194120114104564,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705527315,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.55036583648973,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706142631,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.31507925797162,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706141772,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 49.007485481703824,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707397888,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.35489506891446,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707400794,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 47.4371410319052,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708719391,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 53.19927725755436,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708725660,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 47.37743348586193,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709927309,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.16771788281497,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764709928701,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 47.28976395059935,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710538061,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.28358600850335,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710544879,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.16666289551294,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744362479,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.195505046954615,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744368130,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 46.63489885959856,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748674030,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.154196313634024,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748668423,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 47.34967725728986,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748817502,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.83446006474846,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764748823391,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.06766716971406,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795799808,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.86156215414751,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764795799119,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 47.72434463808679,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795908866,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 48.0352771297985,
            "unit": "ops/s"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764795917939,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.86402355411531,
            "unit": "ops/s"
          }
        ]
      }
    ],
    "Load Test - Stress (multi_table, 768D)": [
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
        "date": 1764680452200,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3943.0999999999995,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4092,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2894.1499999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681754380,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3697.0499999999993,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3866,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2668,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705749990,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3689.7999999999993,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3877,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2660.45,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706391370,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4026.25,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4220,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2920.2,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707637782,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3696,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3806,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2659,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708976451,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3687,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3816,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2676,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710156649,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3809,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3916,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2739,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710793025,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3657,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3772,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2626.5999999999995,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744605489,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3731,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3858,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2700,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748914576,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3935,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4119,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2833.6,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749043217,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3687,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 3826,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2647.8,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796047989,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4270,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4508,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2300.45,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764796148123,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3980,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4156,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2148.7999999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      }
    ],
    "Load Test - Stress Capacity (multi_table, 768D)": [
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
        "date": 1764680453968,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 90.01371726308619,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681755441,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 109.17971892418005,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705751020,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 111.32935461426703,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706392913,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 101.8455889441745,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 350,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707638711,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 109.28434186113653,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708978374,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 107.21878199264997,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710157788,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 107.50127181929297,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710795004,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 110.49308014274642,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744606876,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 107.3274323173338,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748916463,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 101.88943766783257,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749044327,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 109.11262176606654,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796049961,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 100.68997274687477,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 350,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764796149242,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 108.4223995186534,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 350,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      }
    ],
    "Load Test - Stress (one_table, 768D)": [
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
        "date": 1764680468889,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5540,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5694,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5483.8,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681755047,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5195,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5303,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5095,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705764017,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5032,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5166,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4938.65,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705766290,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5299.699999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5476,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5152.65,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706391838,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5587,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5767,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5430,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706397032,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5403,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5525,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5305,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707646874,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5640.9,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5873,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5459,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707654039,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5787,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5948,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5703.35,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708972440,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5620,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5835,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5495.799999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708974382,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5052,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5212,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4960.25,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710165700,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5768.45,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5953,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5672.999999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710173819,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5544.849999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5713,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5417.799999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710790141,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5055,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5204,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4961.299999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710791900,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5598,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5728,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5438.25,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744609480,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5672,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5831,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5509,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744614084,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5349,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5485,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5255,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748912986,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5049,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5197,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4954.6,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749044634,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5022,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5137,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4930,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749049807,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5638,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5788,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5449.4,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796039757,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4719.299999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5156,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4262.45,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796063931,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5838,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5960,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4852.7,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      },
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764796159256,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 6005,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6234,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4939.65,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0,
            "unit": "%"
          }
        ]
      }
    ],
    "Load Test - Stress Capacity (one_table, 768D)": [
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
        "date": 1764680470750,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 91.19772637356141,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "a654fe6f5e0a0aefdb58114d1df1e652d8a46940",
          "message": "feat: batch upserts (#115)\n\n* feat: batch upserts\n\n* fix: test",
          "timestamp": "2025-12-02T16:14:36+03:00",
          "tree_id": "3462dc896f823c7d30870bc2fa0f23061c9f7beb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a654fe6f5e0a0aefdb58114d1df1e652d8a46940"
        },
        "date": 1764681757982,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 117.14586342287485,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705765879,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 118.64294175332778,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "e28db4d5c68bd889b80df539543e7af16058fae9",
          "message": "feat: make one table refinements (#118)\n\n* feat: make one table refinements\n\n* fix: add badbe\n\n* fix: tests\n\n* Update src/utils/vectorBinary.ts\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>\n\n---------\n\nCo-authored-by: Copilot <175728472+Copilot@users.noreply.github.com>",
          "timestamp": "2025-12-02T22:54:44+03:00",
          "tree_id": "f1b3e383b746769bdc61bc6f4ea285d9dbf42acb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e28db4d5c68bd889b80df539543e7af16058fae9"
        },
        "date": 1764705768927,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 133.43447041791458,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706393916,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 129.44434989465546,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "63237e22275bab9fa780f8f8b075e352188bb0b3",
          "message": "fix: enhance logs",
          "timestamp": "2025-12-02T23:05:07+03:00",
          "tree_id": "087c8cc9ad66245b0130de8edd3bb9cb7af6b412",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/63237e22275bab9fa780f8f8b075e352188bb0b3"
        },
        "date": 1764706399175,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 112.0856002655837,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707648627,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 127.03258172289347,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "5736d259bffe4533808880c7cada2f0f96a2c574",
          "message": "fix: better charts",
          "timestamp": "2025-12-02T23:26:01+03:00",
          "tree_id": "e67732e72d81ee25dbea31632572ebdb3540eb54",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/5736d259bffe4533808880c7cada2f0f96a2c574"
        },
        "date": 1764707655838,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 106.65530551888554,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708973628,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 127.10523120094312,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "018e269410cca0edb5e92776597d67a132c8bfc3",
          "message": "fix: grid",
          "timestamp": "2025-12-02T23:48:10+03:00",
          "tree_id": "d98b2afca24ab2d7866da044c814a88eb630dcab",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/018e269410cca0edb5e92776597d67a132c8bfc3"
        },
        "date": 1764708975434,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 116.67715946231729,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710167068,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 113.82357934001415,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "aa67f23b2d941ae15679167c2db020424a64d7c8",
          "message": "fix: grid",
          "timestamp": "2025-12-03T00:08:02+03:00",
          "tree_id": "6c7bef8f51a0007286592edcfcc1d9b16c9c9a1d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/aa67f23b2d941ae15679167c2db020424a64d7c8"
        },
        "date": 1764710175770,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 127.89590881544932,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710792924,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 131.23251278607316,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "d21d16d6380fdccc5f2d3f202491b5431470ba01",
          "message": "fix: smaller charts",
          "timestamp": "2025-12-03T00:18:27+03:00",
          "tree_id": "7215e9a6e6e7ef5b7e59af8b4d0726c225830d6a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d21d16d6380fdccc5f2d3f202491b5431470ba01"
        },
        "date": 1764710791993,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 118.57682218629782,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744611190,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 126.08010078333628,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "046918324e440e607580a3eb5e33b80825a98eb5",
          "message": "chore(main): release 4.7.0 (#114)",
          "timestamp": "2025-12-03T09:42:12+03:00",
          "tree_id": "dc70c6818dc056baa7964a4b9a54280bcead3c12",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/046918324e440e607580a3eb5e33b80825a98eb5"
        },
        "date": 1764744615282,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 112.13018801259696,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "committer": {
            "email": "astandrik@yandex-team.ru",
            "name": "Anton Standrik",
            "username": "astandrik"
          },
          "distinct": true,
          "id": "51cd975fc53abcd5e529dc23bd13ae120d4c932b",
          "message": "fix: build for linux amd64",
          "timestamp": "2025-12-03T10:53:54+03:00",
          "tree_id": "9af7dc8ec763d540f2ff103fda20bb2c0f579eec",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/51cd975fc53abcd5e529dc23bd13ae120d4c932b"
        },
        "date": 1764748914008,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 118.4239755323485,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749046035,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 119.40432165011931,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b",
          "message": "chore(main): release 4.7.1 (#119)",
          "timestamp": "2025-12-03T10:56:13+03:00",
          "tree_id": "b08ab976d43a978c4d222d6e8785f71ee1d787cf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b5e28d2ed78e18bce76ad3420ddcb079cdf11e0b"
        },
        "date": 1764749050892,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 126.57662383423444,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796040855,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 147.77067041469962,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      },
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
          "id": "017686fa4106bc6ca695aab47cba05e86e2f255c",
          "message": "fix: refresh sessions (#123)\n\n* fix: refresh sessions\n\n* fix: tests",
          "timestamp": "2025-12-03T23:59:32+03:00",
          "tree_id": "9ee1c1f35abdcd6866766f36bbb3de5ddcc98911",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/017686fa4106bc6ca695aab47cba05e86e2f255c"
        },
        "date": 1764796065925,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 136.2763339818681,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": 600,
            "unit": "VUs"
          }
        ]
      }
    ]
  }
}