import {UserData} from "../types/user.ts";
import {storageManager} from "@/init.ts";

const defaultUserData: UserData = {
  connectorConfig: {
    signaler: 'FirebaseSignaler',
    autoconnect: true,
    autoreconnect: true,
  },
  nickname: "",
  associatedNicknames: {}
};

let data: UserData

export async function getDefaultUserData(): Promise<UserData> {
  if (data) return data;

  const storedUserData = await storageManager.retrieveUserData();
  if (storedUserData) {
    data = {...defaultUserData, ...(JSON.parse(storedUserData) as UserData)};
    return data;
  } else {
    return defaultUserData
  }
}