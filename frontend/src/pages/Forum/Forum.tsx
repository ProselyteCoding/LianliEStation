import React from "react";
import "./Forum.scss";
import Navbar from "../../components/Navbar/Navbar";
import Tabbar from "../../components/Tabbar/Tabbar";

const Forum=()=>{
    return (
        <div className="forum-container">
            <div className="navbar">
                <Navbar title="校园墙" backActive={false}/>
            </div>

            <div className="content">

            </div>

            <div className="tabbar">
                <Tabbar />
            </div>
        </div>
    )
}

export default Forum