import React, { useState, useEffect } from "react";
import "./EditGroup.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { db, auth, storage, getAllUsers } from "../../firebase";
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
  const [friends, setFriends] = useState([]);
  const [validFriends, setValidFriends] = useState([]);
  const [groupNames, setGroupNames] = useState([]);
  const token = localStorage.getItem("token");

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

          // Update local state
          setImageUrls((prev) => [url, ...prev]);

          // Update currentChat state
          setCurrentChat((prev) => ({
            ...prev,
            imageURL: url,
          }));

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

  const getFriends = async () => {
    if (ownProfile) {
      const allUsers = await getAllUsers();
      const friendsRef = allUsers.filter((user) =>
        ownProfile.friends.includes(user.id)
      );

      setFriends(friendsRef);
    }
  };

  useEffect(() => {
    getFriends();
  }, []);

  const getValidMembers = async () => {
    if (ownProfile) {
      const allUsers = await getAllUsers();
      const friendsRef = allUsers.filter((user) =>
        ownProfile.friends.includes(user.id)
      );

      const validFriendsRef = friendsRef.filter(
        (friend) => !members.some((member) => member.id === friend.id)
      );

      setValidFriends(validFriendsRef);
    }
  };

  useEffect(() => {
    if (ownProfile && members.length > 0) {
      getValidMembers();
    }
  }, [ownProfile, members]);

  const handleAddMember = (friendId) => {
    const updatedMembersLocal = [...currentChat.users, friendId];
    setCurrentChat((prev) => ({ ...prev, users: updatedMembersLocal }));
  };

  const handleAddAdmin = (friendId) => {
    const updatedAdminLocal = [...currentChat.groupAdmin, friendId];
    setCurrentChat((prev) => ({ ...prev, groupAdmin: updatedAdminLocal }));
  };

  const handleRemoveMember = (friendId) => {
    const updatedMemberLocal = [
      ...currentChat.users.filter((user) => user !== friendId),
    ];

    const updatedAdminLocal = [
      ...currentChat.groupAdmin.filter((user) => user !== friendId),
    ];

    setCurrentChat((prev) => ({
      ...prev,
      users: updatedMemberLocal,
      groupAdmin: updatedAdminLocal,
    }));
  };

  const handleRemoveAdmin = (friendId) => {
    const updatedAdminLocal = [
      ...currentChat.groupAdmin.filter((user) => user !== friendId),
    ];

    setCurrentChat((prev) => ({ ...prev, groupAdmin: updatedAdminLocal }));
  };

  const getAllGroupNames = async () => {
    const allGroups = await getDocs(collection(db, "chats"));
    const groupNamesRef = allGroups.docs
      .filter((doc) => doc.data().chatType === "group")
      .map((doc) => doc.data().groupName);

    const finalGroupNames = groupNamesRef.filter((name) => name !== groupname);

    setGroupNames(finalGroupNames);
  };

  useEffect(() => {
    getAllGroupNames();
  }, []);

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

    onSubmit: async (values) => {
      setIsLoading(true);

      // Add your new condition here
      if (
        formik.values.groupUsers.length >= 3 &&
        formik.values.groupName.length !== 0 &&
        formik.values.groupUsers.length <= 5 &&
        ownProfile &&
        !formik.values.groupName.includes(" ") &&
        !groupNames.includes(formik.values.groupName)
      ) {
        try {
          const groupDocRef = doc(groupCollection, currentChat.id);
          await updateDoc(groupDocRef, {
            imageURL: values.image,
            groupName: values.groupName,
            groupAdmin: values.admins,
            users: values.groupUsers,
          });
          console.log("Group updated successfully");
        } catch (error) {
          console.error("Error updating group:", error);
        }
        navigate("/group/" + groupname);
      } else {
        alert("Please ensure that all conditions are met.");
      }

      setIsLoading(false);
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
                    <div className="pfp-username-add-member">
                      {user.imageURL.length > 0 ? (
                        <img src={user.imageURL} alt="Admin" />
                      ) : (
                        <img src={nopfp} alt="Admin" />
                      )}
                      <p>{user.username}</p>
                    </div>
                    {user.id !== ownProfile.id ? (
                      <div className="member-buttons">
                        <button onClick={() => handleRemoveAdmin(user.id)}>
                          Remove Admin
                        </button>
                      </div>
                    ) : null}
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
                    <div className="pfp-username-add-member">
                      {user.imageURL.length > 0 ? (
                        <img src={user.imageURL} alt="Member" />
                      ) : (
                        <img src={nopfp} alt="Member" />
                      )}
                      <p>{user.username}</p>
                    </div>

                    {user.id !== ownProfile.id ? (
                      <div className="member-buttons">
                        {currentChat.groupAdmin.includes(user.id) ? null : (
                          <button onClick={() => handleAddAdmin(user.id)}>
                            New admin
                          </button>
                        )}

                        <button onClick={() => handleRemoveMember(user.id)}>
                          Remove
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              : null}
            <button
              onClick={() => setIsAddMemberOpen((prev) => !prev)}
              className="add"
            >
              Add member
            </button>
          </div>
        </div>

        {isAddMemberOpen ? (
          <div className="potencial-new-members">
            {validFriends.length > 0 ? (
              validFriends.map((friend) => (
                <div className="add-member-div">
                  <div className="pfp-username-add-member">
                    {friend.imageURL.length > 0 ? (
                      <img src={friend.imageURL} />
                    ) : (
                      <img src={nopfp} />
                    )}
                    <p>{friend.username}</p>
                  </div>
                  <div>
                    <button onClick={() => handleAddMember(friend.id)}>
                      Add
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>all your friends are in the group</p>
            )}
          </div>
        ) : null}

        <button onClick={formik.handleSubmit} className="save-button">
          Save
        </button>
      </div>
    </div>
  );
};

export default EditGroup;
