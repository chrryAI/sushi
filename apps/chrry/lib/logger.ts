import { send } from "@axiomhq/pino"
import pino from "pino"

const isDevelopment = process.env.NODE_ENV === "development"

// Create Pino logger with Axiom transport
export const logger = pino(
  {
    level: isDevelopment ? "debug" : "info",
    formatters: {
      level: (label) => {
        return { level: label }
      },
    },
  },
  send({
    dataset: process.env.AXIOM_DATASET || "chrry-flash",
    token: process.env.AXIOM_TOKEN || "",
  }),
)

// Console polyfill for easy migration
export const console = {
  log: (...args: any[]) => logger.info(args.join(" ")),
  info: (...args: any[]) => logger.info(args.join(" ")),
  warn: (...args: any[]) => logger.warn(args.join(" ")),
  error: (...args: any[]) => logger.error(args.join(" ")),
  debug: (...args: any[]) => logger.debug(args.join(" ")),
}

export default logger
