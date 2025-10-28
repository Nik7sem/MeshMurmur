import {logType} from "@p2p-library/types.ts";
import {formatConsoleLog} from "@p2p-library/formatConsoleLog.ts";
import {getFormattedTime} from "@p2p-library/formatDate.ts";

export abstract class Logger {
  abstract success(...args: any[]): void

  abstract info(...args: any[]): void

  abstract warn(...args: any[]): void

  abstract error(...args: any[]): void

  abstract debug(...args: any[]): void

  abstract createChild(prefix: string): ChildLogger
}

export class MainLogger extends Logger {
  public logs: logType[] = [];
  public onLog?: (log: logType) => void

  success(...args: any[]) {
    this.addLog(args, "success");
  }

  info(...args: any[]) {
    this.addLog(args, "info")
  }

  warn(...args: any[]) {
    this.addLog(args, "warn")
  }

  error(...args: any[]) {
    this.addLog(args, "error")
  }

  debug(...args: any[]) {
    this.addLog(args, "debug")
  }

  addLog(args: any[], type: logType['type']) {
    this.logs.push({text: `[${getFormattedTime()}] ${formatConsoleLog(...args)}`, type})
    this.onLog?.(this.logs[this.logs.length - 1]);
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

  debug(...args: any[]) {
    this.parent.debug(...this.formatWithPrefix(...args));
  }

  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}