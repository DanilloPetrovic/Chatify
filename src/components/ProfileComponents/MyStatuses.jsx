import React, { useState, useEffect } from "react";
import { auth, db, getAllUsers } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import nopfp from "../../photos/nopfp.png";
import unlike from "../../photos/Untitled design (6).png";
import like from "../../photos/Untitled design (7).png";
import comment from "../../photos/Untitled design (8).png";
import trash from "../../photos/Untitled design (9).png";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";

const MyStatuses = () => {
  const [user, setUser] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);
  const [myStatuses, setMyStatuses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [commentsOpenStatusId, setCommentsOpenStatusId] = useState(null);
  const [userFirestore, setUserFirestore] = useState(null);

  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getOwnProfile();
        getAllUsersHere();
      }
    });
    return () => unsubscribe();
  }, []);

  const getAllUsersHere = async () => {
    const allUsersRef = await getAllUsers();
    setAllUsers(allUsersRef);
  };

  const getOwnProfile = async () => {
    if (auth.currentUser) {
      const allUsers = await getAllUsers();
      const ownProfileRef = allUsers.find(
        (u) => u.username === auth.currentUser.displayName
      );

      const userFirestoreRef = allUsers.find((u) => u.username === username);

      setUserFirestore(userFirestoreRef);
      setOwnProfile(ownProfileRef);
    }
  };

  useEffect(() => {
    if (userFirestore) {
      const statusesCollectionRef = collection(db, "statuses");
      const unsubscribe = onSnapshot(statusesCollectionRef, (snapshot) => {
        const filteredData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const myStatusesRef = filteredData
          .filter((status) => status.userID === userFirestore.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt.toDate()) - new Date(a.createdAt.toDate())
          );

        setMyStatuses(myStatusesRef);
      });
      return () => unsubscribe();
    }
  }, [ownProfile]);

  const handleDelete = async (statusId) => {
    const userResponse = window.confirm(
      "Are you sure you want to delete this status?"
    );
    if (userResponse) {
      const statusDocRef = doc(db, "statuses", statusId);
      await deleteDoc(statusDocRef);
    }
  };

  const handleLike = async (statusId) => {
    if (ownProfile) {
      const statusDocRef = doc(db, "statuses", statusId);
      const currentStatus = myStatuses.find((s) => s.id === statusId);
      if (currentStatus) {
        const whoLiked = [...currentStatus.likes];
        const alreadyLiked = whoLiked.includes(ownProfile.id);
        const updatedLikes = alreadyLiked
          ? whoLiked.filter((id) => id !== ownProfile.id)
          : [...whoLiked, ownProfile.id];

        await updateDoc(statusDocRef, { likes: updatedLikes });
      }
    }
  };

  const toggleComments = (statusId) => {
    setCommentsOpenStatusId((prev) => (prev === statusId ? null : statusId));
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

  const formik = useFormik({
    initialValues: {
      commentContent: "",
    },
    validationSchema: Yup.object({
      commentContent: Yup.string().required("").max(100),
    }),
    onSubmit: async (values) => {
      if (ownProfile) {
        const commentDocRef = doc(db, "statuses", commentsOpenStatusId);
        const currentStatus = myStatuses.find(
          (s) => s.id === commentsOpenStatusId
        );

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
    <div className="my-statuses">
      <div className="my-status-h2-div">
        <h2 className="my-statuses-h2">My statuses</h2>
      </div>
      <div className="my-statuses-list">
        {myStatuses.length > 0 ? (
          myStatuses.map((status) => (
            <div key={status.id} className="status-div">
              <div className="pfp-username-status">
                <img
                  src={
                    userFirestore.imageURL.length > 0
                      ? userFirestore.imageURL
                      : nopfp
                  }
                  alt="Profile"
                />
                <p>{userFirestore.username}</p>
                <p className="status-time">{convertTime(status.createdAt)}</p>
              </div>

              <div className="status-content-div">
                <p style={{ textAlign: "start" }}>{status.statusContent}</p>
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
                {status.userID === ownProfile.id ? (
                  <button
                    onClick={() => handleDelete(status.id)}
                    className="delete-status"
                  >
                    <img src={trash} alt="Delete" />
                  </button>
                ) : null}
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
                    {status.comments.length > 0 ? (
                      status.comments.map((comment, index) => (
                        <div className="single-comment-div" key={index}>
                          {allUsers
                            .filter((user) => user.id === comment.commentUserID)
                            .map((user) => (
                              <div
                                className="comment-pfp-username"
                                key={user.id}
                              >
                                {user.imageURL.length > 0 ? (
                                  <img src={user.imageURL} alt="Commenter" />
                                ) : (
                                  <img src={nopfp} alt="No Profile" />
                                )}
                                <p
                                  className="status-p"
                                  onClick={() => {
                                    navigate("/" + user.username);
                                    window.location.reload();
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
        ) : ownProfile &&
          username === ownProfile.username &&
          myStatuses.length === 0 ? (
          <p className="tancots">You don't have any statuses yet!</p>
        ) : userFirestore &&
          username !== ownProfile.username &&
          myStatuses.length === 0 ? (
          <p className="tancots">This user don't have any statuses yet!</p>
        ) : null}
      </div>
    </div>
  );
};

export default MyStatuses;
