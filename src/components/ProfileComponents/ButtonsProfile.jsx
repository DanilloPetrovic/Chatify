import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

const ButtonsProfile = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [userFirestore, setUserFirestore] = useState(); // podaci profila koji se prikazuje na stranici iz firestore
  const { username } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window

  const navigate = useNavigate(); // varijabla za navigaciju

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

  //   button funkcije

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleFollow = async () => {
    if (ownProfile && userFirestore) {
      // Uzimanje document-a iz firebase za profile
      const ownProfileDocRef = doc(db, "users", ownProfile.id);
      const userFirestoreDocRef = doc(db, "users", userFirestore.id);

      // provera da li prijavljeni profil prati prikazani profil
      const isFollowing = ownProfile.following.some(
        (user) => user === userFirestore.id
      );

      //   prekidanje funkcije ukoliko prijavljeni profil prati prikazani profil
      if (isFollowing) {
        alert("You are already following this profile!");
        return;
      }

      //   provera da li prikazani profil prati prijavljeni profil
      const isFollowedByOtherUser = userFirestore.followers.some(
        (user) => user === ownProfile.id
      );

      //   kreiranje nizova u kojim su dodati profili u nizovima za pratioce i pracenje
      const updatedFollowingOwnProfile = [
        ...ownProfile.following,
        userFirestore.id,
      ];

      const updatedFollowersUserFirestore = [
        ...userFirestore.followers,
        ownProfile.id,
      ];

      //   uzimanje informacija iz friends nizova oba profila
      let updatedFriendsOwn = [...ownProfile.friends];
      let updatedFriendsOther = [...userFirestore.friends];

      //   provera da li prikazani user prati prijavljenog usera i ako da se dodaju u friends nizove
      if (isFollowedByOtherUser) {
        updatedFriendsOwn = [...updatedFriendsOwn, userFirestore.id];
        updatedFriendsOther = [...updatedFriendsOther, ownProfile.id];
      }

      //   update-ovanje firebase profila i lokalna memorija
      try {
        await updateDoc(ownProfileDocRef, {
          following: updatedFollowingOwnProfile,
          friends: updatedFriendsOwn,
        });
        await updateDoc(userFirestoreDocRef, {
          followers: updatedFollowersUserFirestore,
          friends: updatedFriendsOther,
        });

        setOwnProfile((prev) => ({
          ...prev,
          following: updatedFollowingOwnProfile,
          friends: updatedFriendsOwn,
        }));
        setUserFirestore((prev) => ({
          ...prev,
          followers: updatedFollowersUserFirestore,
          friends: updatedFriendsOther,
        }));
      } catch (error) {
        console.error("Error following the user: ", error);
      }
    }
  };

  const handleUnfollow = async () => {
    if (ownProfile && userFirestore) {
      // Uzimanje document-a iz firebase za profile
      const ownProfileDocRef = doc(db, "users", ownProfile.id);
      const userFirestoreDocRef = doc(db, "users", userFirestore.id);

      //   uklanjanje id-eva iz lista za pracenje i friends
      const updatedFollowing = ownProfile.following.filter(
        (user) => user !== userFirestore.id
      );
      const updatedFollowers = userFirestore.followers.filter(
        (user) => user !== ownProfile.id
      );
      const updatedFriendsOwn = ownProfile.friends.filter(
        (friend) => friend !== userFirestore.id
      );
      const updatedFriendsOther = userFirestore.friends.filter(
        (friend) => friend !== ownProfile.id
      );

      //   update-ovanje firebase profila i lokalna memorija
      try {
        await updateDoc(ownProfileDocRef, {
          following: updatedFollowing,
          friends: updatedFriendsOwn,
        });
        await updateDoc(userFirestoreDocRef, {
          followers: updatedFollowers,
          friends: updatedFriendsOther,
        });

        setOwnProfile((prev) => ({
          ...prev,
          following: updatedFollowing,
          friends: updatedFriendsOwn,
        }));
        setUserFirestore((prev) => ({
          ...prev,
          followers: updatedFollowers,
          friends: updatedFriendsOther,
        }));
      } catch (error) {
        console.error("Error unfollowing the user: ", error);
      }
    }
  };

  return (
    <div className="profile-buttons">
      {auth.currentUser &&
      userFirestore &&
      userFirestore.username === auth.currentUser.displayName ? (
        <div className="edit-signout-btns">
          <div className="edit-btn-div">
            <button
              className="edit-btn"
              onClick={() =>
                navigate("/edit-profile/" + userFirestore.username)
              }
            >
              Edit Profile
            </button>
          </div>

          <div className="signout-btn-div">
            <button onClick={logout} className="signout-btn">
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="follow-unfollow-btn">
          {ownProfile?.following.some((user) => user === userFirestore?.id) ? (
            <button onClick={handleUnfollow}>Unfollow</button>
          ) : (
            <button onClick={handleFollow}>Follow</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ButtonsProfile;
