import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {messageDataType} from "@/utils/p2p-library/types.ts";

export class ManagerMiddleware extends Middleware {
  private middlewares: Middleware[] = [];

  add(middleware: typeof Middleware) {
    this.middlewares.push(new middleware(this.send, this.conn, this.logger));
  }

  init() {
    for (const middleware of this.middlewares) {
      middleware.init();
    }
  }

  call(data: messageDataType) {
    for (const middleware of this.middlewares) {
      if (!middleware.call(data)) {
        return false
      }
    }
    return true
  }

  isBlocked(): boolean {
    for (const middleware of this.middlewares) {
      if (middleware.isBlocked()) {
        return true
      }
    }
    return false
  }
}