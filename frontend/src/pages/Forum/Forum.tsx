import Tabbar from "../../components/Tabbar/Tabbar"
import "./Forum.scss"
import forum from "../../assets/forum-later.png"

const Forum = () => {
  return (
    <div className="forum-container">
      <div className="notice-container">
        <div className="notice-img"><img src={forum} alt="forum" /></div>
        <div className="notice-text">校园墙功能即将推出！</div>
      </div>
      <Tabbar />
    </div>
  )
}

export default Forum
