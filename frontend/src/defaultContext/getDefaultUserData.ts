import {UserData} from "../types/user.ts";

const defaultUserData: UserData = {ready: true}

export function getDefaultUserData(): UserData {
  const storedUserData = localStorage.getItem("userData");
  return storedUserData ? JSON.parse(storedUserData) : defaultUserData;
}