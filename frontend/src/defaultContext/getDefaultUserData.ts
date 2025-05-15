import {UserData} from "../types/user.ts";
import {storageManager} from "@/init.ts";

let data: null | UserData = null

export async function getDefaultUserData(): Promise<UserData> {
  if (data) return data;

  const storedUserData = await storageManager.retrieveUserData();
  if (storedUserData) {
    data = JSON.parse(storedUserData) as UserData;
    if (data.autoconnect === undefined) data.autoconnect = true;
    if (data.nickname === undefined) data.nickname = '';
    if (data.associatedNicknames === undefined) data.associatedNicknames = {};
    return data;
  } else {
    return {autoconnect: true, nickname: "", associatedNicknames: {}};
  }
}