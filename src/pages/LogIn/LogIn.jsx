import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading/Loading";

const LogIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      email: Yup.string().email().required("required"),
      password: Yup.string()
        .required("required")
        .min(6, "minimum lenght of your password must be 6 characters")
        .max(20, "maximum lenght of your password must be 20 characters"),
    }),

    onSubmit: async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            formik.values.email,
            formik.values.password
          );
          localStorage.setItem("token", userCredential.user.uid);
          navigate("/");
        } catch (err) {
          alert("Account didn't exist");
        }
      } else {
        alert("You already logged in!");
      }
      setIsLoading(false);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="acc-form">
      <h1>Log In</h1>

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

      <p className="to-other-page" onClick={() => navigate("/register")}>
        You don't have an account?
      </p>
      <div className="button-div">
        <button onClick={formik.handleSubmit} className="log-in-button">
          Log In
        </button>
      </div>
    </div>
  );
};

export default LogIn;
