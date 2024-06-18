import React from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import * as Yup from "yup";
import { useFormik } from "formik";
import { auth, db } from "../../firebase";
import { addDoc, collection } from "firebase/firestore";

const Register = () => {
  const userCollection = collection(db, "users");
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      username: "",
    },

    validationSchema: Yup.object({
      email: Yup.string().required("required").email("not valid email"),
      password: Yup.string()
        .required("required")
        .min(6, "min password lenght is 6")
        .max(20, "max password lenght is 20"),
      username: Yup.string()
        .required("required")
        .min(6, "min username lenght is 6")
        .max(20, "max username lenght is 20"),
    }),

    onSubmit: async (values) => {
      if (!auth.currentUser) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formik.values.email,
            formik.values.password
          );
          const user = userCredential.user;
          await updateProfile(user, { displayName: formik.values.username });

          const data = {
            username: values.username,
            email: values.email,
            password: values.password,
            friends: [],
            following: [],
            followers: [],
            groups: [],
            bio: [],
            status: [],
          };

          await addDoc(userCollection, data);

          navigate("/login");
        } catch (err) {
          console.log(err);
        }
      } else {
        alert("You already logged in!");
      }
    },
  });

  return (
    <div className="acc-form">
      <h1>Register</h1>

      <div className="email-div">
        <input
          className="email-input"
          name="email"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.email}
          placeholder="E-mail"
        />
        {formik.errors.email && formik.touched.email ? (
          <p className="error">{formik.errors.email}</p>
        ) : null}
      </div>

      <div className="password-div">
        <input
          className="password-input"
          name="password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.password}
          placeholder="Password"
          type="password"
        />
        {formik.errors.password && formik.touched.password ? (
          <p className="error">{formik.errors.password}</p>
        ) : null}
      </div>

      <div className="username-div">
        <input
          className="username-input"
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
      <p className="to-other-page" onClick={() => navigate("/login")}>
        You already have an account?
      </p>
      <div className="button-div">
        <button onClick={formik.handleSubmit} className="register-button">
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
