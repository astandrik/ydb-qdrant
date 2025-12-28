import { Router, Request, Response } from "express";
import type { Schemas } from "@qdrant/js-client-rest";
import {
  putCollectionIndex,
  createCollection,
  getCollection,
  deleteCollection,
} from "../services/CollectionService.js";
import { QdrantServiceError } from "../services/errors.js";
import { logger } from "../logging/logger.js";

export const collectionsRouter = Router();

type QdrantCollectionInfo = Schemas["CollectionInfo"];
type QdrantCollectionConfig = Schemas["CollectionConfig"];
type QdrantHnswConfig = Schemas["HnswConfig"];
type QdrantOptimizersConfig = Schemas["OptimizersConfig"];

// Placeholder defaults to satisfy Qdrant `CollectionInfo` shape. These values are
// not used for execution in ydb-qdrant, only for client compatibility.
const DEFAULT_HNSW_CONFIG: QdrantHnswConfig = {
  m: 16,
  ef_construct: 100,
  full_scan_threshold: 10000,
  max_indexing_threads: 0,
  on_disk: false,
};

const DEFAULT_OPTIMIZERS_CONFIG: QdrantOptimizersConfig = {
  deleted_threshold: 0.2,
  vacuum_min_vector_number: 1000,
  default_segment_number: 0,
  indexing_threshold: 10000,
  flush_interval_sec: 5,
};

function mapVectorDatatype(dataType: string | undefined): Schemas["Datatype"] {
  // Our service exposes `float`; Qdrant uses `float32`/`float16`/`uint8`.
  if (dataType === "float16") return "float16";
  if (dataType === "uint8") return "uint8";
  return "float32";
}

function toQdrantCollectionInfo(result: Awaited<ReturnType<typeof getCollection>>): QdrantCollectionInfo {
  const vectors = result.vectors;
  const datatype = mapVectorDatatype(vectors?.data_type);

  const config: QdrantCollectionConfig = {
    params: {
      vectors: {
        size: vectors.size,
        distance: vectors.distance,
        datatype,
        on_disk: false,
      },
      shard_number: 1,
      replication_factor: 1,
      write_consistency_factor: 1,
      on_disk_payload: false,
    },
    hnsw_config: DEFAULT_HNSW_CONFIG,
    optimizer_config: DEFAULT_OPTIMIZERS_CONFIG,
  };

  return {
    status: "green",
    optimizer_status: "ok",
    segments_count: 1,
    config,
    payload_schema: {},
  };
}

collectionsRouter.put(
  "/:collection/index",
  async (req: Request, res: Response) => {
    try {
      await putCollectionIndex({
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
        userAgent: req.header("User-Agent") ?? undefined,
      });
      // Qdrant compatibility: index operations return boolean `result`.
      res.json({ status: "ok", result: true });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "build index failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);

collectionsRouter.put("/:collection", async (req: Request, res: Response) => {
  try {
    await createCollection(
      {
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
        userAgent: req.header("User-Agent") ?? undefined,
      },
      req.body
    );
    // Qdrant compatibility: create collection returns boolean `result`.
    res.json({ status: "ok", result: true });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    logger.error({ err }, "create collection failed");
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", error: errorMessage });
  }
});

collectionsRouter.get("/:collection", async (req: Request, res: Response) => {
  try {
    const result = await getCollection({
      tenant: req.header("X-Tenant-Id") ?? undefined,
      collection: String(req.params.collection),
      apiKey: req.header("api-key") ?? undefined,
      userAgent: req.header("User-Agent") ?? undefined,
    });
    res.json({ status: "ok", result: toQdrantCollectionInfo(result) });
  } catch (err: unknown) {
    if (err instanceof QdrantServiceError) {
      return res.status(err.statusCode).json(err.payload);
    }
    logger.error({ err }, "get collection failed");
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "error", error: errorMessage });
  }
});

collectionsRouter.delete(
  "/:collection",
  async (req: Request, res: Response) => {
    try {
      await deleteCollection({
        tenant: req.header("X-Tenant-Id") ?? undefined,
        collection: String(req.params.collection),
        apiKey: req.header("api-key") ?? undefined,
        userAgent: req.header("User-Agent") ?? undefined,
      });
      // Qdrant compatibility: delete collection returns boolean `result`.
      res.json({ status: "ok", result: true });
    } catch (err: unknown) {
      if (err instanceof QdrantServiceError) {
        return res.status(err.statusCode).json(err.payload);
      }
      logger.error({ err }, "delete collection failed");
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", error: errorMessage });
    }
  }
);
