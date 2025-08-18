import {logType} from "@/utils/p2p-library/types.ts";
import {formatConsoleLog} from "@/utils/formatConsoleLog.ts";

export abstract class Logger {
  abstract success(...args: any[]): void

  abstract info(...args: any[]): void

  abstract warn(...args: any[]): void

  abstract error(...args: any[]): void

  abstract createChild(prefix: string): ChildLogger
}

export class MainLogger extends Logger {
  public logs: logType[] = [];
  private onLog?: (log: logType) => void

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

  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

export class ChildLogger implements Logger {
  constructor(private parent: Logger, private prefix: string) {
  }

  private formatWithPrefix(...args: any[]): any[] {
    // Add prefix to the first argument if it's a string
    if (args.length > 0 && typeof args[0] === 'string') {
      return [`[${this.prefix}] ${args[0]}`, ...args.slice(1)];
    }
    // Otherwise add the prefix as a separate element
    return [`[${this.prefix}]`, ...args];
  }

  success(...args: any[]) {
    this.parent.success(...this.formatWithPrefix(...args));
  }

  info(...args: any[]) {
    this.parent.info(...this.formatWithPrefix(...args));
  }

  warn(...args: any[]) {
    this.parent.warn(...this.formatWithPrefix(...args));
  }

  error(...args: any[]) {
    this.parent.error(...this.formatWithPrefix(...args));
  }

  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}