import {UserData} from "../types/user.ts";
import {storageManager} from "@/init.ts";

let data: null | UserData = null

export async function getDefaultUserData(): Promise<UserData> {
  if (data) return data;

  const storedUserData = await storageManager.retrieveUserData();
  if (storedUserData) {
    return (data = JSON.parse(storedUserData))
  } else {
    return {autoconnect: true, nickname: "", associatedNicknames: {}};
  }
}