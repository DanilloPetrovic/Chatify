import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";

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
export const storage = getStorage(app);

// functions

const userCollection = collection(db, "users");
const groupCollection = collection(db, "chats");

export const getAllUsers = async () => {
  const data = await getDocs(userCollection);
  const filteredData = data.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  return filteredData;
};

export const getUserFirestore = async (
  displayName,
  setOwnProfile,
  setIsLoading
) => {
  const data = await getDocs(userCollection);
  const filteredData = data.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  const ownProfileVar = filteredData.find(
    (user) => user.username === displayName
  );

  setOwnProfile(ownProfileVar);
  setIsLoading(false);
};

export const getGroupInfo = async (setCurrentChat, groupname) => {
  const data = await getDocs(groupCollection);
  const filteredData = data.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }));

  const thisGroup = filteredData.filter(
    (group) => group.groupName === groupname
  );

  setCurrentChat(thisGroup.length > 0 ? thisGroup[0] : null);
};

export const getMembersAndAdmins = async (
  setMembers,
  setAdmins,
  currentChat
) => {
  if (currentChat) {
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const membersRef = filteredData.filter((user) =>
      currentChat.users.includes(user.id)
    );

    const adminsRef = filteredData.filter((user) =>
      currentChat.groupAdmin.includes(user.id)
    );

    setAdmins(adminsRef);
    setMembers(membersRef);
  }
};
