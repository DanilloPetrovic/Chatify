import React, { useState } from "react";

const PfpUsername = () => {
  const [userFirestore, setUserFirestore] = useState([]);

  const getUserFirestore = async (displayName) => {
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestoreVar = filteredData.filter(
      (user) => user.username === username
    );

    const ownProfileVar = filteredData.filter(
      (user) => user.username === auth.currentUser.displayName
    );

    setOwnProfile(ownProfileVar);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  return (
    <div className="img-username">
      {userFirestore.length > 0 ? (
        userFirestore[0].imageURL.length > 0 ? (
          <img
            src={userFirestore[0].imageURL || nopfp}
            className="pfp-profile"
          />
        ) : (
          <img src={nopfp} className="pfp-profile" />
        )
      ) : null}

      {userFirestore.length > 0 ? (
        <p className="username-profile">{userFirestore[0].username}</p>
      ) : null}
    </div>
  );
};

export default PfpUsername;
