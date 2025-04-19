import {UserData} from "../types/user.ts";
import {connector, storageManager} from "@/init.ts";

export async function getDefaultUserData(): Promise<UserData> {
  const storedUserData = await storageManager.retrieveUserData();
  if (storedUserData) {
    const userData = JSON.parse(storedUserData) as UserData;
    connector.actions.sendNickname(userData.nickname)
    connector.actions.associatedNicknames = userData.associatedNicknames
    return userData;
  } else {
    return {nickname: "", associatedNicknames: {}};
  }
}