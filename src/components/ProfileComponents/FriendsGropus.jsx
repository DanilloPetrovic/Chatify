import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDocs, collection } from "firebase/firestore";
import { useParams } from "react-router-dom";
import nopfp from "../../photos/nopfp.png";

const FriendsGroups = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [userFirestore, setUserFirestore] = useState(); // podaci profila koji se prikazuje na stranici iz firestore
  const { username } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getUserFirestore(currentUser.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  // funkcija za dobjianje potrebnih informacija od profila
  const getUserFirestore = async (displayName) => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestoreVar = filteredData.find(
      (user) => user.username === username
    );

    const ownProfileVar = filteredData.find(
      (user) => user.username === displayName
    );

    setOwnProfile(ownProfileVar);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  return (
    <div className="friends-groups">
      {userFirestore && userFirestore.friends ? (
        <div className="friends-groups-container">
          <div className="friends-div">
            <h6 className="friends-h6">Friends</h6>
            <p className="friends-p">{userFirestore.friends.length}</p>
          </div>
          <div className="groups-div-profile">
            <h6 className="groups-h6">Groups</h6>
            <p className="groups-p">
              {userFirestore.groups ? userFirestore.groups.length : 0}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FriendsGroups;
