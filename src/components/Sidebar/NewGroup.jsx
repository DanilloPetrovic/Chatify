import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import loadingImg from "../../photos/Rolling@1x-1.9s-200px-200px.gif";

const NewGroup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userFirestore, setUserFirestore] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [friendsToAddInGroup, setFriendsToAddInGroup] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupNames, setGroupNames] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getUserFirestore(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  const getUserFirestore = async (displayName) => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestore = filteredData.filter(
      (user) => user.username === displayName
    );

    const usernames = filteredData.map((user) => user.username);

    const friendsRef = filteredData.filter((user) =>
      userFirestore[0].friends.includes(user.id)
    );

    setFriends(friendsRef);
    setUserFirestore(userFirestore);
    setFriendsToAddInGroup((prev) => [...prev, userFirestore[0].id]);
    setIsLoading(false);
  };

  const getAllGroupNames = async () => {
    const allGroups = await getDocs(collection(db, "chats"));
    const groupNamesRef = allGroups.docs
      .filter((doc) => doc.data().chatType === "group")
      .map((doc) => doc.data().groupName);

    setGroupNames(groupNamesRef);
  };

  useEffect(() => {
    getAllGroupNames();
  }, []);

  const handleSearch = () => {
    if (searchValue.length > 0) {
      const searchValueLower = searchValue.toLowerCase();
      const usernamesResult = friends.filter((friend) =>
        friend.username.toLowerCase().includes(searchValueLower)
      );

      setSearchResult(usernamesResult);
    } else {
      setSearchResult([]);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchValue]);

  const handleAddFriendInGroup = (id) => {
    if (!friendsToAddInGroup.includes(id)) {
      setFriendsToAddInGroup((prev) => [...prev, id]);
    } else {
      setFriendsToAddInGroup((prev) => prev.filter((userId) => userId !== id));
    }
  };

  const handleCreateGroup = async () => {
    // provera podataka koji su potrebni za kreiranje grupe
    if (
      friendsToAddInGroup.length >= 3 &&
      groupName.length !== 0 &&
      friendsToAddInGroup.length <= 5 &&
      userFirestore &&
      !groupName.includes(" ") &&
      !groupNames.includes(groupName)
    ) {
      setIsLoading(true);

      try {
        // potrebne kolekcije i potrebni dokumenti
        const usersCollection = collection(db, "users");
        const chatsRef = collection(db, "chats");
        const ownProfileDocRef = doc(db, "users", userFirestore[0].id);

        // kako grupa treba da izgleda
        const groupConstructor = {
          users: friendsToAddInGroup,
          messages: [],
          createdAt: serverTimestamp(),
          chatType: "group",
          groupName: groupName,
          groupAdmin: [userFirestore[0].id],
          imageURL: "",
          groupAlert: [],
        };

        // kreiranje grupe u firebase
        const groupDoc = await addDoc(chatsRef, groupConstructor);

        // dodavanje grupe u dokumente usera
        const data = await getDocs(usersCollection);
        const filteredData = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const usersToUpdate = filteredData.filter((user) =>
          friendsToAddInGroup.includes(user.id)
        );

        const updatePromises = usersToUpdate.map((friend) => {
          if (friendsToAddInGroup.includes(friend.id)) {
            const friendDocRef = doc(db, "users", friend.id);
            return updateDoc(friendDocRef, {
              groups: [...(friend.groups || []), groupDoc.id],
            });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
        window.location.reload();
      } catch (error) {
        alert("An error occurred while creating the group.");
        console.log(error);
      }
    } else {
      alert("Invalid data :(");
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <img style={{ width: "50px", height: "50px" }} src={loadingImg} />;
  }

  return (
    <div className="create-group-div">
      <input
        placeholder="Enter group name..."
        className="name-input"
        onChange={(e) => setGroupName(e.target.value)}
        value={groupName}
      />
      <div className="up-create-div">
        <input
          placeholder="Search friends..."
          className="search-input create-group-input"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button className="create-group-div" onClick={handleCreateGroup}>
          Create
        </button>
      </div>

      <div className="suggested-friends-div">
        {searchResult.length > 0 ? (
          searchResult.map((user, i) => (
            <div className="searched-friend" key={i}>
              <p className="friend-username">{user.username}</p>
              {friendsToAddInGroup.length === 5 ? null : (
                <button
                  className="add-friend-to-group"
                  onClick={() => handleAddFriendInGroup(user.id)}
                >
                  {friendsToAddInGroup.includes(user.id) ? "-" : "+"}
                </button>
              )}
            </div>
          ))
        ) : friends.length > 0 ? (
          <div>
            {friends.map((friend, i) => (
              <div className="suggested-friend" key={i}>
                <p>{friend.username}</p>
                <button
                  className="add-friend-to-group"
                  onClick={() => handleAddFriendInGroup(friend.id)}
                >
                  {friendsToAddInGroup.includes(friend.id) ? "-" : "+"}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NewGroup;
