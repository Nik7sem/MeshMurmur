import {messageDataType, objectMessageDataType} from "@/utils/p2p-library/types.ts";

export function isObjectMessage(data: messageDataType): data is objectMessageDataType {
  return typeof data === "object" && "type" in data && "data" in data;
}