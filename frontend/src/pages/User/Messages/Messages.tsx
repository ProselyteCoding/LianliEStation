import { useEffect, useState, useRef } from "react";
import { Image, message } from "antd";
import Navbar from "../../../components/Navbar/Navbar";
import "./Messages.scss";
import { useRecordStore } from "../../../store";
import {
  ProductOutlined,
  MessageOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import { timeFormat } from "../../../utils/timeFormat";
import messages_read from "../../../assets/messages-read.svg";
import messages_unread from "../../../assets/messages-unread.svg";
import takePlace from "../../../assets/takePlace.png";

interface Conditions {
  type: string;
  read: boolean;
  manage: boolean;
}

const Messages = () => {
  // 三个筛选条件
  const [conditions, setConditions] = useState<Conditions>({
    type: "all", // 'appeal' 或 'response' 或 'all'
    read: false, // true/false
    manage: false, // true/false
  });

  const { appeals, responses, fetchResponses, searchAppeals, markResponse } =
    useRecordStore();

  // 申诉/回复类型
  //   interface Response {
  //   user_id: number;
  //   response_type: string;
  //   related_id: number;
  //   content: string;
  //   read_status: string;
  //   created_at: string;
  //   images: string[];
  //   image_count: number;
  // }
  // interface Appeal {
  //   author_id: number;
  //   goods_id: number;
  //   content: string;
  //   status: string;
  //   created_at: string;
  //   image_url: string[];
  // }

  // 当前显示的消息列表
  const [messagesList, setMessagesList] = useState<any[]>([]);
  // 初始状态消息列表
  const [initialMessagesList, setInitialMessagesList] = useState<any[]>([]);
  // 所有消息列表
  const [allMessagesList, setAllMessagesList] = useState<any[]>([]);

  // 不触发渲染的初始与全部消息列表(useRef实现，用于卸载前比较更新)
  const initialMessagesListRef = useRef<any[]>([]);
  const allMessagesListRef = useRef<any[]>([]);

  // 信息类型菜单选择
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "all" });
          }}
        >
          全部
        </div>
      ),
      icon: <ProductOutlined />,
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "appeal" });
          }}
        >
          申诉
        </div>
      ),
      icon: <SafetyOutlined />,
    },
    {
      key: "3",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "response" });
          }}
        >
          回复
        </div>
      ),
      icon: <MessageOutlined />,
    },
  ];

  useEffect(() => {
    const initList = async () => {
      await fetchResponses();
      await searchAppeals();
      const combinedMessages = [...appeals, ...responses];

      // 按照 created_at 进行排序
      combinedMessages.sort(
        (b, a) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 生成唯一的 key 值，顺序对应排序后的消息顺序
      const sortedMessagesWithKeys = combinedMessages.map((msg, index) => ({
        ...msg,
        key: `${index}`, // 生成唯一的 key
      }));

      setInitialMessagesList(sortedMessagesWithKeys); // 设置初始消息状态
      initialMessagesListRef.current = sortedMessagesWithKeys; // 保存持久化初始消息状态
      setAllMessagesList(sortedMessagesWithKeys); // 设置全部消息状态
      console.log("初始获取的全部消息:", sortedMessagesWithKeys);
    };

    // 初始化获取全部messages，不筛选，存入initialMessagesList
    initList();

    // 组件卸载时更新同步已读/未读信息
    return () => {
      // console.log("当前:",allMessagesListRef.current, "vs" ,"最初:",initialMessagesListRef.current);
      const changes = allMessagesListRef.current.filter((msg) => {
        const initialMessage = initialMessagesListRef.current.find(
          (imsg) => (imsg.id === msg.id && (("response_type" in imsg && "response_type" in msg) || ("type" in imsg && "type" in msg)) && (imsg.read_status !== msg.read_status))
        );
        return initialMessage && initialMessage.read_status !== msg.read_status;
      });

      if (changes.length > 0) {
        const updateData = {
          messages: changes.map((msg) => ({
            message_id: msg.id,
            type: `${msg.response_type ? "response" : "appeal"}`,
            status: msg.read_status,
          })),
        };

        markResponse(updateData);
        // console.log("已更新消息状态:", changes);
      }

      // console.log("组件卸载");
    };
  }, []);

  useEffect(() => {
    const handleList = async (type: string, read: boolean) => {
      let combinedMessages: any[] = allMessagesList;
      // 刷新消息列表
      if (type === "response") {
        // 筛选为回复消息
        combinedMessages = combinedMessages.filter(
          (msg) => "response_type" in msg
        );
      } else if (type === "appeal") {
        // 筛选为申诉消息
        combinedMessages = combinedMessages.filter((msg) => "type" in msg);
      }

      if (read) {
        // 筛选为已读消息
        combinedMessages = combinedMessages.filter(
          (msg) => msg.read_status === "read"
        );
      } else {
        // 筛选为未读消息
        combinedMessages = combinedMessages.filter(
          (msg) => msg.read_status === "unread"
        );
      }

      // 按照 created_at 进行排序
      combinedMessages.sort(
        (b, a) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 生成唯一的 key 值，顺序对应排序后的消息顺序
      const sortedMessagesWithKeys = combinedMessages.map((msg, index) => ({
        ...msg,
        key: `${index}`, // 生成唯一的 key
      }));

      console.log("筛选时的消息列表:", sortedMessagesWithKeys);
      setMessagesList(sortedMessagesWithKeys);
    };

    if (initialMessagesList.length > 0) {
      handleList(conditions.type, conditions.read);
      console.log("筛选后的消息列表:", messagesList);
    }
  }, [conditions, initialMessagesList, allMessagesList]);

  return (
    <div>
      <Navbar title="信箱" backActive={true} backPath="/user" />
      <div className="messages-container">
        <div className="messages-control">
          <div className="messages-control-item">
            <Dropdown menu={{ items }}>
              <a onClick={(e) => e.preventDefault()}>
                <ProductOutlined
                  style={{ width: "20px", height: "20px", marginRight: "5px" }}
                />
                全部
              </a>
            </Dropdown>
          </div>
          <div
            className="messages-control-item"
            onClick={() => {
              setConditions({ ...conditions, read: !conditions.read });
            }}
          >
            <div className="messages-control-item-btn">
              <img
                src={`${
                  conditions.read === false ? messages_unread : messages_read
                }`}
                alt="未读/已读"
              />
              <button>{conditions.read === false ? "未读" : "已读"}</button>
            </div>
          </div>
        </div>

        <div className="messages-list">
          {messagesList.map((message) => (
            <div key={message.key} className="messages-list-item">
              {!message.response_type ? (
                <div className="message-appeal">
                  <div className="appeal-row">
                    <div className="appeal-type">申诉</div>
                    <div className="appeal-status">
                      {message.status === "pending"
                        ? "处理中"
                        : message.status === "resolved"
                        ? "已解决"
                        : "已拒绝"}
                    </div>
                    <div className="appeal-title">《{message.title}》</div>
                    {conditions.read === false ? (
                      <button
                        className="response-read-control"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("type" in msg && "type" in message)) {
                                return { ...msg, read_status: "read" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为已读
                      </button>
                    ) : (
                      <button
                        className="response-unread-control"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("type" in msg && "type" in message)) {
                                return { ...msg, read_status: "unread" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为未读
                      </button>
                    )}
                    <div className="appeal-time">
                      {timeFormat(message.created_at, "YYYY-MM-DD HH")}
                    </div>
                  </div>
                  <div className="appeal-row">
                    <div className="appeal-content">{message.content}</div>
                    <Image
                      className="appeal-image"
                      src={takePlace}
                      alt="图片"
                    ></Image>
                  </div>
                </div>
              ) : (
                <div className="message-response">
                  <div className="response-row">
                    {message.response_type === "violation" ? (
                      <div className="response-type-violation">违规</div>
                    ) : (
                      <div className="response-type-response">处理</div>
                    )}
                    <div className="response-title">《{message.title}》</div>
                    {conditions.read === false ? (
                      <button
                        className="response-read-control"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("response_type" in msg && "response_type" in message)) {
                                return { ...msg, read_status: "read" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为已读
                      </button>
                    ) : (
                      <button
                        className="response-unread-control"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("response_type" in msg && "response_type" in message)) {
                                return { ...msg, read_status: "unread" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为未读
                      </button>
                    )}

                    <div className="response-time">
                      {timeFormat(message.created_at, "YYYY-MM-DD HH")}
                    </div>
                  </div>
                  <div className="response-row">
                    <div className="response-content">{message.content}</div>
                    <Image
                      className="response-image"
                      src={takePlace}
                      alt="图片"
                    ></Image>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
