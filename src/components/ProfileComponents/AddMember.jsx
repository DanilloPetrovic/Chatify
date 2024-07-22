import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, getAllUsers } from "../../firebase";
import { useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import nopfp from "../../photos/nopfp.png";

const AddMember = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [friends, setFriends] = useState([]);
  const [validFriends, setValidFriends] = useState([]);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const { groupname } = useParams();
  const groupCollection = collection(db, "chats");
  const userCollection = collection(db, "users");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getOwnProfile();
      }
    });

    return () => unsubscribe();
  }, []);

  const getOwnProfile = async () => {
    if (auth.currentUser) {
      const allUsers = await getAllUsers();
      const ownProfileRef = allUsers.find(
        (u) => u.username === auth.currentUser.displayName
      );

      setOwnProfile(ownProfileRef);
    }
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

  const getValidMembers = async () => {
    if (ownProfile) {
      const allUsers = await getAllUsers();
      const friendsRef = allUsers.filter((user) =>
        ownProfile.friends.includes(user.id)
      );

      const validFriendsRef = friendsRef.filter(
        (friend) => !members.some((member) => member.id === friend.id)
      );

      setValidFriends(validFriendsRef);
    }
  };

  useEffect(() => {
    if (ownProfile && members.length > 0) {
      getValidMembers();
    }
  }, [ownProfile, members]);

  const handleAddMember = (friendId) => {};

  return (
    <div className="potencial-new-members">
      {validFriends.length > 0 ? (
        validFriends.map((friend) => (
          <div className="add-member-div">
            <div className="pfp-username-add-member">
              {friend.imageURL.length > 0 ? (
                <img src={friend.imageURL} />
              ) : (
                <img src={nopfp} />
              )}
              <p>{friend.username}</p>
            </div>
            <div>
              <button onClick={() => handleAddMember(friend.id)}>Add</button>
            </div>
          </div>
        ))
      ) : (
        <p>all your friends are in the group</p>
      )}
      <button className="save-button save-button-add-member">
        Add members
      </button>
    </div>
  );
};

export default AddMember;
