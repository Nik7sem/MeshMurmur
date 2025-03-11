import {createContext} from "react";
import {UserData} from "../types/user.ts";
import {getDefaultUserData} from "../defaultContext/getDefaultUserData.ts";

interface UserDataSetter {
  userData: UserData
  setUserData: (userData: UserData) => void;
}


export const UserDataContext = createContext<UserDataSetter>({
  userData: getDefaultUserData(),
  setUserData: () => {
  },
})