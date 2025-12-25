window.BENCHMARK_DATA = {
  "lastUpdate": 1766698786730,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094573760,
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
            "value": 21,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094574781,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 54,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 27,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095540854,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 28,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095542994,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 91,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 19,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097511299,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 45,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097522561,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 70,
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
            "value": 0.0278,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765109996640,
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
            "value": 27.5,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110008550,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 69,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 22,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0186,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112176736,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 68,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112178490,
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
            "value": 27,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765140953585,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 43,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765140954026,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 68,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223451453,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223461526,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 69,
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
            "value": 0.0093,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227568546,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 76,
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
            "value": 0.0094,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227581176,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 46,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228592389,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 69,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228593937,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 44,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 26,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765229835549,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 72,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 22,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0185,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765229841191,
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
            "value": 27,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233431368,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 43.099999999999454,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233440531,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 79,
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
            "value": 0.0095,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271139585,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 46,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271144989,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 71,
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
            "value": 0.0094,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273618879,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 93.19999999999982,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 29.65000000000009,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0295,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273621127,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 52,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 28,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375613197,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 44,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 24.449999999999818,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375622859,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 76,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765379900632,
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
            "value": 28,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765379902473,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 71,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 26,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0094,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380457118,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 74,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380459686,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812327841,
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
            "value": 27,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812329743,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 69,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766493880826,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 45,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766493892452,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 71,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 26,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494215468,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 71,
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
            "value": 0.0093,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494218170,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 42,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766497953981,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 46,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766497958220,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 66,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498185239,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 41,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498184990,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 69,
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
            "value": 0.0093,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766510751937,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 75,
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
            "value": 0.0095,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766510763136,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 43,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766524809100,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 48,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 26,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766524815151,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 64,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 22,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0092,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526100323,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 51,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 27,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526109280,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 62,
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
            "value": 0.0092,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585523036,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 42,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585524005,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 66,
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
            "value": 0.0093,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766585844427,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 48,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 26,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766585847516,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 73,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766605979469,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 42,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766605983800,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 68,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611032196,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 65,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 22,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611032828,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 48,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766693915824,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766693916828,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 62,
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
            "value": 0.009,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698010427,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 48,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 22,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698010035,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 65,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 17,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0091,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698534568,
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
            "value": 21,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698536402,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Soak: Search Latency p95",
            "value": 60,
            "unit": "ms"
          },
          {
            "name": "Soak: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Soak: Upsert Latency p95",
            "value": 15,
            "unit": "ms"
          },
          {
            "name": "Soak: Error Rate",
            "value": 0.0089,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094575690,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 63.70701423998212,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094576774,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.31564625306878,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095542774,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 68.66038364981053,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095544542,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 64.71381423558019,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097513254,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.9865242269979,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097525055,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.2902823173154,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765109997872,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.47225626721519,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110010526,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.33998291696767,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112177879,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.51218751336381,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112179722,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.0850153037944,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765140954696,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.34376318463995,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765140955523,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.93824937078776,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223453400,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.90593069553441,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223464282,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.21459095016513,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227569700,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.26386014077558,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227582391,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.22359830241035,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228593564,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.03304951089441,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228596128,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.76558616013122,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765229838173,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.60018937025346,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765229843197,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.63777217166897,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233432777,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.83513782486912,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233442451,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 64.66848787764548,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271140743,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.35390963970988,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271146258,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.57291862472452,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273620711,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 62.49783244449215,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273622646,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.37177326867423,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375614976,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.8439308108673,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375625124,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.20335490970092,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765379902062,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.2594775906378,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765379905450,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.22389223365947,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380458522,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.55819829456301,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380461307,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.05592070250955,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812329438,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.13148152944942,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812331816,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.7093737468349,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766493882369,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.97379160313793,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766493894578,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.62313284058354,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494217395,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.21899959470805,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494220418,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.96902144191924,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766497955605,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.38355504857162,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766497960846,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.76451108624848,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498186685,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.60336072994237,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498189861,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.90439746254171,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766510754176,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 65.05614162130446,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766510765387,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.64018947395292,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766524811368,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.34756974473322,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766524818029,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 67.26875894115429,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526101725,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.08278309988431,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526111449,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 67.0089526842356,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585525239,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.788435762715,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585526197,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.17871230883449,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766585845756,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.07525683728537,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766585849596,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.47078161381397,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766605981073,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.69020671619938,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766605986001,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 66.10831536480032,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611034393,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 67.19781161043036,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611035946,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.32934240914251,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766693916970,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 70.44558265078038,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766693918998,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 68.1819217407925,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698011816,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.23888893376113,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698014260,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 68.1464802484194,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698535870,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 71.65164724578787,
            "unit": "ops/s"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698538177,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Soak: Throughput",
            "value": 69.11459108394835,
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
        "date": 1764948004029,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 135.0329329702651,
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
        "date": 1764948003332,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5656,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7928,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4581,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094814627,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5795,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8348,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4712,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094818313,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3938,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10024,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3182.7999999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.5813,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095785023,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4056,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10018,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3283,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.5337,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095791609,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5464,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8887,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4423.4,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097755888,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3509.6499999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10061,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3379.75,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.3325,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097758607,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4500,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7968,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3835,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0288,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110238806,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3476,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10050,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3329,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.9379,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110250188,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4612,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7222,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3893.15,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0144,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112418994,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3584,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10022,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3441.649999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.4312,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112422953,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4505,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8497,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3918.5,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.022,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765141199836,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4623,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7089,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4070.35,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0433,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765141202776,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3423,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10028,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3245,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.3215,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223695431,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3442,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10078,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3298.45,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.8046,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223704517,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4688,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5458,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3959,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0293,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227819091,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3522,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10029,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3394,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.4072,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227825353,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4407,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6577,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3934.95,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.007,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228833402,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4389,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7497,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3958.95,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0492,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228838217,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3343,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10078,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3202,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.7707,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765230080061,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3368,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10142,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3200.0999999999995,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.1688,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765230083572,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4570,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8712,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4105.049999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0373,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233677757,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4439,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6505,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3938.85,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233686050,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3290,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10114,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3127,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.3066,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271376615,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3361,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10053,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3201,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.5387,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271395435,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4529,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7274,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3871,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0291,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273870188,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3522,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10037,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3265,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.4766,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273879533,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4550,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6440,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4213.25,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0505,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375869805,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3442,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10031,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3343.95,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.7929,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375871011,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4780,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6179,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4315.5,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0295,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765380146817,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3521,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10033,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3349,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.6441,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765380152340,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4466.9,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7679,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3899.8999999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0353,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380698927,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3888.449999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10085,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3877.5999999999985,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.4934,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380706216,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4825,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8043,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4446.399999999998,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0375,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812575214,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3675,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 9618,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3563,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812577900,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4669.6,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6948,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4068.2499999999986,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0444,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766494124110,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3537,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10064,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3243.0499999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.0524,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766494126372,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4430,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6501,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3996.95,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0213,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494462305,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3718,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10042,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3469.7999999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0303,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494462874,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4746.75,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6070,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4372,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0801,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766498196373,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3498.8499999999985,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7884,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3338,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0061,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766498227577,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4807,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6089,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4328.25,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0456,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498426182,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4474.1,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6424,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4050,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0567,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498428655,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3495,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10009,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3354.1499999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.1014,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766511001239,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3563.7999999999993,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 9939,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3452.7999999999993,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766511026740,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 5926,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10052,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 6116.700000000001,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.364,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766525056343,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3721,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10051,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3545,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.2299,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766525079478,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4592,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5814,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4210,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0805,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526341913,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4517,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8003,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4096,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0427,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526351999,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3574,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10023,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3584.2999999999975,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.0145,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585767397,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3523.0499999999993,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10039,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3377.3999999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.2124,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585779341,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4523.949999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 8057,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3987.7,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0288,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766586086733,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3573.3999999999996,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10089,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3436.75,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 1.081,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766586097055,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4552,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5603,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4145.549999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0427,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766606223798,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3699.199999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10076,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3412.5999999999985,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.9794,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766606232200,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4590.799999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 7195,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4144.3,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0511,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611276891,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3693.449999999999,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 9030,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3441.5999999999995,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611280525,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4627.5,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6342,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 4128,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0499,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766694167281,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3603.8499999999985,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 10018,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3281.0499999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.281,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766694171021,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4389,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6278,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3787,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0284,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698238214,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3372,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4396,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3066,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698244533,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4190,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 5736,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3577,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0069,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698781875,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 4372,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 6053,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3946.7999999999993,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0278,
            "unit": "%"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698783371,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "Stress: Search Latency p95",
            "value": 3288,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency p99",
            "value": 0,
            "unit": "ms"
          },
          {
            "name": "Stress: Search Latency max",
            "value": 4810,
            "unit": "ms"
          },
          {
            "name": "Stress: Upsert Latency p95",
            "value": 3131.5499999999997,
            "unit": "ms"
          },
          {
            "name": "Stress: Error Rate",
            "value": 0.0216,
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
        "date": 1764948005740,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 153.11355515416815,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094815869,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 153.77079741451044,
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
          "id": "d7bcd03f6bc0782f61cc06b49950584325793116",
          "message": "feat!:  leave only one-table mode (#135)\n\n* feat!:  leave only one-table mode\n\n* fix: fix typecheck\n\n* fix: docs\n\n* fix: docs\n\n* fix: remove legacy\n\n* fix: add startup probe",
          "timestamp": "2025-12-07T10:59:01+03:00",
          "tree_id": "e19c12bf009aad531ceaae394ffa5aaf606c730b",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d7bcd03f6bc0782f61cc06b49950584325793116"
        },
        "date": 1765094820178,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 202.35182852578697,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095786935,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 194.80805208250274,
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
          "id": "e188b4725676eb3c82d786159cfbfa6ae1dfb37a",
          "message": "chore(main): release 5.0.0 (#136)",
          "timestamp": "2025-12-07T11:15:14+03:00",
          "tree_id": "a420d830f8e66222e0ebe8ec5da25bab8625550e",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e188b4725676eb3c82d786159cfbfa6ae1dfb37a"
        },
        "date": 1765095792783,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 157.61250266245054,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097757634,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.09754664755062,
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
          "id": "a568d7fc57f3e749715e5e115947a16ba659f5c8",
          "message": "feat: autopartition table (#137)",
          "timestamp": "2025-12-07T11:48:05+03:00",
          "tree_id": "d32a65fe96a355bae15623039b9caa9bb735d382",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/a568d7fc57f3e749715e5e115947a16ba659f5c8"
        },
        "date": 1765097760344,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 168.00229066822382,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110240576,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 208.47430489238835,
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
          "id": "db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed",
          "message": "feat: health check make probe (#140)\n\n* feat: health check make probe\n\n* fix: review\n\n* fix: review",
          "timestamp": "2025-12-07T15:16:12+03:00",
          "tree_id": "18e808c75ab35820ee23c19bd19e237d516eedcc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/db66fcbb495bcc91ccc75cc2f7e526b282a5a6ed"
        },
        "date": 1765110251740,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 167.92630293794284,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112420695,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 203.97195069143473,
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
          "id": "e161aad9e9a5681f9837766733f657d97c5f8ffe",
          "message": "chore(main): release 5.1.0 (#139)",
          "timestamp": "2025-12-07T15:52:31+03:00",
          "tree_id": "de74675e5cd561abb65d7194934b156a4daf3dc9",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e161aad9e9a5681f9837766733f657d97c5f8ffe"
        },
        "date": 1765112425472,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 165.07107953462523,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765141201832,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 166.65593867718118,
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
          "id": "14aa13b6d916ed9650cc197c3d565623c8f68f6e",
          "message": "fix: add startup to env (#141)",
          "timestamp": "2025-12-07T23:52:08+03:00",
          "tree_id": "64eedec3165b66f0150503b6230253192c445b87",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/14aa13b6d916ed9650cc197c3d565623c8f68f6e"
        },
        "date": 1765141204388,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.79306488505284,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223697318,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.7107531683771,
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
          "id": "b9b4ec743e7ac86d0cde25304212ca3f726ad6bc",
          "message": "feat: add repo link (#143)",
          "timestamp": "2025-12-08T22:47:05+03:00",
          "tree_id": "bb1cbc61c2013f0d0c1517fd1c098588bc100770",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/b9b4ec743e7ac86d0cde25304212ca3f726ad6bc"
        },
        "date": 1765223706529,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 164.3069790730655,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227821720,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 206.81639919295884,
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
          "id": "2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5",
          "message": "feat: introduce batch delete (#145)\n\n* feat: introduce batch delete\n\n* fix: review",
          "timestamp": "2025-12-08T23:55:48+03:00",
          "tree_id": "7604f713c1881dfad8e2b2b583d76cf34bda382f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/2ddf3e55f3805d077b62bfd642d8e1e4cc181fd5"
        },
        "date": 1765227827595,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 172.1475218001772,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228835116,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 171.79297216961027,
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
          "id": "00acf8478bc64065b0cf24e2f4db0be5eed271d9",
          "message": "chore: add copilot custom instructions (#148)",
          "timestamp": "2025-12-09T00:12:46+03:00",
          "tree_id": "ef809555e52fd4c287be6619deda3172b12fbce5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/00acf8478bc64065b0cf24e2f4db0be5eed271d9"
        },
        "date": 1765228839944,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 212.64763305001534,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765230081964,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 212.33948959658244,
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
          "id": "e79aefe87adca0a5ce125a18e0e5747d36cfd73d",
          "message": "feat: log transient errors (#149)",
          "timestamp": "2025-12-09T00:33:26+03:00",
          "tree_id": "b61f124da4c45f72311f5e272c72ea2eca14f85f",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e79aefe87adca0a5ce125a18e0e5747d36cfd73d"
        },
        "date": 1765230084943,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 161.52830240953705,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233679277,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 172.54883507839872,
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
          "id": "8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4",
          "message": "chore(main): release 5.2.0 (#142)",
          "timestamp": "2025-12-09T01:33:29+03:00",
          "tree_id": "bce6e17c86a1a3164fa7cd85d89dee86f02fd274",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/8fa9715cd06cdf7f83956d07b7d5c7b8aca8b9c4"
        },
        "date": 1765233689418,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 211.79051691766534,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271378284,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 208.91086768068314,
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
          "id": "898833e46c2082ed4408f2d63381c45ebd726ebd",
          "message": "fix: batch delete to false tmp (#150)",
          "timestamp": "2025-12-09T12:01:53+03:00",
          "tree_id": "44004926aa9572c5fa547991f0655d40853c7969",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/898833e46c2082ed4408f2d63381c45ebd726ebd"
        },
        "date": 1765271396884,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 165.80021599909585,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273872343,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 202.43464068961023,
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
          "id": "f90277993843efc4120e095d2f506bf82556dd0b",
          "message": "chore(main): release 5.2.1 (#151)",
          "timestamp": "2025-12-09T12:43:17+03:00",
          "tree_id": "97f06a1e853635dc22a8b847163c1db31643f23a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f90277993843efc4120e095d2f506bf82556dd0b"
        },
        "date": 1765273882208,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 166.89232349891597,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375872724,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 208.96926423885034,
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
          "id": "bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d",
          "message": "feat: write agent hash as is (#154)\n\n* feat: write agent hash as is\n\n* fix: review fixes\n\n* fix: review\n\n* fix: review fix",
          "timestamp": "2025-12-10T17:03:09+03:00",
          "tree_id": "9e8af99f1faff12b2947287823fe9702c06464d6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/bbcc332c4d6723afb64d58c4f1f1af4b78e78a6d"
        },
        "date": 1765375873331,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 163.02634660028968,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765380148579,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 208.49925120273758,
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
          "id": "cd73c1e8c5de2313353bf146ffd5d2dc1c0da380",
          "message": "feat!: add collection last access timing (#157)\n\n* feat!: add collection last access timing\n\n* fix: review fixes",
          "timestamp": "2025-12-10T18:14:32+03:00",
          "tree_id": "e84daddb2bbee6f53c09651e1f7fc8d221d299cc",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/cd73c1e8c5de2313353bf146ffd5d2dc1c0da380"
        },
        "date": 1765380153539,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 170.92055656302344,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380701302,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 202.46004870060128,
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
          "id": "083a70a4f1de6487622414cc6466157f1e7ea1c9",
          "message": "chore(main): release 6.0.0 (#156)",
          "timestamp": "2025-12-10T18:23:44+03:00",
          "tree_id": "78ed54bfc95d8ecf2cccb23e51eee4b5782a8d28",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/083a70a4f1de6487622414cc6466157f1e7ea1c9"
        },
        "date": 1765380708454,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 160.28601038286598,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812577357,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 202.25699805199054,
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
          "id": "0d8566020e54981f9ea31c0a88fcbbedfa5fb82a",
          "message": "fix: regenerate diagrams (#158)",
          "timestamp": "2025-12-15T18:21:45+03:00",
          "tree_id": "03d50fbf27a1f3bd488f702800f27c49fe51a6c4",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0d8566020e54981f9ea31c0a88fcbbedfa5fb82a"
        },
        "date": 1765812580240,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 162.8510140061511,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766494126038,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 201.01533859642242,
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
          "id": "d4c510812bc052247f91c1aaedbfb24f69128862",
          "message": "fix: dont recreate collection (#160)\n\n* fix: dont recreate collection\n\n* fix: review",
          "timestamp": "2025-12-23T15:40:58+03:00",
          "tree_id": "a017d1205ae1134b6a6d653a0c0c18d9b2fd6846",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d4c510812bc052247f91c1aaedbfb24f69128862"
        },
        "date": 1766494127793,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 169.95313409471555,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494464948,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 201.75048722910168,
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
          "id": "1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f",
          "message": "chore(main): release 6.0.1 (#159)",
          "timestamp": "2025-12-23T15:46:33+03:00",
          "tree_id": "4715ae998b07a877030a9cb5b7a31cc08356baa6",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/1cd25254cf79bc9d0e0aa7f02adfa7bdda98fd7f"
        },
        "date": 1766494466347,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 165.62275384028075,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766498197865,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 200.3109785080356,
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
          "id": "0983cd0fa6a242f676552c707ef07df25b806f64",
          "message": "fix: token (#161)",
          "timestamp": "2025-12-23T16:48:51+03:00",
          "tree_id": "fcd48c7d555cd1b9478b1f007b97f0587522a99c",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/0983cd0fa6a242f676552c707ef07df25b806f64"
        },
        "date": 1766498229735,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 157.5572326931361,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498427864,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 170.17428949791216,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7c3268eb49ce6809f9058a890fa09af06e559c97",
          "message": "chore(main): release 6.0.2 (#162)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-23T16:52:37+03:00",
          "tree_id": "77520611ac59782985b605809e4e03f6f53ab34d",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/7c3268eb49ce6809f9058a890fa09af06e559c97"
        },
        "date": 1766498431644,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.7027283181541,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766511003453,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.54375119832912,
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
          "id": "ec926a1457b97b14e8e978e984f5ee6f1caf6320",
          "message": "fix: delete by filter (#163)\n\n* fix: delete by filter\n\n* fix: build\n\n* fix: declare",
          "timestamp": "2025-12-23T20:22:09+03:00",
          "tree_id": "71f7b8a94ee7b2cb798ae8b93c3433cff5247cdf",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/ec926a1457b97b14e8e978e984f5ee6f1caf6320"
        },
        "date": 1766511028534,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 134.08612513780213,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766525057585,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 207.26706637137056,
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
          "id": "f4602bce407aa503613e1ab5f41cf3b7e0a51d9a",
          "message": "feat: search and delete with filters (#165)\n\n* feat: search and delete with filters\n\n* fix: tests",
          "timestamp": "2025-12-24T00:16:30+03:00",
          "tree_id": "d98fe0f3488ce6a3ef0c353bb5848948c7f6fc09",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f4602bce407aa503613e1ab5f41cf3b7e0a51d9a"
        },
        "date": 1766525081573,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 164.68895920057886,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526343328,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 169.6555896655627,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e99ccf9bcb38d4e03c62b481f3b6f986743b87e0",
          "message": "chore(main): release 6.1.0 (#164)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T00:37:55+03:00",
          "tree_id": "d1880b55307736aa1b9d8b7462bcfde2c8a01813",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/e99ccf9bcb38d4e03c62b481f3b6f986743b87e0"
        },
        "date": 1766526353552,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 203.42007439907323,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585768948,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 207.26542300343235,
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
          "id": "f04fdf8078d8c68d470e2fb5afd0ce360ea60237",
          "message": "fix: retry delete (#166)",
          "timestamp": "2025-12-24T17:08:21+03:00",
          "tree_id": "1226f00d2726f8c66bd2d34d911a038b9003d162",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/f04fdf8078d8c68d470e2fb5afd0ce360ea60237"
        },
        "date": 1766585781459,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 167.3955010799852,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766586089389,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 208.2161461183683,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "617ba82f84c34ec5b2628a8062dc563fa63e7ea0",
          "message": "chore(main): release 6.1.1 (#167)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-24T17:13:39+03:00",
          "tree_id": "b65afd5add3e313d99dcc359b941f7e30abff50a",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/617ba82f84c34ec5b2628a8062dc563fa63e7ea0"
        },
        "date": 1766586099198,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 169.07668278625374,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766606226561,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 203.4244755151897,
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
          "id": "43a30d2bde280085ddaaa5fe11add7f6229fe4c1",
          "message": "fix: root route (#168)\n\n* fix: root route\n\n* fix: other errors",
          "timestamp": "2025-12-24T22:49:18+03:00",
          "tree_id": "71ab2dedac8c9cfd93a37531d5e69a36a25264b5",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43a30d2bde280085ddaaa5fe11add7f6229fe4c1"
        },
        "date": 1766606234304,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 165.1412386419932,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611279008,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 206.2165953777289,
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
          "id": "dd7d57810115af04eda1ca5ad68bca632347ba8c",
          "message": "fix: small optimizations (#170)",
          "timestamp": "2025-12-25T00:13:27+03:00",
          "tree_id": "6a94806c54df4c76fc8649b1d4e83c8fa769db67",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/dd7d57810115af04eda1ca5ad68bca632347ba8c"
        },
        "date": 1766611282682,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 169.2562093265484,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766694169287,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 204.47455385523025,
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
          "id": "d9fea8777648915a15b264aa637dd8991f21283a",
          "message": "chore: refactor pointsRepo (#172)\n\n* chore: refactor pointsRepo\n\n* fix: extra empty line",
          "timestamp": "2025-12-25T23:14:55+03:00",
          "tree_id": "1aa6d51ae2b4b8a04df35ee039cdd1b4308e4deb",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/d9fea8777648915a15b264aa637dd8991f21283a"
        },
        "date": 1766694172342,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 169.96827631381038,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698239488,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 222.01779880488456,
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
          "id": "43f8a61fae659cb640c7943f4c13fb05d47903e5",
          "message": "fix: always use client serialization (#173)\n\n* fix: always use client serialization\n\n* fix: vectorToBit\n\n* fix: remove unused",
          "timestamp": "2025-12-26T00:23:01+03:00",
          "tree_id": "93f8f29b100ec8f2d16f2e58156276ce43639658",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/43f8a61fae659cb640c7943f4c13fb05d47903e5"
        },
        "date": 1766698246011,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 177.4512205009505,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698783516,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 176.07429400730268,
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
            "email": "41898282+github-actions[bot]@users.noreply.github.com",
            "name": "github-actions[bot]",
            "username": "github-actions[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "804f1d089cfda368ff64cf57143cc4327cc877f3",
          "message": "chore(main): release 6.1.2 (#169)\n\nCo-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>",
          "timestamp": "2025-12-26T00:31:54+03:00",
          "tree_id": "3288bb8d7e393b341cb8cfe02140b002b68ebc59",
          "url": "https://github.com/astandrik/ydb-qdrant/commit/804f1d089cfda368ff64cf57143cc4327cc877f3"
        },
        "date": 1766698786135,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Stress: Throughput",
            "value": 229.36772567853598,
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