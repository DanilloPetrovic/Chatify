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
  const [ownProfile, setOwnProfile] = useState();
  const [userFirestore, setUserFirestore] = useState([]);
  const { username } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const unsubscribeFn = () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getUserFirestore(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  };

  const getOwnProfile = async () => {
    if (auth.currentUser) {
      const userCollection = collection(db, "users");
      const data = await getDocs(userCollection);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const ownProfile = filteredData.find(
        (user) => user.username === auth.currentUser.displayName
      );

      if (ownProfile) {
        setOwnProfile(ownProfile);
      } else {
        console.error("Own profile not found");
      }
    }
  };

  const getUserFirestore = async (displayName) => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestore = filteredData.filter(
      (user) => user.username === username
    );

    setUserFirestore(userFirestore);
    setIsLoading(false);
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    unsubscribeFn();
    getOwnProfile();
  }, []);

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

        <div className="freidns-gropus">
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
            <div className="follow-unfollow-btn"></div>
          )}
        </div>

        <div className="profile-info-div">
          {auth.currentUser &&
          userFirestore.length > 0 &&
          userFirestore[0].username === auth.currentUser.displayName ? (
            <div className="profile-infos">
              <div className="friend-request-div">
                <p className="friend-requests-p">
                  Friend requests ({userFirestore[0].followers.length})
                </p>

                {userFirestore[0].followers.length > 0 ? (
                  userFirestore[0].followers.map((follower) => (
                    <p>{follower.username}</p>
                  ))
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
