import React, { useState, useEffect } from "react";
import { auth, db, getAllUsers } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import nopfp from "../../photos/nopfp.png";
import unlike from "../../photos/Untitled design (6).png";
import like from "../../photos/Untitled design (7).png";
import comment from "../../photos/Untitled design (8).png";
import { useFormik } from "formik";
import * as Yup from "yup";

const Statuses = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [status, setStatus] = useState([]);
  const [friends, setFriends] = useState([]);
  const [commentsOpenStatusId, setCommentsOpenStatusId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  const getAllUsersHere = async () => {
    const allUsersRef = await getAllUsers();

    setAllUsers(allUsersRef);
  };

  useEffect(() => {
    getAllUsersHere();
  }, []);

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

  const getFriends = async () => {
    if (ownProfile) {
      const allUsers = await getAllUsers();
      const friendsRef = allUsers.filter((user) =>
        ownProfile.friends.includes(user.id)
      );

      const friendsFinal = [...friendsRef, ownProfile];

      setFriends(friendsFinal);
    }
  };

  useEffect(() => {
    if (ownProfile) {
      getFriends();
    }
  }, [ownProfile]);

  useEffect(() => {
    if (ownProfile && friends.length > 0) {
      const statusesCollectionRef = collection(db, "statuses");

      const unsubscribe = onSnapshot(statusesCollectionRef, (snapshot) => {
        const filteredData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const friendsIDS = friends.map((friend) => friend.id);
        const validStatuses = filteredData.filter((status) =>
          friendsIDS.includes(status.userID)
        );

        const finalStatus = validStatuses.sort(
          (a, b) =>
            new Date(b.createdAt.toDate()) - new Date(a.createdAt.toDate())
        );

        setStatus(finalStatus);
      });

      return () => unsubscribe();
    }
  }, [friends]);

  const handleLike = async (statusId) => {
    if (ownProfile) {
      const statusDocRef = doc(db, "statuses", statusId);
      const currentStatus = status.find((s) => s.id === statusId);
      if (currentStatus) {
        const whoLiked = [...currentStatus.likes];
        const alreadyLiked = whoLiked.includes(ownProfile.id);

        const updatedLikes = alreadyLiked
          ? whoLiked.filter((id) => id !== ownProfile.id)
          : [...whoLiked, ownProfile.id];

        setStatus((prevStatuses) =>
          prevStatuses.map((s) =>
            s.id === statusId ? { ...s, likes: updatedLikes } : s
          )
        );

        await updateDoc(statusDocRef, { likes: updatedLikes });
      }
    }
  };

  const toggleComments = (statusId) => {
    setCommentsOpenStatusId((prev) => (prev === statusId ? null : statusId));
  };

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

  const formik = useFormik({
    initialValues: {
      commentContent: "",
    },

    validationSchema: Yup.object({
      commentContent: Yup.string().required("Comment is required").max(100),
    }),

    onSubmit: async (values) => {
      if (ownProfile) {
        const commentDocRef = doc(db, "statuses", commentsOpenStatusId);
        const currentStatus = status.find((s) => s.id === commentsOpenStatusId);

        const commentConfig = {
          commentContent: values.commentContent,
          createdAt: new Date(),
          likes: [],
          commentUserID: ownProfile.id,
        };

        const updatedComments = [...currentStatus.comments, commentConfig];

        try {
          await updateDoc(commentDocRef, { comments: updatedComments });
          formik.resetForm();
        } catch (error) {
          console.log(error);
        }
      }
    },
  });

  return (
    <div className="statuses">
      <h2 className="news-h2">Friend's statuses</h2>
      <div className="all-status">
        {status.length > 0 && friends.length > 0 ? (
          status.map((status) => (
            <div className="status-div" key={status.id}>
              <div className="pfp-username-status">
                {friends
                  .filter((friend) => friend.id === status.userID)
                  .map((friend) =>
                    friend.imageURL && friend.imageURL.length > 0 ? (
                      <div key={friend.id}>
                        <img src={friend.imageURL} alt="Profile" />
                        <p
                          className="status-p"
                          onClick={() => {
                            navigate("/" + friend.username);
                          }}
                        >
                          {friend.username}
                        </p>
                        <p className="status-time">
                          {convertTime(status.createdAt)}
                        </p>
                      </div>
                    ) : (
                      <div key={friend.id}>
                        <img src={nopfp} alt="No Profile" />
                        <p
                          className="status-p"
                          onClick={() => {
                            navigate("/" + friend.username);
                          }}
                        >
                          {friend.username}
                        </p>
                        <p className="status-time">
                          {convertTime(status.createdAt)}
                        </p>
                      </div>
                    )
                  )}
              </div>

              <div className="status-content-div">
                <p>{status.statusContent}</p>
              </div>

              <div className="status-btns">
                <button
                  onClick={() => handleLike(status.id)}
                  className="like-button"
                >
                  {status.likes.includes(ownProfile.id) ? (
                    <img src={like} alt="Liked" />
                  ) : (
                    <img src={unlike} alt="Unliked" />
                  )}
                </button>
                <p className="l-c-info">{status.likes.length}</p>
                <button
                  onClick={() => toggleComments(status.id)}
                  className="comment-button"
                >
                  <img src={comment} alt="Comment" />
                </button>
                <p className="l-c-info">{status.comments.length}</p>
              </div>
              {commentsOpenStatusId === status.id ? (
                <div className="status-comments-div">
                  <h4>
                    Comments{" "}
                    <span className="comments-span">
                      {status.comments.length}
                    </span>
                  </h4>

                  <div className="all-comments">
                    {status.comments && status.comments.length > 0 ? (
                      status.comments.map((comment, index) => (
                        <div className="single-comment-div" key={index}>
                          {allUsers
                            .filter((user) => user.id === comment.commentUserID)
                            .map((user) => (
                              <div className="comment-pfp-username">
                                {user.imageURL.length > 0 ? (
                                  <img src={user.imageURL} />
                                ) : (
                                  <img src={nopfp} />
                                )}
                                <p
                                  className="status-p"
                                  onClick={() => {
                                    navigate("/" + user.username);
                                  }}
                                >
                                  {user.username}
                                </p>
                                <p className="status-time">
                                  {convertTime(comment.createdAt)}
                                </p>
                              </div>
                            ))}
                          <p className="comment-content-p">
                            {comment.commentContent}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="tancots">No comments yet!</p>
                    )}
                    <form
                      onSubmit={formik.handleSubmit}
                      className="add-comment-div"
                    >
                      <input
                        name="commentContent"
                        onBlur={formik.handleBlur}
                        onChange={formik.handleChange}
                        value={formik.values.commentContent}
                        placeholder="Your comment..."
                      />
                      <button type="submit">Add</button>
                    </form>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : status.length === 0 && ownProfile ? (
          <h5 className="welcome-h5">Welcome, {ownProfile.username}!</h5>
        ) : null}
      </div>
    </div>
  );
};

export default Statuses;
