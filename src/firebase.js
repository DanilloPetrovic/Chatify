import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxKJyDkxMioHGz3yTtPYIUFOGRLVI0RoM",
  authDomain: "chatify-74adc.firebaseapp.com",
  projectId: "chatify-74adc",
  storageBucket: "chatify-74adc.appspot.com",
  messagingSenderId: "771550453210",
  appId: "1:771550453210:web:b35a0a1155f389273434e3",
  measurementId: "G-SF8S16R214",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
