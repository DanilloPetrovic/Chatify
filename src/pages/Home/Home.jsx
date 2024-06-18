import React, { useState, useEffect } from "react";
import "./Home.css";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Loading from "../../components/Loading/Loading";

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
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

    setIsLoading(false);
    return () => unsubscribe();
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="Home">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div chat"></div>
    </div>
  );
};

export default Home;
