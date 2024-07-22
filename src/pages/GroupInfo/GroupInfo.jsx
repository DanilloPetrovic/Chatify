import React, { useState, useEffect } from "react";
import "./GroupInfo.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  setUser,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import grouppfp from "../../photos/Untitled design (5).png";
import nopfp from "../../photos/nopfp.png";

const GroupInfo = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window
  const [currentChat, setCurrentChat] = useState(null);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const navigate = useNavigate();
  const { groupname } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const userCollection = collection(db, "users");
  const groupCollection = collection(db, "chats");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getUserFirestore(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  // funkcija za dobjianje potrebnih informacija od profila
  const getUserFirestore = async (displayName) => {
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

  const getGroupInfo = async () => {
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

  useEffect(() => {
    getGroupInfo();
  }, []);

  const getMembersAndAdmins = async () => {
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

  useEffect(() => {
    getMembersAndAdmins();
  }, [currentChat]);

  const handleLeaveGroup = async () => {
    if (ownProfile && currentChat) {
      // uzimanje dokumenata iz firebase
      const ownProfileDocRef = doc(db, "users", ownProfile.id);
      const currentChatDocRef = doc(db, "chats", currentChat.id);

      // kreiranje updateovanih nizova
      const updatedOwnProfileGroupArr = ownProfile.groups.filter(
        (group) => group !== currentChat.id
      );

      const updatedGroupUsersArr = currentChat.users.filter(
        (user) => user !== ownProfile.id
      );

      const updatedGroupAdminArr = currentChat.groupAdmin.filter(
        (user) => user !== ownProfile.id
      );

      try {
        await updateDoc(ownProfileDocRef, {
          groups: updatedOwnProfileGroupArr,
        });

        await updateDoc(currentChatDocRef, {
          users: updatedGroupUsersArr,
          groupAdmin: updatedGroupAdminArr,
        });

        if (updatedGroupAdminArr.length === 0) {
          await updateDoc(currentChatDocRef, {
            groupAdmin: [...updatedGroupAdminArr, updatedGroupUsersArr[0]],
          });
        }

        if (
          updatedGroupAdminArr.length === 0 &&
          updatedGroupUsersArr.length === 0
        ) {
          await deleteDoc(currentChatDocRef);
        }

        navigate("/");
      } catch (error) {
        console.log(error);
      }
    }
  };

  console.log(currentChat);

  return (
    <div className="group-info">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div group-info-div">
        <div className="grouppfp-groupname">
          {currentChat ? (
            <div className="grouppfp-groupname-container">
              {currentChat.imageURL.length > 0 ? (
                <img className="pfp-profile" src={currentChat.imageURL} />
              ) : (
                <img className="pfp-profile" src={grouppfp} />
              )}
              <p className="username-profile">{currentChat.groupName}</p>
            </div>
          ) : null}
        </div>

        <div className="members-admins-div">
          {currentChat ? (
            <div className="members-admins">
              <div className="admins-div">
                <h6 className="admins-h6">Admins</h6>
                <p className="admins-p">{currentChat.groupAdmin.length}</p>
              </div>
              <div className="members-div">
                <h6 className="members-h6">Members</h6>
                <p className="admins-p">{currentChat.users.length}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="group-info-down-div">
          <div className="group-info-admins-div">
            <h6>Admins</h6>
            {currentChat && admins.length > 0
              ? admins.map((user, i) => (
                  <div className="admin-user-div" key={i}>
                    {user.imageURL.length > 0 ? (
                      <img src={user.imageURL} />
                    ) : (
                      <img src={nopfp} />
                    )}
                    <p>{user.username}</p>
                  </div>
                ))
              : null}
          </div>
          <div className="group-info-members-div">
            <h6>Members</h6>
            {currentChat && members.length > 0
              ? members.map((user) => (
                  <div className="member-user-div">
                    {user.imageURL.length > 0 ? (
                      <img src={user.imageURL} />
                    ) : (
                      <img src={nopfp} />
                    )}
                    <p>{user.username}</p>
                  </div>
                ))
              : null}
          </div>
        </div>

        <div className="group-info-buttons">
          {currentChat && ownProfile ? (
            <div>
              {currentChat.groupAdmin.includes(ownProfile.id) ? (
                <div className="edit-leave-buttons">
                  <button
                    className="edit-group-button"
                    onClick={() =>
                      navigate("/group/" + currentChat.groupName + "/edit")
                    }
                  >
                    Edit Group
                  </button>
                  <button
                    className="leave-group-button"
                    onClick={handleLeaveGroup}
                  >
                    Leave Group
                  </button>
                </div>
              ) : (
                <button
                  className="leave-group-button"
                  onClick={handleLeaveGroup}
                >
                  Leave Group
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GroupInfo;
