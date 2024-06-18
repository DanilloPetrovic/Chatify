import React, { useState, useEffect } from "react";
import "./Profile.css";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { auth, db } from "../../firebase";
import { getDocs, collection } from "firebase/firestore";
import nopfp from "../../photos/nopfp.png";

const Profile = () => {
  const navigate = useNavigate();
  const { username } = useParams();

  const [userFirestore, setUserFirestore] = useState([]);

  const getUserFirestore = async () => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const thisUser = filteredData.filter((user) => user.username === username);
    console.log(username);
    setUserFirestore(thisUser);
  };

  useEffect(() => {
    getUserFirestore();
  }, []);

  console.log(userFirestore);

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="profile">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div profile-div">
        <div className="img-username">
          {userFirestore ? (
            <div>
              <img
                className="pfp-profile"
                src={userFirestore.photoURL || nopfp}
                alt="Profile"
              />
              <p className="username-profile">{userFirestore[0].username}</p>
            </div>
          ) : (
            <div>
              <img className="pfp-profile" src={nopfp} alt="No profile" />
              <p className="username-profile">Loading...</p>
            </div>
          )}
        </div>
        <button onClick={logout}>Sign Out</button>
      </div>
    </div>
  );
};

export default Profile;
