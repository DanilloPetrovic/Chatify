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

const Group = () => {
  const [user, setUser] = useState(); // auth.currentUser
  const [ownProfile, setOwnProfile] = useState(); // profil u kome smo ulogovani sa podacima iz firestore
  const [isLoading, setIsLoading] = useState(true); // varijabla koja pokrece loading window
  const { groupname } = useParams(); // varijabla koja cuva username iz url linka da bismo prepoznali profil
  const [isOpen, setIsOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState([]);
  const [members, setMembers] = useState([]);

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
        console.log(chatDocRef);
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
              {currentChat[0].messages.map((message, index) =>
                message.senderId === ownProfile.id ? (
                  <div className="my-message-div" key={index}>
                    <div className="message-content">
                      <p className="my-message-p">{message.messageText}</p>
                      {ownProfile.imageURL.length > 0 ? (
                        <img src={ownProfile.imageURL} alt="My Profile" />
                      ) : (
                        <img src={nopfp} alt="No Profile" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="other-message-div" key={index}>
                    <div className="message-content">
                      {members
                        .filter((user) => user.id === message.senderId)
                        .map((user) =>
                          user.imageURL.length > 0 ? (
                            <img
                              style={{ cursor: "pointer" }}
                              onClick={() => navigate("/" + user.username)}
                              src={user.imageURL}
                            />
                          ) : (
                            <img
                              style={{ cursor: "pointer" }}
                              onClick={() => navigate("/" + user.username)}
                              src={nopfp}
                            />
                          )
                        )}
                      <p>{message.messageText}</p>
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

export default Group;
