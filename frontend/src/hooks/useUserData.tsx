import {useContext} from "react";
import {UserDataContext} from "../context/UserDataContext.tsx";
import {UserData} from "../types/user.ts";

const useUserData = () => {
  const {userData, setUserData} = useContext(UserDataContext)

  function setData(newUserData: UserData) {
    setUserData(newUserData)
    localStorage.setItem("userData", JSON.stringify(newUserData))
  }

  return {userData, setUserData: setData}
}

export default useUserData