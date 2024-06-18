import React from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
};

export default Profile;
