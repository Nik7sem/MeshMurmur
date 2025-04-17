import {useContext} from "react";
import {UserDataContext} from "../context/UserDataContext.tsx";
import {UserData} from "../types/user.ts";
import {connector} from "@/init.ts";

const useUserData = () => {
  const {userData, setUserData} = useContext(UserDataContext)

  function setData(newUserData: UserData) {
    if (userData.nickname !== newUserData.nickname) {
      connector.actions.sendNickname(newUserData.nickname)
    }
    connector.actions.associatedNicknames = newUserData.associatedNicknames
    setUserData(newUserData)
    localStorage.setItem("userData", JSON.stringify(newUserData))
  }

  return {userData, setUserData: setData}
}

export default useUserData