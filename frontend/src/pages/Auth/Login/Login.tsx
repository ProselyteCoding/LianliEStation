import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useUserStore } from "../../../store";
import Navbar from "../../../components/Navbar/Navbar";
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'
import "./Login.scss";

const Login: React.FC = () => {
  const [inputs, setInputs] = useState({
    identifier: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login, isAuthenticated } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(inputs.identifier, inputs.password);
      message.success("登录成功！");
    } catch (err: any) {
      if (err.response) {
        message.error(err.response.data.message || "登录失败");
      } else {
        message.error("登录错误，请稍后重试");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/market");
    }
  }, [isAuthenticated]);

  const isFormComplete = Object.values(inputs).every((value) => value.trim() !== "");

  return (
    <div className="login-container">
      <Navbar title="登录" backActive={true} backPath="/user" />
      <div className="login-content">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label htmlFor="identifier">用户名或邮箱</label>
            <input
              required
              type="text"
              name="identifier"
              id="identifier"
              value={inputs.identifier}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="password">密码</label>
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
          <button type="submit" className="submit-btn" disabled={!isFormComplete}>登录</button>
          <div className="login-links">
            <Link className="link" to="/auth/register">
              立即注册
            </Link>
            <Link className="link" to="/user/settings/reset/password">
              忘记密码
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
