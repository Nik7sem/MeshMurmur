import {logType} from "@/utils/p2p-library/types.ts";
import {formatConsoleLog} from "@/utils/formatConsoleLog.ts";

export class Logger {
  constructor(private readonly onLog: (log: logType) => void) {
  }

  info(...args: any[]) {
    this.onLog({text: formatConsoleLog(...args), type: "info"})
  }

  warn(...args: any[]) {
    this.onLog({text: formatConsoleLog(...args), type: "warn"})
  }

  error(...args: any[]) {
    this.onLog({text: formatConsoleLog(...args), type: "error"})
  }
}