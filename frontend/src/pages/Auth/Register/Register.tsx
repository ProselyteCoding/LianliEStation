import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useUserStore } from "../../../store";
import Navbar from "../../../components/Navbar/Navbar";
import "./Register.scss";
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'

const Register: React.FC = () => {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });

  const navigate = useNavigate();
  const { register } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (inputs.password !== inputs.confirmPassword) {
        message.error("密码不一致");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(inputs.email)) {
        message.error("请输入有效的邮箱地址");
        return;
      }
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(inputs.username)) {
        message.error("用户名不符合要求");
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}/.test(inputs.password)) {
        message.error("密码不符合要求");
        return;
      }

      const userData = {
        email: inputs.email,
        password: inputs.password,
        username: inputs.username
      };

      await register(userData);
      message.success("注册成功！正在跳转到登录页面...");
      setTimeout(() => {
        navigate("/auth/login");
      }, 1000);
    } catch (err: any) {
      if (err.response) {
        message.error(err.response.data.message || "注册失败");
      } else {
        message.error("发生未知错误，请稍后重试");
      }
    }
  };

  const isFormComplete = Object.values(inputs).every((value) => value.trim() !== "");

  return (
    <div className="register-container">
      <Navbar title="注册" backActive={true} backPath="/auth/login" />
      <div className="register-content">
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label htmlFor="email">邮箱（用于登录及账号操作）</label>
            <input
              required
              type="text"
              name="email"
              id="email"
              value={inputs.email}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="username">用户名（3~16位字母、数字或下划线）</label>
            <input
              required
              type="text"
              name="username"
              id="username"
              value={inputs.username}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="password">密码（至少含1个大写字母、1个数字，长度≥8）</label>
            <input
              required
              type="password"
              name="password"
              id="password"
              value={inputs.password}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              required
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={inputs.confirmPassword}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={!isFormComplete}>注册</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
