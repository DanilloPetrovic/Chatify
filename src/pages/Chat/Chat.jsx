import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getDocs,
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";
import nopfp from "../../photos/nopfp.png";
import { useFormik } from "formik";
import * as Yup from "yup";
import Loading from "../../components/Loading/Loading";
import trash from "../../photos/Untitled design (10).png";

const Chat = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [userFirestore, setUserFirestore] = useState(); // podaci profila koji se prikazuje na stranici iz firestore
  const { username } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window
  const [isOpen, setIsOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState([]);

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
    const userCollection = collection(db, "users");
    const data = await getDocs(userCollection);
    const filteredData = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    const userFirestoreVar = filteredData.find(
      (user) => user.username === username
    );

    const ownProfileVar = filteredData.find(
      (user) => user.username === displayName
    );

    setOwnProfile(ownProfileVar);
    setUserFirestore(userFirestoreVar);

    setIsLoading(false);
  };

  useEffect(() => {
    if (ownProfile && userFirestore) {
      const chatsCollection = collection(db, "chats");
      const unsubscribe = onSnapshot(chatsCollection, (snapshot) => {
        const filteredData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (chat) =>
              chat.users.includes(userFirestore.id) &&
              chat.users.includes(ownProfile.id) &&
              chat.chatType === "normal"
          );

        setCurrentChat(filteredData);
      });

      return () => unsubscribe();
    }
  }, [ownProfile, userFirestore]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat]);

  const handleEmoji = (e) => {
    formik.setFieldValue("message", formik.values.message + e.emoji);
    setIsOpen(false);
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

  const convertTime = (time) => {
    if (!time || !time.toDate) {
      return "N/A"; // Return a default value if time is not available
    }
    const toDateRef = time.toDate();
    const toDateRefStr = toDateRef.toString();
    const toDateRefArr = toDateRefStr.split(" ");

    return `${toDateRefArr[1]} ${toDateRefArr[2]} ${toDateRefArr[4].substring(
      0,
      5
    )}`;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="chat">
      <div className="sidebar-div">
        <Sidebar />
      </div>

      <div className="main-div chat-div">
        <div className="chat-header" onClick={() => navigate("/" + username)}>
          {userFirestore ? (
            <div className="header-container">
              <div className="header-img-div">
                {userFirestore.imageURL.length > 0 ? (
                  <img src={userFirestore.imageURL} alt="Profile" />
                ) : (
                  <img src={nopfp} alt="No Profile" />
                )}
              </div>

              <div className="header-username-div">
                <p>{userFirestore.username}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="main-chat">
          {currentChat.length > 0 && userFirestore && ownProfile ? (
            <div className="all-messages-div">
              {currentChat[0].messages.map((message, index) =>
                message.senderId === ownProfile.id ? (
                  <div className="my-message-div" key={index}>
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
                          className="delete-message"
                          onClick={() => handleDelete(index)}
                        >
                          <img src={trash} alt="Delete" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="other-message-div" key={index}>
                    <div className="message-content my-message-group">
                      <div className="pfp-message-group">
                        {userFirestore.imageURL.length > 0 ? (
                          <img
                            src={userFirestore.imageURL}
                            alt="Other Profile"
                          />
                        ) : (
                          <img src={nopfp} alt="No Profile" />
                        )}
                        <p className="send-at-p">{message.messageText}</p>
                      </div>
                      <p className="message-time">
                        {convertTime(message.sendAt)}
                      </p>
                    </div>
                  </div>
                )
              )}
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

export default Chat;
