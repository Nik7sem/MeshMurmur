import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {parsedMessageDataType} from "@/utils/p2p-library/types.ts";

export class ManagerMiddleware extends Middleware {
  private middlewares: { [key: string]: { middleware: Middleware, priority: number } } = {};
  private prioritizedList: Middleware[] = []

  add<T extends Middleware>(middlewareClass: new (...args: any[]) => T, priority: number): T {
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

  call(data: parsedMessageDataType) {
    for (const middleware of this.prioritizedList) {
      if (!middleware.call(data)) {
        return false
      }
    }
    return true
  }

  isBlocked() {
    for (const middleware of this.prioritizedList) {
      if (middleware.isBlocked()) {
        return true
      }
    }
    return false
  }

  updateList() {
    this.prioritizedList = Object.values(this.middlewares)
      .sort((lhs, rhs) => lhs.priority - rhs.priority)
      .map((val) => val.middleware);
  }
}