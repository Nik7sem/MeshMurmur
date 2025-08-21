import {signalerNameType} from "@/utils/p2p-library/types.ts";

export type UserData = {
  autoconnect: boolean
  signaler: signalerNameType
  nickname: string
  associatedNicknames: { [key: string]: string }
}