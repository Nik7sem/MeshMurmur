import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {isCompleteFile, isCompleteText} from "@/utils/p2p-library/helpers.ts";

export function getReplyText(data: completeMessageType) {
  if (isCompleteText(data)) {
    return data.data.slice(0, 2000)
  } else if (isCompleteFile(data)) {
    return `File: ${data.data.fileName}`
  }
}