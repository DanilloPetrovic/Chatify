import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import LogIn from "./pages/LogIn/LogIn";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/EditProfile/EditProfile";
import Chat from "./pages/Chat/Chat";
import Group from "./pages/Group/Group";
import GroupInfo from "./pages/GroupInfo/GroupInfo";
import EditGroup from "./pages/EditGroup/EditGroup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/:username" element={<Profile />} />
        <Route path="/edit-profile/:username" element={<EditProfile />} />
        <Route path="/chat/:username" element={<Chat />} />
        <Route path="/group/:groupname" element={<Group />} />
        <Route path="/group/:groupname/info" element={<GroupInfo />} />
        <Route path="/group/:groupname/edit" element={<EditGroup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
