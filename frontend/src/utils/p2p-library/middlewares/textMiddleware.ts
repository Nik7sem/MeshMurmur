import {Middleware} from "@/utils/p2p-library/abstract.ts";
import {completeTextType, parsedMessageDataType} from "@/utils/p2p-library/types.ts";
import {isObjectMessage} from "@/utils/p2p-library/isObjectHelper.ts";

export class TextMiddleware extends Middleware {
  public onText?: (data: completeTextType) => void

  call(data: parsedMessageDataType) {
    if (!isObjectMessage(data)) return true
    if (data.type === "text") {
      this.onText?.({peerId: this.conn.targetPeerId, data: data.data})
      return false
    }
    return true
  }
}