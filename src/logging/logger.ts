import pino from "pino";
import { LOG_LEVEL } from "../config/env.js";
import { createDeployLogFormatter } from "./DeployLogFormatter.js";
import { getRequestContextLogFields } from "./requestContext.js";

const deployFormatter = createDeployLogFormatter();
const logTarget =
    process.env.YDB_QDRANT_LOG_TARGET === "stderr"
        ? process.stderr
        : process.stdout;
deployFormatter.pipe(logTarget);

export const logger = pino(
    {
        level: LOG_LEVEL,
        serializers: {
            err: pino.stdSerializers.err,
        },
        mixin() {
            return getRequestContextLogFields();
        },
    },
    deployFormatter
);
