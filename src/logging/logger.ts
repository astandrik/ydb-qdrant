import pino from "pino";
import { LOG_LEVEL } from "../config/env.js";

export const logger = pino({ level: LOG_LEVEL });
