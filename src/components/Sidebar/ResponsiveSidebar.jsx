import React, { useState, useEffect } from "react";
import { FaGripLines } from "react-icons/fa";
import { IoMdHome } from "react-icons/io";
import { FaUserFriends } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, getAllUsers } from "../../firebase";
import nopfp from "../../photos/nopfp.png";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const ResponsiveSidebar = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();

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

  return (
    <div className="responsive-sidebar">
      <div className="nav-bar">
        <button onClick={() => setIsSidebarOpen((prev) => !prev)}>
          <FaGripLines />
        </button>
        <button onClick={() => navigate("/")}>
          <IoMdHome />
        </button>
        <button className="suggested-weather">
          <FaUserFriends />
        </button>
        {ownProfile ? (
          ownProfile.imageURL.length > 0 ? (
            <img
              onClick={() => navigate("/" + ownProfile.username)}
              className="pfp-responsive-sidebar"
              src={ownProfile.imageURL}
            />
          ) : (
            <img
              onClick={() => navigate("/" + ownProfile.username)}
              className="pfp-responsive-sidebar"
              src={nopfp}
            />
          )
        ) : null}
      </div>

      {isSidebarOpen ? <Sidebar /> : null}
    </div>
  );
};

export default ResponsiveSidebar;
