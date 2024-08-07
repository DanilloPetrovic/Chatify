import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../../firebase";
import {
  getDocs,
  collection,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import nopfp from "../../photos/nopfp.png";

const ProfileInfo = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [userFirestore, setUserFirestore] = useState(null);
  const [followers, setFollowers] = useState([]);
  const { username } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [chats, setChats] = useState([]);

  const navigate = useNavigate();
  const usersCollection = collection(db, "users");

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

    const userFirestoreVar = filteredData.find(
      (user) => user.username === username
    );

    const ownProfileVar = filteredData.find(
      (user) => user.username === displayName
    );

    const followersRef = filteredData.filter((user) =>
      ownProfileVar.followers.includes(user.id)
    );

    setFollowers(followersRef);
    setOwnProfile(ownProfileVar);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  // funkcija za chat dokumente
  const getChats = async () => {
    if (userFirestore && ownProfile) {
      const chatsCollection = collection(db, "chats");
      const data = await getDocs(chatsCollection);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const chatsRef = filteredData.filter(
        (chat) =>
          chat.users.includes(userFirestore.id) &&
          chat.users.includes(ownProfile.id)
      );

      setChats(chatsRef);
    }
  };

  useEffect(() => {
    getChats();
  }, [userFirestore, ownProfile]);

  // Function to check if a profile is already a friend
  const isProfileInFriends = (profileId) => {
    return ownProfile?.friends.some((friend) => friend === profileId);
  };

  const handleFollowBack = async (followerUsername) => {
    // Fetching user data for the follower to follow back
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestoreToFollowBack = filteredData.find(
      (user) => user.username === followerUsername
    );

    if (!userFirestoreToFollowBack) return;

    // uzimanje chats kolekcije iz firebase
    const chatsCollection = collection(db, "chats");
    const ownProfileDocRef = doc(userCollection, ownProfile.id);
    const userFirestoreToFollowBackDocRef = doc(
      userCollection,
      userFirestoreToFollowBack.id
    );

    // Check if already following
    const isFollowing = ownProfile.following.some(
      (userId) => userId === userFirestoreToFollowBack.id
    );

    if (isFollowing) {
      alert("You are already following this profile!");
      return;
    }

    // Update friends arrays
    const updatedFriendsOwn = [
      ...ownProfile.friends,
      userFirestoreToFollowBack.id,
    ];
    const updatedFriendsOther = [
      ...userFirestoreToFollowBack.friends,
      ownProfile.id,
    ];

    // kreiranje chat konstruktora
    const chatRef = {
      users: [userFirestoreToFollowBack.id, ownProfile.id],
      messages: [],
      createdAt: serverTimestamp(),
      chatType: "normal",
    };

    try {
      await updateDoc(ownProfileDocRef, {
        following: [...ownProfile.following, userFirestoreToFollowBack.id],
        friends: updatedFriendsOwn,
      });
      await updateDoc(userFirestoreToFollowBackDocRef, {
        followers: [...userFirestoreToFollowBack.followers, ownProfile.id],
        friends: updatedFriendsOther,
      });

      setOwnProfile((prev) => ({
        ...prev,
        friends: updatedFriendsOwn,
      }));

      if (chats.length !== 0) {
        return;
      } else {
        // ako ne postoji chat sa ova dva usera
        let chatDoc = await addDoc(chatsCollection, chatRef);

        // dodavanje u chat nizove
        const ownProfileAddChatId = [...ownProfile.chats, chatDoc.id];
        const userFirestoreAddChatId = [
          ...userFirestoreToFollowBack.chats,
          chatDoc.id,
        ];

        await updateDoc(ownProfileDocRef, { chats: ownProfileAddChatId });
        await updateDoc(userFirestoreToFollowBackDocRef, {
          chats: userFirestoreAddChatId,
        });

        setOwnProfile((prev) => ({ ...prev, chats: ownProfileAddChatId }));
        setUserFirestore((prev) => ({
          ...prev,
          chats: userFirestoreAddChatId,
        }));
      }
    } catch (error) {
      console.error("Error following the user: ", error);
    }
  };

  return (
    <div className="profile-info-div">
      {auth.currentUser && userFirestore ? (
        userFirestore.username === auth.currentUser.displayName ? (
          <div className="profile-infos">
            <div className="bio-div-12">
              {userFirestore.bio ? (
                <div className="bio-div-2">
                  <p className="bio-p">Biography</p>
                  <p className="bio-text">{userFirestore.bio}</p>
                </div>
              ) : (
                <div className="bio-div-2">
                  <p className="bio-p">Biography</p>
                  <p className="ydhafr">This user doesn't have a bio yet</p>
                </div>
              )}
            </div>

            <div className="friend-request-div">
              <p className="friend-requests-p">Friend requests</p>

              {followers.length > 0 ? (
                followers.filter((follower) => !isProfileInFriends(follower.id))
                  .length > 0 ? (
                  followers
                    .filter((follower) => !isProfileInFriends(follower.id))
                    .map((follower) => (
                      <div
                        className="follower-div"
                        key={follower.id}
                        onClick={() => {
                          navigate("/" + follower.username);
                        }}
                      >
                        <div>
                          {follower.imageURL.length > 0 ? (
                            <img src={follower.imageURL} />
                          ) : (
                            <img src={nopfp} />
                          )}

                          <p>{follower.username}</p>
                        </div>
                        <div>
                          {isProfileInFriends(follower.id) ? (
                            <button disabled>Followed</button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollowBack(follower.username);
                              }}
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="ydhafr">
                    You don't have any friend requests :(
                  </p>
                )
              ) : (
                <p className="ydhafr">You don't have any friend requests :(</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bio-div">
            {userFirestore.bio ? (
              <div className="bio-div-2">
                <p className="bio-p">Biography</p>
                <p className="bio-text">{userFirestore.bio}</p>
              </div>
            ) : (
              <div className="bio-div-2">
                <p className="bio-p">Biography</p>
                <p className="ydhafr">This user doesn't have a bio yet</p>
              </div>
            )}
          </div>
        )
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProfileInfo;
