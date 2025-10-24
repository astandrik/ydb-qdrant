import pino from "pino";
import { LOG_LEVEL } from "../config/env.js";

// Async, buffered logging to avoid blocking the event loop
const destination = pino.destination({ minLength: 4096, sync: false });
export const logger = pino({ level: LOG_LEVEL }, destination);
