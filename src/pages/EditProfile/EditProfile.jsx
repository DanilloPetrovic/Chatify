import React, { useState, useEffect } from "react";
import "./EditProfile.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../../firebase";
import {
  getDocs,
  collection,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
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
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  useEffect(() => {
    const importImg = () => {
      if (imageInput && imageInput[0]) {
        const storageRef = ref(storage, `${token + imageInput[0].name}`);
        uploadBytes(storageRef, imageInput[0]).then((snapshot) => {
          getDownloadURL(snapshot.ref).then((url) => {
            setImageUrls((prev) => [...prev, url]);
          });
        });
      }
    };

    importImg();
  }, [imageInput]);

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

    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      image: "" || imageUrls,
      username: "",
      bio: "",
    },

    validationSchema: Yup.object().shape({
      username: Yup.string()
        .min(6, "min username length is 6")
        .max(20, "max username length is 20"),
      bio: Yup.string().max(200, "max description lenght is 200"),
    }),

    onSubmit: async (values) => {
      const collectionRef = collection(db, "projects");
      const data = {
        imageURL: imageUrls[0],
        title: values.title,
        description: values.description,
        link: values.link,
      };
      await addDoc(collectionRef, data);
      alert("Finish");
    },
  });

  return (
    <div className="edit-profile">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="edit-profile-from main-div">
        <div className="pfp-form">
          <input
            type="file"
            className="inputFile"
            accept="image/png, image/jpeg"
            id="fileInput"
            onChange={(e) => setImageInput(e.target.files)}
          />
          <label className="fileLabel" htmlFor="fileInput">
            Add new Image
          </label>
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
          </>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
