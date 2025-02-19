import React, { useState } from 'react'; // 确保导入 React 和 useState  
import Navbar from '../../components/Navbar/Navbar';  
import "./Messages.scss";  
import { useNavigate } from "react-router-dom";  
import Select, { components } from 'react-select';  
import messages from '../../assets/messages.png';  
import complain from '../../assets/complain.png';  
import violate from '../../assets/violate.png';  
import messageRead from '../../assets/message-read.png';  
import manage from '../../assets/settings.png';  

interface OptionType {  
  value: string;  
  label: string;  
  icon: string;  
}  

// 创建选项数组  
const options: OptionType[] = [  
  { value: '1', label: '全部', icon: messages },  
  { value: '2', label: '申诉', icon: complain },  
  { value: '3', label: '违规', icon: violate },  
];  

// 自定义选项组件  
const CustomOption = (props: any) => {  
  return (  
    <components.Option {...props} className='messages-option'>  
      <img  
        src={props.data.icon}  
        alt={props.data.label}  
        className="messages-icon"  
      />  
      <div className="messages-label">{props.data.label}</div>  
    </components.Option>  
  );  
};  

// 消息类型定义  
interface Message {  
  id: number;  
  response_type: string; // 'appeal' 或 'violation'  
  content: string;  
  read_status:string;  // 'unread' 或 'read' 
  created_at: string; // 格式为 '2022-01-01 12:00:00'  
}  

const Messages = () => {  
  const navigate = useNavigate();  

  const [messagesList, setMessagesList] = useState<Message[]>([  
    { id: 1, response_type: 'appeal', content: '申诉信息示例1', read_status: 'unread', created_at: '123' },  
    { id: 2, response_type: 'response', content: '回应信息示例1', read_status: 'read', created_at: '123' },  
    { id: 3, response_type: 'appeal', content: '申诉信息示例2', read_status: 'unread', created_at: '123' },  
    // 这里添加更多的消息对象...  
  ]);  

  const handleRead = () => {  
    // 处理已读逻辑  
  };  

  const handleManage = () => {  
    // 处理管理逻辑  
  };  

  return (  
    <div>  
      <Navbar title="信箱" backActive={true} backPath="user" />  
      <div className="messages-container">   
        {/* 使用 react-select */}  
        <div className="messages-control">  
          <div className="messages-control-item">  
            <Select  
              options={options}  
              components={{ Option: CustomOption }}  
              className="messages-select"  
              isSearchable={false} // 如果不需要搜索功能  
              defaultValue={options[0]}  
            />  
          </div>  
          <div className="messages-control-item" onClick={handleRead}>  
            <div className="messages-control-item-btn">  
              <img src={messageRead} alt="已读" /><button>已读</button>  
            </div>  
          </div>  
          <div className="messages-control-item" onClick={handleManage}>  
            <div className="messages-control-item-btn">  
              <img src={manage} alt="处理" /><button>处理</button>  
            </div>  
          </div>  
        </div>  
        <div className="messages-list">  
          {messagesList.map(message => (  
            <div key={message.id} className="messages-list-item">  
              <div className="message-type">{message.response_type}</div>   
              <div className="message-content">{message.content}</div>   
              <div className="message-status">{message.read_status}</div> 
              <div className="message-time">{message.created_at}</div> 
            </div>  
          ))}  
        </div>  
      </div>  
    </div>  
  );  
};  

export default Messages;