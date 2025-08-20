import {FirebaseOptions} from "firebase/app";

export const firebaseConfig: FirebaseOptions = {
  databaseURL: "https://meshmurmur-default-rtdb.europe-west1.firebasedatabase.app/",
};

export const rtcConfig: RTCConfiguration = {
  // iceTransportPolicy: 'relay',
  iceServers: [
    {urls: "stun:stun.l.google.com:19302"},
    {urls: "stun:stun2.l.google.com:19302"},
    {urls: "stun:stun.stunprotocol.org:3478"},
    {
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'efQUQ79N77B5BNVVKF',
      credential: 'N4EAUgpjMzPLrxSS',
    },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=tcp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    },
    {
      urls: 'turn:turn.bistri.com:80',
      credential: 'homeo',
      username: 'homeo'
    },
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      credential: 'webrtc',
      username: 'webrtc'
    }
  ]
}

export const AppConfig = {
  maxNumberOfOutgoingConnections: 5,
  maxNumberOfPeers: 10,
  maxNameLength: 15,
  connectingTimeout: 30000,
}
