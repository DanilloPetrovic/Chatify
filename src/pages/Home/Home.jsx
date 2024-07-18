import React, { useState, useEffect } from "react";
import "./Home.css";
import { auth, getAllUsers } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Loading from "../../components/Loading/Loading";
import HowDoYouFeelToday from "../../components/HomeComponents/HowDoYouFeelToday";
import Statuses from "../../components/HomeComponents/Statuses";
import SuggestedUsers from "../../components/HomeComponents/SuggestedUsers";

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

      <div className="main-div home-div">
        <p className="chatify">
          Chatify<span className="chatify-span">©</span>
        </p>
        {user ? <HowDoYouFeelToday /> : null}
        <div className="main-of-main">
          <div className="all-status-div-home">
            {user ? <Statuses /> : null}
          </div>
          <div className="suggested-users-div-home">
            {user ? <SuggestedUsers /> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
