import pino from "pino";
import { LOG_LEVEL } from "../config/env.js";
import { createDeployLogFormatter } from "./DeployLogFormatter.js";
import { getRequestContextLogFields } from "./requestContext.js";

const deployFormatter = createDeployLogFormatter();
deployFormatter.pipe(process.stdout);

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
