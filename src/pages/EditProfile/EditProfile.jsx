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
  const token = localStorage.getItem("token");

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

  useEffect(() => {
    const importImg = async () => {
      if (imageInput && imageInput[0]) {
        const file = imageInput[0];
        const maxSize = 5 * 1024 * 1024; // 5 MB
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

        // Provera veličine datoteke
        if (file.size > maxSize) {
          alert("File size exceeds 5 MB");
          return;
        }

        // Provera tipa datoteke
        if (!allowedTypes.includes(file.type)) {
          alert("Invalid file type. Only JPEG, PNG and GIF are allowed.");
          return;
        }

        const storageRef = ref(storage, `${token + file.name}`);
        try {
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          setImageUrls((prev) => [url, ...prev]);
          console.log("Image uploaded successfully:", url);
        } catch (error) {
          console.error("Error uploading image:", error);
          alert("Error uploading image: " + error.message);
        }
      }
    };

    importImg();
  }, [imageInput, token]);

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

    const usernamesArr = filteredData
      .map((user) => user.username)
      .filter((username) => username !== userFirestoreVar.username);

    setUsernames(usernamesArr);

    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      image: imageUrls[0] || "",
      username: userFirestore?.username || "",
      bio: userFirestore?.bio || "",
    },

    validationSchema: Yup.object().shape({
      username: Yup.string()
        .min(6, "min username length is 6")
        .max(20, "max username length is 20"),
      bio: Yup.string().max(200, "max description length is 200"),
    }),

    onSubmit: async (values) => {
      setIsLoading(true);

      if (userFirestore && auth.currentUser) {
        const userDoc = doc(db, "users", userFirestore.id);
        const invalidUsernames = ["register", "login"];

        if (
          usernames.includes(values.username) ||
          invalidUsernames.includes(values.username.toLowerCase())
        ) {
          alert(
            "Username already exists or is not allowed! Please choose a different one."
          );
          setIsLoading(false);
          return;
        }

        console.log(values.image);

        try {
          await updateProfile(auth.currentUser, {
            displayName: values.username,
            photoURL: values.image || "",
          });
          await updateDoc(userDoc, {
            username: values.username,
            imageURL: values.image || "",
            bio: values.bio,
          });
          navigate("/" + userFirestore.username);
          window.location.reload();
        } catch (err) {
          console.log(err);
        }
      }
      setIsLoading(false);
    },
  });

  console.log(imageUrls[0], "ulrs");
  console.log(imageInput, "input");

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
              <img className="pfp-edit-profile" src={formik.values.image} />
            ) : (
              <img
                className="pfp-edit-profile"
                src={userFirestore.imageURL || nopfp}
              />
            )}
          </div>

          <input
            name="image"
            onChange={(e) => setImageInput(e.target.files)}
            onBlur={formik.handleBlur}
            for={"fileInput"}
            type="file"
          />
          {formik.errors.image && formik.touched.image ? (
            <p className="error">{formik.errors.image}</p>
          ) : null}
        </div>

        {userFirestore && (
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
