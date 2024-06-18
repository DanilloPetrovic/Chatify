import React, { useState, useEffect } from "react";
import "./Home.css";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/register");
      }
    });

    return () => unsubscribe();
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <div className="Home">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="chat"></div>
    </div>
  );
};

export default Home;
