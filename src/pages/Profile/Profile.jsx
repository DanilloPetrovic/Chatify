import React, { useState } from "react";
import "./Profile.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import Loading from "../../components/Loading/Loading";
import PfpUsername from "../../components/ProfileComponents/PfpUsername";
import FriendsGroups from "../../components/ProfileComponents/FriendsGropus";
import ButtonsProfile from "../../components/ProfileComponents/ButtonsProfile";
import ProfileInfo from "../../components/ProfileComponents/ProfileInfo";
import MyStatuses from "../../components/ProfileComponents/MyStatuses";
import ResponsiveSidebar from "../../components/Sidebar/ResponsiveSidebar";

const Profile = () => {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="profile">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="responsive-sidebar-div">
        <ResponsiveSidebar />
      </div>

      <div className="main-div profile-div">
        <PfpUsername />

        <FriendsGroups />

        <ButtonsProfile />

        <ProfileInfo />

        <MyStatuses />
      </div>
    </div>
  );
};

export default Profile;
