import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { auth, db } from "../../firebase";
import nopfp from "../../photos/nopfp.png";
import { getDocs, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const [userFirestore, setUserFirestore] = useState([]);

  const getUserFirestore = async () => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    if (auth.currentUser) {
      const userFirestore = filteredData.filter(
        (user) => user.username === auth.currentUser.displayName
      );

      setUserFirestore(userFirestore);
    } else {
      console.log("nema usera");
    }
  };

  console.log(userFirestore);

  useEffect(() => {
    setUser(auth.currentUser);
    getUserFirestore();
  }, []);

  console.log(userFirestore);

  return (
    <div className="sidebar">
      <div className="pfp-username">
        {user && user.photoURL ? (
          <img className="pfp-image" src={user.photoURL} />
        ) : (
          <img className="pfp-image" src={nopfp} />
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

      <div className="search-div">
        <input className="search-input" placeholder="Search..." />
      </div>

      <div className="to-chat">
        <div className="freinds-div">
          <p className="to-chat-p">Friends</p>
          {userFirestore.length > 0 && userFirestore[0].friends.length > 0 ? (
            userFirestore[0].friends.map((friend) => (
              <div className="firend-div" key={friend.id}>
                {friend.username}
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
