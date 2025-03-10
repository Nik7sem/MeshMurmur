import {FirebaseOptions} from "firebase/app";

export const firebaseConfig: FirebaseOptions = {
  databaseURL: "https://meshmurmur-default-rtdb.europe-west1.firebasedatabase.app/",
};

export const rtcConfig: RTCConfiguration = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]}
