import {
  parsedMessageDataType,
  objectMessageDataType,
  completeMessageType,
  completeTextType
} from "@/utils/p2p-library/types.ts";

export function isObjectMessage(data: parsedMessageDataType): data is objectMessageDataType {
  return typeof data === "object" && "type" in data && "data" in data;
}

export function isCompleteText(data: completeMessageType): data is completeTextType {
  return typeof data.data === "string"
}

export function isCompleteFile(data: completeMessageType): data is completeTextType {
  return typeof data.data === "object" && "url" in data.data
}