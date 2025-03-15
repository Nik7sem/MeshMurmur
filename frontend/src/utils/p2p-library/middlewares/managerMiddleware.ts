import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";

type priorityType = "high" | "medium" | "low";
const priorities: { [key in priorityType]: number } = {
  "high": 1,
  "medium": 2,
  "low": 3,
}

export class ManagerMiddleware extends Middleware {
  private middlewares: { [key: string]: { middleware: Middleware, priority: priorityType } } = {};
  private prioritizedList: Middleware[] = []

  add<T extends Middleware>(middlewareClass: new (...args: any[]) => T, priority: priorityType): T {
    const key = middlewareClass.name;
    const instance = new middlewareClass(this.send, this.conn, this.logger);
    this.middlewares[key] = {middleware: instance, priority};
    this.updateList()
    return instance;
  }

  get<T extends Middleware>(middlewareClass: new (...args: any[]) => T): T | null {
    return this.middlewares[middlewareClass.name].middleware as T || null;
  }

  init() {
    for (const middleware of this.prioritizedList) {
      middleware.init();
    }
  }

  call(data: messageDataType) {
    for (const middleware of this.prioritizedList) {
      if (!middleware.call(data)) {
        return false
      }
    }
    return true
  }

  isBlocked(): boolean {
    for (const middleware of this.prioritizedList) {
      if (middleware.isBlocked()) {
        return true
      }
    }
    return false
  }

  updateList() {
    this.prioritizedList = Object.values(this.middlewares)
      .sort((lhs, rhs) => priorities[lhs.priority] - priorities[rhs.priority])
      .map((val) => val.middleware);
  }
}