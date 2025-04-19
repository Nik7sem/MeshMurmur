import {useContext} from "react";
import {UserDataContext} from "../context/UserDataContext.tsx";
import {UserData} from "../types/user.ts";
import {connector, storageManager} from "@/init.ts";

const useUserData = () => {
  const {userData, setUserData} = useContext(UserDataContext)

  function setData(newUserData: UserData) {
    if (userData.nickname !== newUserData.nickname) {
      connector.actions.sendNickname(newUserData.nickname)
    }
    connector.actions.associatedNicknames = newUserData.associatedNicknames
    setUserData(newUserData)
    storageManager.storeUserData(JSON.stringify(newUserData)).then()
  }

  return {userData, setUserData: setData}
}

export default useUserData