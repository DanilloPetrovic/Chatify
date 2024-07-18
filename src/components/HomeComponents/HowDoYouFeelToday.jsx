import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth, getAllUsers } from "../../firebase";
import { useFormik } from "formik";
import * as Yup from "yup";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import loadingGif from "../../photos/Rolling@1x-1.9s-200px-200px.gif";

const HowDoYouFeelToday = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ownProfile, setOwnProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getOwnProfile();
      }
    });

    return () => unsubscribe();
  }, []);

  const getOwnProfile = async () => {
    if (auth.currentUser) {
      const allUsers = await getAllUsers();
      const ownProfileRef = allUsers.find(
        (u) => u.username === auth.currentUser.displayName
      );

      setOwnProfile(ownProfileRef);
    }
  };

  const formik = useFormik({
    initialValues: {
      hdyft: "",
    },

    validationSchema: Yup.object({
      hdyft: Yup.string()
        .required("")
        .max(200, "Status can't be longer than 200 characters"),
    }),

    onSubmit: async (values) => {
      setIsLoading(true);
      if (ownProfile) {
        const statusCollection = collection(db, "statuses");

        const statusConfig = {
          userID: ownProfile.id,
          statusContent: values.hdyft,
          createdAt: new Date(),
          likes: [],
          comments: [],
        };

        try {
          await addDoc(statusCollection, statusConfig);
          formik.resetForm();
        } catch (error) {
          console.log(error);
        }
      }
      setIsLoading(false);
    },
  });

  if (isLoading) {
    return (
      <div className="how-do-you-feel-today">
        <img className="loading-gif-hdyft" src={loadingGif} />
      </div>
    );
  }

  return (
    <div className="how-do-you-feel-today">
      {ownProfile ? (
        <textarea
          className="hdyft-textarea"
          name="hdyft"
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
          value={formik.values.hdyft}
          placeholder={`How do you feel today, ${ownProfile.username}?`}
        />
      ) : null}
      <button onClick={formik.handleSubmit} className="hdyft-button">
        Add status
      </button>
      {formik.errors.hdyft && formik.touched.hdyft ? (
        <div className="error">{formik.errors.hdyft}</div>
      ) : null}
    </div>
  );
};

export default HowDoYouFeelToday;
