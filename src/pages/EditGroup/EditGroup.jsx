import React, { useState, useEffect } from "react";
import "./EditGroup.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { db, auth, storage } from "../../firebase";
import Loading from "../../components/Loading/Loading";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useNavigate } from "react-router-dom";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { useFormik } from "formik";
import * as Yup from "yup";
import nopfp from "../../photos/nopfp.png";
import grouppfp from "../../photos/Untitled design (5).png";

const EditGroup = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [imageInput, setImageInput] = useState(null);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const token = localStorage.getItem("token");
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // New state for selected user

  const { groupname } = useParams();
  const userCollection = collection(db, "users");
  const groupCollection = collection(db, "chats");
  const navigate = useNavigate();

  useEffect(() => {
    const importImg = async () => {
      if (imageInput && imageInput[0]) {
        const file = imageInput[0];
        const maxSize = 5 * 1024 * 1024; // 5 MB
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

        if (file.size > maxSize) {
          alert("File size exceeds 5 MB");
          return;
        }

        if (!allowedTypes.includes(file.type)) {
          alert("Invalid file type. Only JPEG, PNG, and GIF are allowed.");
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
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const ownProfileVar = filteredData.find(
      (user) => user.username === displayName
    );

    setOwnProfile(ownProfileVar);
    setIsLoading(false);
  };

  const getGroupInfo = async () => {
    const data = await getDocs(groupCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const thisGroup = filteredData.filter(
      (group) => group.groupName === groupname
    );

    setCurrentChat(thisGroup.length > 0 ? thisGroup[0] : null);
  };

  useEffect(() => {
    getGroupInfo();
  }, []);

  const getMembersAndAdmins = async () => {
    if (currentChat) {
      const data = await getDocs(userCollection);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const membersRef = filteredData.filter((user) =>
        currentChat.users.includes(user.id)
      );

      const adminsRef = filteredData.filter((user) =>
        currentChat.groupAdmin.includes(user.id)
      );

      setAdmins(adminsRef);
      setMembers(membersRef);
    }
  };

  useEffect(() => {
    getMembersAndAdmins();
  }, [currentChat]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      image: currentChat?.imageURL || "",
      groupName: currentChat?.groupName || "",
      groupUsers: currentChat?.users || [],
      admins: currentChat?.groupAdmin || [],
    },

    validationSchema: Yup.object().shape({
      groupName: Yup.string(),
    }),

    onSubmit: (values) => {
      console.log(values);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="edit-group-all">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div edit-group-div">
        <div className="grouppfp-groupname-container">
          {currentChat &&
            (currentChat.imageURL.length > 0 ? (
              <img className="pfp-profile" src={currentChat.imageURL} />
            ) : (
              <img className="pfp-profile" src={grouppfp} />
            ))}
        </div>

        <div className="input-group-pfp-div">
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

        <div className="group-name-input">
          <input
            name="groupName"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Enter name of your group"
            value={formik.values.groupName}
          />
          {formik.errors.image && formik.touched.image ? (
            <p className="error">{formik.errors.image}</p>
          ) : null}
        </div>

        <div className="group-info-down-div">
          <div className="group-info-admins-div">
            <h6>Admins</h6>{" "}
            {currentChat && admins.length > 0
              ? admins.map((user) => (
                  <div className="admin-user-div" key={user.id}>
                    {user.imageURL.length > 0 ? (
                      <img src={user.imageURL} alt="Admin" />
                    ) : (
                      <img src={nopfp} alt="Admin" />
                    )}
                    <p>{user.username}</p>
                  </div>
                ))
              : null}
          </div>
          <div className="group-info-members-div group-info-members-edit">
            <h6>Members</h6>
            {currentChat && members.length > 0
              ? members.map((user) => (
                  <div
                    className="member-user-div"
                    key={user.id}
                    onClick={() => {}}
                  >
                    {user.imageURL.length > 0 ? (
                      <img src={user.imageURL} alt="Member" />
                    ) : (
                      <img src={nopfp} alt="Member" />
                    )}
                    <p>{user.username}</p>
                  </div>
                ))
              : null}
            <button className="add">Add member</button>
          </div>
        </div>

        <button className="save-button">Save</button>
      </div>
    </div>
  );
};

export default EditGroup;
