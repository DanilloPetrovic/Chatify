import React, { useState, useRef, useEffect } from "react";
import "./Group.css";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Sidebar from "../../components/Sidebar/Sidebar";
import grouppfp from "../../photos/Untitled design (5).png";
import { useFormik } from "formik";
import EmojiPicker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";
import * as Yup from "yup";
import nopfp from "../../photos/nopfp.png";
import Loading from "../../components/Loading/Loading";
import trash from "../../photos/Untitled design (9).png";

const Group = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window
  const { groupname } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const [isOpen, setIsOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const userCollection = collection(db, "users");
  const navigate = useNavigate();
  const endRef = useRef(null);

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

  useEffect(() => {
    if (ownProfile) {
      const chatsCollection = collection(db, "chats");
      const unsubscribe = onSnapshot(chatsCollection, (snapshot) => {
        const filteredData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((chat) => chat.groupName === groupname);

        setCurrentChat(filteredData);
      });

      return () => unsubscribe();
    }
  }, [ownProfile]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  const getMembers = async () => {
    if (currentChat.length > 0) {
      const data = await getDocs(userCollection);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const membersRef = filteredData.filter((user) =>
        currentChat[0].users.includes(user.id)
      );

      setAllUsers(filteredData);
      setMembers(membersRef);
    }
  };

  useEffect(() => {
    getMembers();
  }, [currentChat]);

  const handleEmoji = (e) => {
    formik.setFieldValue("message", formik.values.message + e.emoji);
    setIsOpen(false);
  };

  const convertTime = (time) => {
    if (!time || !time.toDate) {
      return "N/A";
    }
    const toDateRef = time.toDate();
    const toDateRefStr = toDateRef.toString();
    const toDateRefArr = toDateRefStr.split(" ");
    return `${toDateRefArr[1]} ${toDateRefArr[2]} ${toDateRefArr[4].substring(
      0,
      5
    )}`;
  };

  const handleDelete = async (index) => {
    const userResponse = window.confirm(
      "Are you sure you want to delete this message?"
    );
    if (userResponse) {
      if (currentChat.length > 0) {
        const chatDocRef = doc(db, "chats", currentChat[0].id);
        const updatedMessages = currentChat[0].messages.filter(
          (_, i) => i !== index
        );
        await updateDoc(chatDocRef, { messages: updatedMessages });
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      message: "",
    },

    validationSchema: Yup.object({
      message: Yup.string().required(),
    }),

    onSubmit: async (values) => {
      if (ownProfile && currentChat.length > 0) {
        const chatDocRef = doc(db, "chats", currentChat[0].id);
        const messageConstructor = {
          messageText: values.message,
          senderId: ownProfile.id,
          sendAt: new Date(),
          isSeen: false,
        };

        const updatedMessageArr = [
          ...currentChat[0].messages,
          messageConstructor,
        ];

        await updateDoc(chatDocRef, { messages: updatedMessageArr });
        formik.resetForm();
      }
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="chat">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="chat-div main-div">
        <div
          className="chat-header"
          onClick={() =>
            navigate("/group/" + currentChat[0].groupName + "/info")
          }
        >
          {currentChat[0] ? (
            <div className="header-container">
              <div className="header-img-div">
                {currentChat[0].imageURL.length > 0 ? (
                  <img src={currentChat[0].imageURL} alt="Profile" />
                ) : (
                  <img src={grouppfp} alt="No Profile" />
                )}
              </div>

              <div className="header-username-div">
                <p>{currentChat[0].groupName}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="main-chat">
          {currentChat.length > 0 && members.length > 0 && ownProfile ? (
            <div className="all-messages-div">
              {currentChat[0].messages.map((message, index) => (
                <div key={index}>
                  {message.senderId === ownProfile.id ? (
                    <div className="my-message-div">
                      <div className="message-content my-message-group">
                        <div className="pfp-message-group">
                          <p className="my-message-p">{message.messageText}</p>
                          {ownProfile.imageURL.length > 0 ? (
                            <img src={ownProfile.imageURL} alt="My Profile" />
                          ) : (
                            <img src={nopfp} alt="No Profile" />
                          )}
                        </div>
                        <div className="time-delete-div">
                          <p className="message-time">
                            {convertTime(message.sendAt)}
                          </p>
                          <button
                            onClick={() => handleDelete(index)}
                            className="delete-message"
                          >
                            <img src={trash} alt="Delete" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : message.senderId !== ownProfile.id &&
                    message.senderId !== "group" ? (
                    <div className="other-message-div">
                      <div className="message-content message-content-group">
                        {allUsers
                          .filter((user) => user.id === message.senderId)
                          .map((user) => (
                            <div
                              className="pfp-username-message-group"
                              key={user.id}
                            >
                              <img
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate("/" + user.username)}
                                src={
                                  user.imageURL.length > 0
                                    ? user.imageURL
                                    : nopfp
                                }
                                alt={user.username}
                              />
                              <p
                                onClick={() => navigate("/" + user.username)}
                                className="username-group"
                              >
                                {user.username}
                              </p>
                            </div>
                          ))}
                        <p style={{ marginTop: "5px" }}>
                          {message.messageText}
                        </p>
                        <p className="message-time">
                          {convertTime(message.sendAt)}
                        </p>
                      </div>
                    </div>
                  ) : message.senderId === "group" ? (
                    <div className="group-alert-div">
                      {members
                        .filter((member) => member.id === message.changeUserId)
                        .map((user) => (
                          <p className="group-alert-p" key={user.id}>
                            {user.username}{" "}
                            {message.messageContent.substring(20)}
                          </p>
                        ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={endRef}></div>
            </div>
          ) : null}
        </div>

        <form className="inputs-header-div" onSubmit={formik.handleSubmit}>
          <input
            name="message"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.message}
            placeholder="Enter your message..."
          />

          <button type="submit" className="chat-send-button">
            Send
          </button>

          <div className="emoji-div">
            <button
              className="emoji-picker-button"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen((prev) => !prev);
              }}
            >
              <FaSmile />
            </button>
            {isOpen && (
              <div className="picker">
                <EmojiPicker onEmojiClick={handleEmoji} />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Group;
