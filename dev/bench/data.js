window.BENCHMARK_DATA = {
  "lastUpdate": 1764948004189,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872831089,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875624899,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875818967,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942233745,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946208764,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 105,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 24,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947761483,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 112,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 29,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872833134,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.756625263358295,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875626216,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.31299119538714,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875820909,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.42512154064253,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942235104,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.03202536932414,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946210759,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 61.624112109037334,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947763484,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 60.03010822313132,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872828495,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872832922,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 109,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 50.29999999999973,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875628801,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 111,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875629706,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 113.84999999999945,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875833331,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 108,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875857055,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 112,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942225526,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942234804,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 114,
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
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946206284,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 47,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 23,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946216161,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 96,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 20,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947753860,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 49,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 25,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947757467,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 106,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 23,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872829632,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.60510067595958,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764872834030,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 50.94565741429804,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875631836,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.91522768592365,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875630790,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 50.639024640466374,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875834873,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 51.070060066233566,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764875858395,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 53.10889230980271,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942226624,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 49.306696210318,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942236064,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 52.39322996881211,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946207830,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.87726282837201,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946217245,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 63.80786706648699,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947755010,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.24054609630014,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764947759356,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 61.982351587658265,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873077074,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4015,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4225,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2165.2999999999997,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875868417,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4003.2,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4183,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2149.85,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876068715,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3985,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4260,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2142,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942472063,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3971,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4277,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 2136.7,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946466310,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5936,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6208,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3846,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764948002300,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 6386.699999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7343,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4120,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873078234,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 106.99305878701524,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875869700,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 106.6944310591941,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876070721,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 105.40269553750531,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942473937,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 106.89530992257608,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946468058,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 132.43460803676456,
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
        "date": 1764796162962,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4737,
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
            "value": 4319.9,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873078137,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 6191,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6441,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 5135,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873081359,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4376,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4610,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3823,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875871691,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4504.449999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4785,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3890.5499999999997,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875874045,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5705.15,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5937,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4694.3,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876069386,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4391.35,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4772,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3843.2999999999997,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876079184,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 6028,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6267,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4954.549999999999,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942482689,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5876,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6202,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4856.4,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942491791,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4105,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4448,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3662,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946449805,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3791,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10003,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3056,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.018,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946452847,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5443,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5722,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4400,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764948001670,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3826,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10070,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3110,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.8739,
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
        "date": 1764796160290,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 133.42684181017898,
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
          "id": "27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa",
          "message": "chore(main): release 4.7.2 (#124)",
          "timestamp": "2025-12-04T00:01:18+03:00",
          "tree_id": "fa44e5eb596765dfe36c1f2db18e3ec91ef41e0f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/27a814f7a4dd946ac1b5b6f20f5ae37c091e09aa"
        },
        "date": 1764796164272,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 143.6950399013102,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873080360,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 125.69361378681867,
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
          "id": "bd6848e184d9a3adfba47b9080b10b1b51e387f5",
          "message": "feat: make approximate search in one query (#126)\n\n* feat: make approximate search in one query\n\n* fix: join -> in\n\n* fix: use CosineDistance instead of CosineSimilarity\n\n* fix: use CosineSimilarity for bit\n\n* fix: distances",
          "timestamp": "2025-12-04T21:23:25+03:00",
          "tree_id": "fb00d374b78f566df5456f7b941f6216bb56fdfa",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bd6848e184d9a3adfba47b9080b10b1b51e387f5"
        },
        "date": 1764873082710,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 167.1472541547489,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875872791,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 164.0802667478765,
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
          "id": "0667fd7fca8bbdee3fc750c3788a02f51ae4cd66",
          "message": "fix: normalize scores (#128)",
          "timestamp": "2025-12-04T22:09:57+03:00",
          "tree_id": "3bf4a8ea5e4b8023d334fad869d14266a7de3793",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0667fd7fca8bbdee3fc750c3788a02f51ae4cd66"
        },
        "date": 1764875875476,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 138.59879110325426,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876071535,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 162.06964086417452,
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
          "id": "291c09aa733a4e3cd321daad2cf00e055013bee7",
          "message": "chore(main): release 4.8.0 (#127)",
          "timestamp": "2025-12-04T22:13:16+03:00",
          "tree_id": "085a6c3abbc182d6322d07dfc23730e2d2c44865",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/291c09aa733a4e3cd321daad2cf00e055013bee7"
        },
        "date": 1764876081328,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 132.91139394714688,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942483846,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 136.67348234445524,
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
          "id": "fb0a2088cb945fc34805a214d1e21a22a386aae8",
          "message": "fix: large collections delete fix (#129)\n\n* fix: large collections delete fix\n\n* fix: review fixes",
          "timestamp": "2025-12-05T16:40:00+03:00",
          "tree_id": "c65bd9720b19892e7c7d2ebbd465332ba846e117",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/fb0a2088cb945fc34805a214d1e21a22a386aae8"
        },
        "date": 1764942493752,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 173.78781244577522,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946451639,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 202.68297929811774,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
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
          "id": "39d8d1c6231f133692e7b574de54f783f3778ecd",
          "message": "fix: add transient checks, idempotent and cached flags (#131)",
          "timestamp": "2025-12-05T17:46:23+03:00",
          "tree_id": "8355561cf5ffc0ff22a1b43321d6fb0a6182cf66",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/39d8d1c6231f133692e7b574de54f783f3778ecd"
        },
        "date": 1764946453862,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 156.6237750279774,
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
          "id": "abb8721d316b12d582002f928f4fc8adfdf42f9f",
          "message": "chore(main): release 4.8.1 (#130)",
          "timestamp": "2025-12-05T18:12:10+03:00",
          "tree_id": "6842bf10ba4d34093bf5a32e4db62f43629bc493",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/abb8721d316b12d582002f928f4fc8adfdf42f9f"
        },
        "date": 1764948003528,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.83432808719184,
            "unit": "ops/s"
          },
          {
            "name": "Stress: Max VUs",
            "value": 600,
            "unit": "VUs"
          },
          {
            "name": "Stress: Breaking Point VUs",
            "value": -1,
            "unit": "VUs"
          }
        ]
      }
    ]
  }
}