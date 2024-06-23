import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { auth, db } from "../../firebase";
import nopfp from "../../photos/nopfp.png";
import { getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { onAuthStateChanged } from "firebase/auth";
import Loading from "../Loading/Loading";

const Sidebar = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [userFirestore, setUserFirestore] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState([]);

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

    const userFirestore = filteredData.filter(
      (user) => user.username === displayName
    );

    const usernames = filteredData.map((user) => user.username);

    setUsernames(usernames);
    setUserFirestore(userFirestore);
    setIsLoading(false);
  };

  const handleSearch = () => {
    if (searchValue.length > 0) {
      const searchValueLower = searchValue.toLowerCase();
      const usernamesResult = usernames.filter(
        (username) =>
          username.toLowerCase().includes(searchValueLower) &&
          username !== auth.currentUser.displayName
      );

      setSearchResult(usernamesResult);
    } else {
      setSearchResult([]);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchValue]);

  if (isLoading) {
    return <Loading />;
  }

  console.log(searchResult);

  return (
    <div className="sidebar">
      {username ? (
        <div className="back-to-home-div">
          <button
            className="back-to-home"
            onClick={() => {
              navigate("/");
            }}
          >
            <IoIosArrowBack />
          </button>
        </div>
      ) : (
        <div className="pfp-username">
          {user && user.photoURL ? (
            <img
              onClick={() => {
                navigate("/" + auth.currentUser.displayName);
              }}
              className="pfp-image"
              src={user.photoURL}
            />
          ) : (
            <img
              onClick={() => {
                navigate("/" + auth.currentUser.displayName);
              }}
              className="pfp-image"
              src={nopfp}
            />
          )}

          {user ? (
            <p
              onClick={() => {
                navigate("/" + auth.currentUser.displayName);
              }}
              className="username-p"
            >
              {user.displayName}
            </p>
          ) : null}
        </div>
      )}

      <div className="search-div">
        <input
          onChange={(event) => setSearchValue(event.target.value)}
          className="search-input"
          placeholder="Search..."
          value={searchValue}
        />
        {searchResult.length > 0
          ? searchResult.map((user, i) => (
              <div
                onClick={() => {
                  navigate("/" + user);
                  window.location.reload();
                }}
                className="search-result-div"
                key={i}
              >
                <p className="search-result-p">{user}</p>
              </div>
            ))
          : null}
      </div>

      <div className="to-chat">
        <div className="freinds-div">
          <p className="to-chat-p">Friends</p>
          {userFirestore.length > 0 && userFirestore[0].friends.length > 0 ? (
            userFirestore[0].friends.map((friend) => (
              <div
                className="friend-div"
                key={friend.id}
                onClick={() => {
                  navigate("/chat/" + friend.username);
                }}
              >
                {friend.imageURL.length > 0 ? (
                  <img
                    src={friend.imageURL}
                    onClick={() => {
                      navigate("/" + friend.username);
                      window.location.reload();
                    }}
                  />
                ) : (
                  <img
                    src={nopfp}
                    onClick={() => {
                      navigate("/" + friend.username);
                      window.location.reload();
                    }}
                  />
                )}
                <p>{friend.username}</p>
              </div>
            ))
          ) : (
            <p className="uhnaaf">You have not added any friends</p>
          )}
        </div>

        <div className="groups-div">
          <p className="to-chat-p">Groups</p>
          {userFirestore.length > 0 && userFirestore[0].groups.length > 0 ? (
            userFirestore[0].groups.map((friend) => (
              <div className="firend-div" key={friend.id}>
                {friend.username}
              </div>
            ))
          ) : (
            <p className="uhnaaf">You are not member of any group</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
