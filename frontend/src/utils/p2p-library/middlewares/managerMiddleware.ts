import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {ChannelEventBase, eventDataType} from "@/utils/p2p-library/types.ts";

export class ManagerMiddleware extends Middleware {
  static name = "ManagerMiddleware"
  private middlewares: { [key: string]: { middleware: Middleware, priority: number } } = {};
  private prioritizedList: Middleware[] = []

  add<T extends Middleware>(middlewareClass: new (...args: any[]) => T, priority: number): T {
    const key = middlewareClass.name;
    const instance = new middlewareClass(this.peerId, this.targetPeerId, this.channel, this.logger.createChild(key));
    this.middlewares[key] = {middleware: instance, priority};
    this.updateList()
    return instance;
  }

  get<T extends Middleware>(middlewareClass: new (...args: any[]) => T): T | null {
    return this.middlewares[middlewareClass.name].middleware as T || null;
  }

  async init(eventData: ChannelEventBase) {
    for (const middleware of this.prioritizedList) {
      await middleware.init(eventData);
    }
  }

  async waitForAllInitialized(): Promise<void> {
    const initializationPromises = Array.from(Object.values(this.middlewares))
      .map(mw => mw.middleware.initialization);

    await Promise.all(initializationPromises);
  }

  call(data: eventDataType) {
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