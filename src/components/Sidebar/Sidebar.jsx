import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { auth, db } from "../../firebase";
import nopfp from "../../photos/nopfp.png";
import { getDocs, collection } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { onAuthStateChanged } from "firebase/auth";
import Loading from "../Loading/Loading";
import NewGroup from "./NewGroup";
import grouppfp from "../../photos/Untitled design (5).png";

const Sidebar = () => {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [userFirestore, setUserFirestore] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const location = useLocation();

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

    const friendsRef = filteredData.filter((user) =>
      userFirestore[0].friends.includes(user.id)
    );

    setFriends(friendsRef);
    setUsernames(usernames);
    setUserFirestore(userFirestore);
    setGroups(userFirestore[0].groups);
    setIsLoading(false);
  };

  const getGroups = async () => {
    if (groups.length > 0) {
      const groupsCollection = collection(db, "chats");
      const data = await getDocs(groupsCollection);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const myGroups = filteredData.filter((group) =>
        groups.includes(group.id)
      );

      setGroups(myGroups);
    }
  };

  useEffect(() => {
    getGroups();
  }, [userFirestore]);

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

  return (
    <div className="sidebar">
      {username || location.pathname !== "/" ? (
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
          {friends.length > 0 ? (
            friends.map((friend, i) => (
              <div
                className="friend-div"
                key={i}
                onClick={() => {
                  navigate("/chat/" + friend.username);
                  window.location.reload();
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
          <div className="groups-header">
            <p className="to-chat-p">Groups</p>{" "}
            <button onClick={() => setIsCreateGroupOpen((prev) => !prev)}>
              {isCreateGroupOpen ? "-" : "+"}
            </button>
          </div>

          {isCreateGroupOpen ? <NewGroup /> : null}

          {groups.length > 0 ? (
            groups.map((group) => (
              <div
                className="group-div"
                onClick={() => {
                  navigate("/group/" + group.groupName);
                  window.location.reload();
                }}
                key={group.id}
              >
                {group.imageURL !== "" ? (
                  <img className="group-pfp" src={group.imageURL} />
                ) : (
                  <img className="group-pfp" src={grouppfp} />
                )}
                <p className="group-p">{group.groupName}</p>
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
