import {Connector} from "@/utils/p2p-library/connector.ts";
import {Logger} from "@/utils/p2p-library/logger.ts";

export const peerId = Math.random().toString(36).substr(2, 9)

export const logger = new Logger();
export const connector = new Connector(peerId, logger)

window.onbeforeunload = function () {
  connector.cleanup()
}
window.addEventListener("beforeunload", function (e) {
  connector.cleanup()
});

