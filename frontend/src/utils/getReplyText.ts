import {completeMessageType} from "@/utils/p2p-library/types.ts";
import {isChatMemberBadge, isCompleteFile, isCompleteText} from "@/utils/p2p-library/helpers.ts";

export function getReplyText(data: completeMessageType) {
  if (isCompleteText(data)) {
    return data.data.slice(0, 100)
  } else if (isCompleteFile(data)) {
    return `File: ${data.data.fileName}`
  } else if (isChatMemberBadge(data)) {
    return `${data.nickname} ${data.status} chat`
  }
}