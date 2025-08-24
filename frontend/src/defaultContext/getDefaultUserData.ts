import {UserData} from "../types/user.ts";
import {storageManager} from "@/init.ts";

const defaultUserData = {
  autoconnect: true,
  signaler: "FirebaseSignaler",
  nickname: "",
  associatedNicknames: {}
};

let data: UserData

export async function getDefaultUserData(): Promise<UserData> {
  if (data) return data;

  const storedUserData = await storageManager.retrieveUserData();
  if (storedUserData) {
    data = JSON.parse(storedUserData) as UserData;
    return {...defaultUserData, ...data};
  } else {
    return defaultUserData
  }
}