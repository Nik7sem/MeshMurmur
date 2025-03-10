import {FirebaseOptions} from "firebase/app";

export const firebaseConfig: FirebaseOptions = {
  databaseURL: "https://meshmurmur-default-rtdb.europe-west1.firebasedatabase.app/",
};

export const rtcConfig: RTCConfiguration = {
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"},
    // {
    //   urls: 'turn:relay1.expressturn.com:3478',
    //   username: 'efQUQ79N77B5BNVVKF',
    //   credential: 'N4EAUgpjMzPLrxSS',
    // }
  ]
}

export const connectorConfig = {
  numberOfSignalerPeer: 5,
  maxNumberOfPeers: 10
}

