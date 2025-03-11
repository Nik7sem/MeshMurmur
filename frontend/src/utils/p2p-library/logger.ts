import {logType} from "@/utils/p2p-library/types.ts";
import {formatConsoleLog} from "@/utils/formatConsoleLog.ts";

export class Logger {
  public logs: logType[] = [];
  private onLog?: (log: logType) => void

  constructor() {
  }

  success(...args: any[]) {
    this.logs.push({text: formatConsoleLog(...args), type: "success"})
    this.onLog?.(this.logs[this.logs.length - 1]);
  }

  info(...args: any[]) {
    this.logs.push({text: formatConsoleLog(...args), type: "info"})
    this.onLog?.(this.logs[this.logs.length - 1]);
  }

  warn(...args: any[]) {
    this.logs.push({text: formatConsoleLog(...args), type: "warn"})
    this.onLog?.(this.logs[this.logs.length - 1]);
  }

  error(...args: any[]) {
    this.logs.push({text: formatConsoleLog(...args), type: "error"})
    this.onLog?.(this.logs[this.logs.length - 1]);
  }

  setOnLog(onLog: (log: logType) => void) {
    this.onLog = onLog;
    for (const log of this.logs) {
      this.onLog(log)
    }
  }
}