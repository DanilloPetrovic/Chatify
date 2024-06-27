import React, { useEffect, useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import * as Yup from "yup";
import { useFormik } from "formik";
import { auth, db } from "../../firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";
import Loading from "../../components/Loading/Loading";

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const userCollection = collection(db, "users");
  const navigate = useNavigate();

  const getUsers = async () => {
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const usernames = filteredData.map((user) => user.username);

    setUsernames(usernames);
    setUsers(filteredData);
  };

  useEffect(() => {
    getUsers();
  }, []);

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
        .min(6, "min password length is 6")
        .max(20, "max password length is 20"),
      username: Yup.string()
        .required("required")
        .min(6, "min username length is 6")
        .max(20, "max username length is 20"),
    }),

    onSubmit: async (values) => {
      setIsLoading(true);
      if (!auth.currentUser) {
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
            imageURL: "",
            bio: "",
            following: [],
            followers: [],
            friends: [],
            chats: [],
            groups: [],
            status: [],
          };

          await addDoc(userCollection, data);

          navigate("/login");
        } catch (err) {
          console.log(err);
        }
      } else {
        alert("You are already logged in!");
      }
      setIsLoading(false);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

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
