import pino from "pino";
import { LOG_LEVEL } from "../config/env";

export const logger = pino({ level: LOG_LEVEL });
