import {UserData} from "../types/user.ts";
import {connector} from "@/init.ts";

export function getDefaultUserData(): UserData {
  const storedUserData = localStorage.getItem("userData");
  if (storedUserData) {
    const userData = JSON.parse(storedUserData) as UserData;
    connector.actions.sendNickname(userData.nickname)
    return userData;
  } else {
    return {nickname: "", associatedNicknames: {}};
  }
}