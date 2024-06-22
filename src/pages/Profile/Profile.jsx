import React, { useState, useEffect } from "react";
import "./Profile.css";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { auth, db } from "../../firebase";
import { getDocs, collection, updateDoc, doc } from "firebase/firestore";
import nopfp from "../../photos/nopfp.png";
import Loading from "../../components/Loading/Loading";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState([]);
  const [userFirestore, setUserFirestore] = useState([]);
  const { username } = useParams();
  const [isLoading, setIsLoading] = useState(true);

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

    const userFirestoreVar = filteredData.filter(
      (user) => user.username === username
    );

    const ownProfileVar = filteredData.filter(
      (user) => user.username === auth.currentUser.displayName
    );

    setOwnProfile(ownProfileVar);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  const isProfileInFriends = (profileId) => {
    if (ownProfile.length > 0) {
      return ownProfile[0].friends.some((friend) => friend.id === profileId);
    }
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleFollow = async () => {
    if (ownProfile.length > 0 && userFirestore.length > 0) {
      const ownProfileDocRef = doc(db, "users", ownProfile[0].id);
      const userFirestoreDocRef = doc(db, "users", userFirestore[0].id);

      const isFollowing = ownProfile[0].following.some(
        (user) => user.id === userFirestore[0].id
      );

      if (isFollowing) {
        alert("You are already following this profile!");
        return;
      }

      const updatedFollowing = [...ownProfile[0].following, userFirestore[0]];
      const updatedFollowers = [...userFirestore[0].followers, ownProfile[0]];
      const updatedFriendsOwn = [...ownProfile[0].friends, userFirestore[0]];
      const updatedFriendsOther = [...userFirestore[0].friends, ownProfile[0]];

      try {
        await updateDoc(ownProfileDocRef, {
          following: updatedFollowing,
          friends: updatedFriendsOwn,
        });
        await updateDoc(userFirestoreDocRef, {
          followers: updatedFollowers,
          friends: updatedFriendsOther,
        });

        setOwnProfile((prev) => [{ ...prev[0], following: updatedFollowing }]);
        setUserFirestore((prev) => [
          { ...prev[0], followers: updatedFollowers },
        ]);

        getUserFirestore(auth.currentUser.displayName);
      } catch (error) {
        console.error("Error following the user: ", error);
      }
    }
  };

  const handleUnfollow = async () => {
    if (ownProfile.length > 0 && userFirestore.length > 0) {
      const ownProfileDocRef = doc(usersCollection, ownProfile[0].id);
      const userFirestoreDocRef = doc(usersCollection, userFirestore[0].id);

      const updatedFollowing = ownProfile[0].following.filter(
        (user) => user.id !== userFirestore[0].id
      );
      const updatedFollowers = userFirestore[0].followers.filter(
        (user) => user.id !== ownProfile[0].id
      );
      const updatedFriendsOwn = ownProfile[0].friends.filter(
        (friend) => friend.id !== userFirestore[0].id
      );
      const updatedFriendsOther = userFirestore[0].friends.filter(
        (friend) => friend.id !== ownProfile[0].id
      );

      try {
        await updateDoc(ownProfileDocRef, {
          following: updatedFollowing,
          friends: updatedFriendsOwn,
        });
        await updateDoc(userFirestoreDocRef, {
          followers: updatedFollowers,
          friends: updatedFriendsOther,
        });

        setOwnProfile((prev) => [{ ...prev[0], following: updatedFollowing }]);
        setUserFirestore((prev) => [
          { ...prev[0], followers: updatedFollowers },
        ]);

        getUserFirestore(auth.currentUser.displayName);
      } catch (error) {
        console.error("Error unfollowing the user: ", error);
      }
    }
  };

  const handleFollowBack = async (followerUsername) => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestoreToFollowBack = filteredData.filter(
      (user) => user.username === followerUsername
    );

    const ownProfileDocRef = doc(userCollection, ownProfile[0].id);
    const userFirestoreToFollowBackDocRef = doc(
      userCollection,
      userFirestoreToFollowBack[0].id
    );

    const isFollowing = ownProfile[0].following.some(
      (user) => user.id === userFirestoreToFollowBack[0].id
    );
    const isFollower = userFirestoreToFollowBack[0].followers.some(
      (user) => user.id === ownProfile[0].id
    );

    if (isFollowing) {
      alert("You are already following this profile!");
      return;
    }

    const updatedFollowing = [
      ...ownProfile[0].following,
      userFirestoreToFollowBack[0],
    ];

    const updatedFollowers = [
      ...userFirestoreToFollowBack[0].followers,
      ownProfile[0],
    ];

    const updatedFriendsOwn = [
      ...ownProfile[0].friends,
      userFirestoreToFollowBack[0],
    ];
    const updatedFreindsOther = [
      ...userFirestoreToFollowBack[0].friends,
      ownProfile[0],
    ];

    try {
      await updateDoc(ownProfileDocRef, {
        following: updatedFollowing,
        friends: updatedFriendsOwn,
      });
      await updateDoc(userFirestoreToFollowBackDocRef, {
        followers: updatedFollowers,
        friends: updatedFreindsOther,
      });

      setOwnProfile((prev) => [{ ...prev[0], following: updatedFollowing }]);

      getUserFirestore(auth.currentUser.displayName);
    } catch (error) {
      console.error("Error following the user: ", error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="profile">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div profile-div">
        <div className="img-username">
          {userFirestore.length > 0 ? (
            <img
              src={userFirestore[0].imageURL || nopfp}
              className="pfp-profile"
            />
          ) : null}

          {userFirestore.length > 0 ? (
            <p className="username-profile">{userFirestore[0].username}</p>
          ) : null}
        </div>

        <div className="friends-groups">
          {userFirestore.length > 0 ? (
            <div className="friends-groups-container">
              <div className="friends-div">
                <h6 className="friends-h6">Friends</h6>
                <p className="friends-p">{userFirestore[0].friends.length}</p>
              </div>

              <div className="groups-div-profile">
                <h6 className="groups-h6">Groups</h6>
                <p className="groups-p">{userFirestore[0].groups.length}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="profile-buttons">
          {auth.currentUser &&
          userFirestore.length > 0 &&
          userFirestore[0].username === auth.currentUser.displayName ? (
            <div className="edit-signout-btns">
              <div className="edit-btn-div">
                <button className="edit-btn">Edit Profile</button>
              </div>

              <div className="signout-btn-div">
                <button onClick={logout} className="signout-btn">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="follow-unfollow-btn">
              {ownProfile.length > 0 &&
              ownProfile[0].following.some(
                (user) => user.id === userFirestore[0].id
              ) ? (
                <button onClick={handleUnfollow}>Unfollow</button>
              ) : (
                <button onClick={handleFollow}>Follow</button>
              )}
            </div>
          )}
        </div>

        <div className="profile-info-div">
          {auth.currentUser &&
          userFirestore.length > 0 &&
          userFirestore[0].username === auth.currentUser.displayName ? (
            <div className="profile-infos">
              <div className="friend-request-div">
                <p className="friend-requests-p">Friend requests</p>

                {userFirestore[0].followers.length > 0 ? (
                  userFirestore[0].followers.filter(
                    (follower) => !isProfileInFriends(follower.id)
                  ).length > 0 ? (
                    userFirestore[0].followers
                      .filter((follower) => !isProfileInFriends(follower.id))
                      .map((follower) => (
                        <div
                          className="follower-div"
                          key={follower.id}
                          onClick={() => {
                            navigate("/" + follower.username);
                            window.location.reload();
                          }}
                        >
                          <div>
                            <img
                              src={follower.imageURL || nopfp}
                              alt="follower profile pic"
                            />
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
                  <p className="ydhafr">
                    You don't have any friend requests :(
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bio-div">
              {userFirestore[0].bio.length > 0 ? (
                <div className="bio-div-2">
                  <p className="bio-p">Biography</p>
                  <p className="bio-p">{userFirestore[0].bio}</p>
                </div>
              ) : (
                <div className="bio-div-2">
                  <p className="bio-p">Biography</p>
                  <p className="ydhafr">This user don't have bio yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
