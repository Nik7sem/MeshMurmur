import {signalerType} from "@/utils/p2p-library/signalers/createSignaler.ts";

export type UserData = {
  autoconnect: boolean
  signaler: signalerType
  nickname: string
  associatedNicknames: { [key: string]: string }
}