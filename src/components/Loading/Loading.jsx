import React from "react";
import "./Loading.css";
import loadinggif from "../../photos/Rolling@1x-1.9s-200px-200px.gif";

const Loading = () => {
  return (
    <div className="loading-window">
      <img src={loadinggif} />
    </div>
  );
};

export default Loading;
