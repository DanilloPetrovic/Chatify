import React, { useState, useEffect } from "react";
import "./EditProfile.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../../firebase";
import { getDocs, collection, updateDoc, doc } from "firebase/firestore";
import { useFormik } from "formik";
import * as Yup from "yup";
import nopfp from "../../photos/nopfp.png";
import Loading from "../../components/Loading/Loading";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const EditProfile = () => {
  const [imageUrls, setImageUrls] = useState([]);
  const [imageInput, setImageInput] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [userFirestore, setUserFirestore] = useState([]);
  const [usernames, setUsernames] = useState([]);

  const navigate = useNavigate();

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

    const userFirestoreVar = filteredData.filter(
      (user) => user.username === username
    );

    const usernamesArr = filteredData.map((user) => user.username);

    setUsernames(usernamesArr);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      image: imageUrls[0] || userFirestore[0]?.imageURL || "",
      username: userFirestore[0]?.username || "",
      bio: userFirestore[0]?.bio || "",
    },

    validationSchema: Yup.object().shape({
      username: Yup.string()
        .min(6, "min username length is 6")
        .max(20, "max username length is 20"),
      bio: Yup.string().max(200, "max description length is 200"),
    }),

    onSubmit: async (values) => {
      setIsLoading(true);

      try {
        let imageURL = userFirestore[0]?.imageURL || "";

        if (imageInput) {
          const imageRef = ref(storage, `profile_pictures/${user.uid}`);
          await uploadBytes(imageRef, imageInput[0]);
          imageURL = await getDownloadURL(imageRef);
        }

        await updateProfile(auth.currentUser, {
          displayName: values.username,
          photoURL: imageURL,
        });

        const userDoc = doc(db, "users", userFirestore[0].id);
        await updateDoc(userDoc, {
          username: values.username,
          bio: values.bio,
          imageURL: imageURL,
        });

        setUserFirestore((prev) => [
          { ...prev[0], username: values.username, bio: values.bio, imageURL },
        ]);

        navigate(`/${values.username}`);
      } catch (err) {
        console.log(err);
      }

      setIsLoading(false);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="edit-profile">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="edit-profile-from main-div">
        <div className="pfp-form">
          <div>
            {imageUrls.length > 0 && imageUrls[0] ? (
              <img className="pfp-edit-profile" src={imageUrls[0]} />
            ) : (
              <img className="pfp-edit-profile" src={nopfp} />
            )}
          </div>

          <input
            name="image"
            onChange={(e) => setImageInput(e.target.files)}
            onBlur={formik.handleBlur}
            type="file"
            title="Add Image"
          />
          {formik.errors.image && formik.touched.image ? (
            <p className="error">{formik.errors.image}</p>
          ) : null}
        </div>

        {userFirestore.length > 0 && (
          <>
            <div className="username-form">
              <input
                className="username-profile-input"
                name="username"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                placeholder="Username"
              />
              {formik.errors.username && formik.touched.username ? (
                <p className="error">{formik.errors.username}</p>
              ) : null}
            </div>

            <div className="bio-form">
              <textarea
                className="bio-profile-textarea"
                name="bio"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.bio}
                placeholder="Enter your biography"
              />
              {formik.errors.bio && formik.touched.bio ? (
                <p className="error">{formik.errors.bio}</p>
              ) : null}
            </div>

            <button className="save-button" onClick={formik.handleSubmit}>
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
