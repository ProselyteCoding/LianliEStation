[TOC]

# 启动说明

## 环境变量

该后端程序默认启动在 `localhost:5000` 端口
数据库连接默认为

```js
host: "localhost",
port: 3306,
user: root,
password: root,
database: makertplace,
```

使用 `dotenv` 开发依赖进行环境变量管理，如以上环境有改动，请自行在 `server` 根目录下新建`.env`文件，用以下格式修改(SECRET_KEY 随你修改，也可以问 fanzdstar 设的是啥,最后两个也可以填入您自己的邮箱账户和邮箱授权码，也可以问 fanzdstar 设的是啥)

```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
PORT=
SECRET_KEY=
EMAIL_USER=
EMAIL_PASS=
API_KEY=
```

使用`redis`进行缓存管理，请在`.env`新建如下字段，提供项目`redis`服务所在的主机 ip，端口及密码

```
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```

其中`REDIS_HOST`默认为`localhost`，`REDIS_PORT`默认为`6379`，`REDIS_PASSWORD`默认为空

## Redis 环境

若不知道**如何在本地 windwos 环境下**启动`Redis`服务，请自行寻找解决方案方案或参看以下内容[如何在 windows 中使用 Docker —— 以 Redis 为例]([如何在 windows 中使用 Docker —— 以 Redis 为例 | kpmark](http://60.205.131.158/blog/2025/02/03/2025-2-3/))

在启动后端服务后，使用`node redis.test.js`即可测试该服务是否正确连接至后端

## 临时管理员账户

```json
"identifier":"胡骏阳",
"password":"123456",
"role":"admin"
```

## 数据库环境

代码中并没有新建数据库的命令，请确保本地数据库中存在`marketplace`库，示例 api 中的 users 表初始化代码如下，仅供测试

```sql
use marketplace;
CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nickname` VARCHAR(50) NOT NULL DEFAULT 'DUTers',
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100),
    `password` VARCHAR(255) NOT NULL,
    `qq_id` VARCHAR(100) NOT NULL,
    `campus_id` INT NOT NULL,
    `credit` INT NOT NULL DEFAULT 100,
    `avatar` VARCHAR(255) NOT NULL DEFAULT '/uploads/default.png',
    `banner_url` VARCHAR(255) NOT NULL DEFAULT '/uploads/default_banner.png',
    `background_url` VARCHAR(255) NOT NULL DEFAULT '/uploads/default_background.png',
    `theme_id` INT NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email_unique` (`email`),
    UNIQUE KEY `username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT,
    `post_type` ENUM('receive', 'sell') NOT NULL,
    `tag` VARCHAR(255),
    `author_id` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
    `price` DECIMAL(10, 2) DEFAULT 0.00,
    `campus_id` INT NOT NULL,
    `likes` INT DEFAULT 0,
    `complaints` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `appeals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `author_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('pending', 'resolved', 'deleted') DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `post_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_favorites` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_post` (`user_id`, `post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `appeal_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `appeal_id` INT NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `responses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,           -- 自增主键
    `user_id` INT NOT NULL,                        -- 接收回复的用户ID
    `response_type` ENUM('appeal', 'violation') NOT NULL, -- 回复类型：申诉回复或违规通告回复
    `related_id` INT NOT NULL,                     -- 关联的申诉或违规通告记录ID
    `content` TEXT NOT NULL,                       -- 管理员的回复内容
    `read_status` ENUM('unread', 'read') NOT NULL DEFAULT 'unread', -- 回复状态，默认为未读
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP -- 创建时间，默认当前时间
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE admins (
  `id` INT AUTO_INCREMENT PRIMARY KEY,  -- 管理员 ID
  `username` VARCHAR(100) NOT NULL,     -- 管理员用户名
  `password` VARCHAR(255) NOT NULL,     -- 加密后的密码
  `email` VARCHAR(100) NOT NULL
);

CREATE TABLE `campus_wall_posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author_id` INT NOT NULL,
    `campus_id` INT NOT NULL,
    `status` ENUM('active', 'deleted') DEFAULT 'active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `campus_wall_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表数据插入示例
INSERT INTO `users` (`nickname`, `username`, `email`, `password`, `qq_id`, `campus_id`, `credit`, `avatar`)
VALUES
('User1', 'user1', 'user1@example.com', 'hashed_password1', '123456789', 1, 100, '/uploads/avatar1.png'),
('User2', 'user2', 'user2@example.com', 'hashed_password2', '987654321', 2, 100, '/uploads/avatar2.png');

-- 帖子表数据插入示例
INSERT INTO `posts` (`author_id`, `title`, `content`, `post_type`, `tag`, `created_at`, `status`, `price`, `campus_id`)
VALUES
(1, '二手数学分析教材', '浙江大学版教材，无字迹破损，附习题解答', 'sell', '教材', '2025-01-01 10:00:00', 'active', 35.50, 1),
(2, '九成新机械键盘', 'Cherry MX红轴，RGB背光，包装齐全', 'sell', '电子产品', '2025-01-02 11:00:00', 'active', 299.00, 1),
(3, '开发区校区代取快递', '大件3元/件，小件2元/件（20:00前可预约）', 'receive', '服务', '2025-01-03 12:00:00', 'active', 2.00, 1);

-- 申诉表数据插入示例
INSERT INTO `appeals` (`author_id`, `post_id`, `content`, `status`, `created_at`)
VALUES
(1, 5, '帖子内容不符合事实，请求审核', 'pending', '2024-03-01 14:30:00'),
(2, 8, '已与发布者协商解决', 'resolved', CURRENT_TIMESTAMP),
(3, 12, '误删帖子，申请恢复', 'pending', '2025-01-15 09:00:00');

-- 帖子图片表数据插入示例
INSERT INTO `post_images` (`post_id`, `image_url`, `created_at`)
VALUES
(1, '/uploads/images/image1.jpg', '2025-01-01 10:30:00');

-- 用户收藏表数据插入示例
INSERT INTO `user_favorites` (`user_id`, `post_id`, `created_at`)
VALUES
(1, 1, '2025-01-01 11:00:00'),
(2, 3, '2025-01-02 13:00:00'),
(1, 4, '2025-01-03 14:00:00');

-- 插入校园墙帖子示例数据
INSERT INTO `campus_wall_posts` (`title`, `content`, `author_id`, `campus_id`, `created_at`)
VALUES
('期末复习小组招募', '正在找考研政治的复习小组，一起打卡学习，互相监督。', 1, 1, '2025-01-15 08:30:00'),
('晨跑小伙伴招募', '每天早上6:30体育场集合，欢迎加入晨跑队伍！', 2, 1, '2025-01-15 09:00:00'),
('图书馆捡到一张学生卡', '今天在图书馆三楼捡到一张学生卡，失主请联系我认领。', 1, 2, '2025-01-15 14:20:00');

-- 插入对应的图片数据
INSERT INTO `campus_wall_images` (`post_id`, `image_url`, `created_at`)
VALUES
(1, '/uploads/wall/study_group.jpg', '2025-01-15 08:31:00'),
(2, '/uploads/wall/morning_run1.jpg', '2025-01-15 09:01:00'),
(2, '/uploads/wall/morning_run2.jpg', '2025-01-15 09:01:00'),
(3, '/uploads/wall/student_card.jpg', '2025-01-15 14:21:00');
```

##

使用`node app.js` 或者 `npm start`启动后端
**推荐使用 nodemon app.js**启动

# API 文档

## 说明

上传图片时请务必使用 `multipart/form-data` 的请求体格式，非图片请务必使用 `application/json` 的请求体格式

主题图片等不常改动的信息**强烈建议**使用 `localStorage` 缓存在前端，以减少数据库压力

如果有未使用的 api 请告知后端删除

## users

### 获取所有用户信息(仅管理员)

- **方法:** GET
- **路径:** `/api/users/`
- **功能:** 获取数据库中所有用户的基本信息，仅用于测试目的。
- **请求参数:** token
- **成功响应:**
  - **状态码:** 200
  - **内容:** 用户信息列表，包含 email, qq_id, nickname, username, id, campus_id, credit
- **错误响应:**
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

### 通过 QQ 号搜索用户信息（管理员专用）

**方法:** POST  
**路径:** `/api/users/searchByQQ`  
**功能:** 允许管理员通过 QQ 号码查询用户信息，需提供 `Authorization` 头部。

- **请求参数:**

  - `qq_id`: 用户的 QQ 号码，字符串，必填。

- **请求头:**

  - `Authorization`: `Bearer <JWT_TOKEN>`

- **成功响应:**

  - **状态码:** 200
  - **内容:**
    ```json
    {
      "id": 1,
      "nickname": "示例用户",
      "email": "example@example.com",
      "qq_id": "12345678",
      "username": "user123",
      "credit": 100
    }
    ```

- **错误响应:**
  - **状态码:** 400
    - **内容:**
      ```json
      { "message": "缺少 qq_id 参数" }
      ```
  - **状态码:** 401
    - **内容:**
      ```json
      { "message": "未提供 Token" }
      ```
    - 或
      ```json
      { "message": "Token 无效" }
      ```
  - **状态码:** 403
    - **内容:**
      ```json
      { "message": "您没有权限执行此操作" }
      ```
  - **状态码:** 404
    - **内容:**
      ```json
      { "message": "没有找到匹配的用户" }
      ```
  - **状态码:** 500
    - **内容:**
      ```json
      { "message": "服务器错误" }
      ```

### 用户注册

- **方法:** POST
- **路径:** `/api/users/register`
- **功能:** 允许新用户注册。检查邮箱和用户名是否已被注册，未注册则将新用户信息插入数据库。
- **请求体:** (使用 `application/json`)

  - **请求参数:**
    - `nickname`: 用户昵称，字符串，可选，默认为 'DUTers'。
    - `email`: 用户邮箱，字符串，必需。
    - `password`: 用户密码，字符串，必需。
    - `qq_id`: 用户的 QQ 号码，字符串，必需。
    - `username`: 用户名，字符串，必需。
    - `campus_id`: 用户所在校区，整型，必需。

- **成功响应:**
  - **状态码:** 201
  - **内容:** `{ "message": "注册成功" }`
- **错误响应:**
  - **状态码:** 400
  - **内容:** `{ "message": "缺少必要参数" }` 或 `{ "message": "邮箱已被注册" }` 或 `{ "message": "用户名已被注册" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

### 管理员注册(暂时开放)

- **URL**: `/api/users/admin/register`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`

| 参数       | 类型     | 描述         | 必填 |
| ---------- | -------- | ------------ | ---- |
| `username` | `string` | 管理员用户名 | 是   |
| `password` | `string` | 管理员密码   | 是   |
| `email`    | `string` | 管理员邮箱   | 是   |

```json
{
  "username": "admin123",
  "password": "adminpassword123",
  "email": "admin123@example.com"
}
```

### 用户(管理员)登录

- **URL**: `/login`
- **方法**: `POST`
- **请求头**:
  - `Content-Type: application/json`

| 参数         | 类型     | 描述         | 必填 |
| ------------ | -------- | ------------ | ---- |
| `identifier` | `string` | 用户名或邮箱 | 是   |
| `password`   | `string` | 用户密码     | 是   |

```json
{
  "identifier": "user123",
  "password": "password123"
}
```

- **成功响应**:
  - **状态码**: `200 OK`
  - **响应体**:

```json
{
  "message": "登录成功",
  "token": "JWT_Token_Here",
  "isAdmin": false
}
```

- **失败响应**:
  - **状态码**: `400 Bad Request`
    - **描述**: 缺少必要的参数或身份无效。
    - **响应体**:

```json
{
  "message": "请正确输入用户名、密码和身份"
}
```

- **状态码**: `401 Unauthorized`
  - **描述**: 用户名/邮箱或密码错误，或者管理员身份验证失败。
  - **响应体**:

```json
{
  "message": "用户名/邮箱或密码错误"
}
```

- **状态码**: `403 Forbidden`
  - **描述**: 无权限访问。
  - **响应体**:

```json
{
  "message": "您没有权限登录"
}
```

- 功能

  - 验证 `identifier`（可以是用户名或邮箱）和 `password` 的匹配。
  - 根据身份返回是否为管理员，并生成相应的 JWT token。
  - 在登录成功后，返回 `isAdmin` 字段标识用户身份，前端可以根据该字段进行相应的重定向或显示。

  - 登录成功后，前端可以通过 `isAdmin` 判断用户身份，如果是管理员，则跳转到管理员页面，否则跳转到普通用户页面。

  - 返回的 JWT token 中包含用户身份信息，可以用于后续身份验证。

### 获取当前用户信息

- **方法:** GET
- **路径:** `/api/users/profile`
- **功能:** 获取当前登录用户的个人信息，包括昵称、用户名、QQ 号、邮箱和信用分。需要提供 `Authorization` 头部。
- **请求头**:

  - `Authorization`: `Bearer <JWT_TOKEN>`

- 成功响应:
  - **状态码:** 200
  - **内容:**
    ```json
    {
      "nickname": "用户昵称",
      "username": "用户名",
      "campus_id": 1,
      "qq": "QQ号",
      "email": "用户邮箱",
      "credit": 100
    }
    ```
- 错误响应:

  - **状态码:** 400  
    **内容:**
    ```json
    { "message": "缺少必要参数" }
    ```
  - **状态码:** 401  
    **内容:**
    ```json
    { "message": "未提供 Token" }
    ```
  - **状态码:** 401  
    **内容:**

    ```json
    { "message": "Token 无效" }
    ```

  - **状态码:** 404  
    **内容:**

    ```json
    { "message": "用户不存在" }
    ```

  - **状态码:** 500  
    **内容:**
    ```json
    { "message": "服务器错误" }
    ```

- **Authorization 头部**：需要携带有效的 JWT token 用于身份验证。
- **返回数据**：用户的个人信息包括昵称、用户名、QQ 号、邮箱和信用分。

### 删除当前用户账户

- **方法:** DELETE
- **路径:** `/api/users/profile`
- **功能:** 删除当前登录用户的账户，需提供 `Authorization` 头部。
- **请求头:**
  - `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "账户已删除" }`
- **错误响应:**
  - **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
  - **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

### 更改当前用户信息

**方法:** PUT
**路径:** `/api/users/profile`
**功能:** 更新当前登录用户的基本信息（昵称、QQ 号、校区），需提供 `Authorization` 头部。

- **请求体:** (使用 `application/json`)

  - **请求参数:**
    - `nickname`: 用户昵称，字符串，必须。
    - `qq_id`: 用户的 QQ 号码，字符串，必需。
    - `campus_id`: 用户所在校区，整型，必需。

- **请求头:**
  - `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "用户信息已更新" }`
- **错误响应:**
- **状态码:** 400
  - **内容:** `{ "message": "缺少必要参数" }`
  - **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
  - **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
  - **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

---

### 请求验证码

- **方法:** `POST`
- **路径:** `/api/users/RequestVerification`
- **功能:** 发送验证码到指定邮箱，用户通过该验证码修改密码。
- **请求参数:**
  - `email` (必需): 用户注册时使用的邮箱地址，字符串。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "验证码已发送，请检查您的邮箱" }`
- **错误响应:**
  - **状态码:** 400
    - **内容:** `{ "message": "请提供有效的邮箱地址" }`
  - **状态码:** 500
    - **内容:** `{ "message": "发送验证码失败，请稍后重试" }`
- **备注:**
  - 服务器会将验证码发送到用户指定的邮箱，用户需在规定时间内使用该验证码修改密码。

---

### 修改密码

- **方法:** `PUT`
- **路径:** `/api/users/change-password`
- **功能:** 通过验证码验证邮箱并允许用户修改密码。
- **请求参数:**
  - `email` (必需): 用户注册时使用的邮箱地址，字符串。
  - `newPassword` (必需): 用户想要设置的新密码，字符串。
  - `verificationCode` (必需): 用户通过邮箱收到的验证码，字符串。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "密码修改成功" }`
- **错误响应:**
  - **状态码:** 400
    - **内容:** `{ "message": "请输入有效的邮箱、验证码和新密码" }`
  - **状态码:** 401
    - **内容:** `{ "message": "验证码错误或已过期" }`
  - **状态码:** 500
    - **内容:** `{ "message": "修改密码失败，请稍后重试" }`
- **备注:**
  - 用户需要输入邮箱、验证码以及新密码来修改密码。
  - 确保提供的验证码与发送到邮箱中的验证码匹配，且未过期。

---

### 修改用户主题

- **方法:** PUT
- **路径:** `/api/users/change-theme`
- **功能:** 更新当前登录用户的主题设置，需提供 `Authorization` 头部。
- **请求体:** (使用 `multipart/form-data`)

  - **请求参数:**
  - `theme_id`: 主题 ID，整型，必需。

- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
- **状态码:** 200
- **内容:** `{ "message": "更新成功" }`
- **错误响应:**
- **状态码:** 400
  - **内容:** `{ "message": "缺少必要参数" }`
- **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
- **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
- **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`

---

### 修改用户背景

- **方法:** PUT
- **路径:** `/api/users/change-background`
- **功能:** 更新当前登录用户的背景图片，需提供 `Authorization` 头部。
- **请求体:** (使用 `multipart/form-data`)

  - **请求参数:**
  - `image`: 背景图片文件，必需。

- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
- **状态码:** 200
- **内容:** `{ "message": "更新成功" }`
- **错误响应:**
- **状态码:** 400
  - **内容:** `{ "message": "请选择要上传的背景图片" }`
- **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
- **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
- **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
- **备注:**
- 上传新背景图片后，旧的非默认背景图片将被自动删除
- 默认背景图片路径为 `/uploads/default_background.png`

---

### 修改用户 Banner 图

- **方法:** PUT
- **路径:** `/api/users/change-banner`
- **功能:** 更新当前登录用户的 banner 图片，需提供 `Authorization` 头部。
- **请求体:** (使用 `multipart/form-data`)

  - **请求参数:**
  - `image`: banner 图片文件，必需。

- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
- **状态码:** 200
- **内容:** `{ "message": "更新成功" }`
- **错误响应:**
- **状态码:** 400
  - **内容:** `{ "message": "请选择要上传的 banner 图片" }`
- **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
- **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
- **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
- **备注:**
- 上传新 banner 图片后，旧的非默认 banner 图片将被自动删除
- 默认 banner 图片路径为 `/uploads/default_banner.png`

---

### 修改用户头像

- **方法:** PUT
- **路径:** `/api/users/change-avatar`
- **功能:** 更新当前登录用户的 banner 图片，需提供 `Authorization` 头部。
- **请求体:** (使用 `multipart/form-data`)

  - **请求参数:**
  - `image`: banner 图片文件，必需。

- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
- **状态码:** 200
- **内容:** `{ "message": "更新成功" }`
- **错误响应:**
- **状态码:** 400
  - **内容:** `{ "message": "请选择要上传的头像图片" }`
- **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
- **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
- **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
- **备注:**
- 上传新头像后，旧的非默认头像将被自动删除
- 默认头像图片路径为 `/uploads/default.png`

---

### 获取用户主题设置

- **方法:** GET
- **路径:** `/api/users/get-theme`
- **功能:** 获取当前登录用户的主题、背景图片和 banner 图片设置，需提供 `Authorization` 头部。
- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **成功响应:**
- **状态码:** 200
- **内容:**
  ```json
  {
    "theme_id": <主题ID>,
    "background_url": <背景图片URL>,
    "banner_url": <banner图片URL>,
    "avatar": <头像图片URL>
  }
  ```
- **错误响应:**
- **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
- **状态码:** 401
  - **内容:** `{ "message": "Token 无效" }`
- **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
- **备注:**
- **建议前端使用 localStorage 缓存这些数据，避免频繁请求服务器**

### 修改用户信用值(仅管理员)

**方法:** PUT  
**路径:** `/api/users/updateCredit`  
**功能:** 允许管理员通过 QQ 号码修改用户的信用值，需提供 `Authorization` 头部。

- **请求参数:**

  - `qq_id` (字符串，必填): 用户的 QQ 号码。
  - `credit` (整数，必填): 需要更新的信用值。

- **请求头:**

  - `Authorization`: `Bearer <JWT_TOKEN>`

- **成功响应:**

  - **状态码:** 200
  - **内容:**
    ```json
    { "message": "信用值已更新" }
    ```

- **错误响应:**
  - **状态码:** 400
  - **内容:**
    ```json
    { "message": "缺少必要参数" }
    ```
  - **状态码:** 401
  - **内容:**
    ```json
    { "message": "未提供 Token" }
    ```
  - 或
    ```json
    { "message": "Token 无效" }
    ```
  - **状态码:** 403
  - **内容:**
    ```json
    { "message": "您没有权限执行此操作" }
    ```
  - **状态码:** 404
  - **内容:**
    ```json
    { "message": "没有找到匹配的用户" }
    ```
  - **状态码:** 500
  - **内容:**
    ```json
    { "message": "服务器错误" }
    ```

### 根据用户 ID 查询用户基本信息

- **方法:** `GET`
- **路径:** `/api/users/userInfo/:user_id`
- **功能:** 根据用户 ID 获取用户的 `qq_id`、`credit` 和 `avatar` 信息。
- **请求参数：**`user_id`: 用户的 ID，整型，必须。

- **成功响应:**
  状态码: `200`
  内容:

  ```json
  {
    "qq_id": "123456789",
    "credit": 500,
    "avatar": "/uploads/avatar123.jpg"
  }
  ```

  - `qq_id`: 用户的 QQ 号码，字符串。
  - `credit`: 用户的信用分，整型。
  - `avatar`: 用户的头像路径，字符串。

- **错误响应:**

  - **状态码:** `400`
  - **内容:** `{ "message": "缺少用户 ID" }`
  - **状态码:** `404`
  - **内容:** `{ "message": "用户不存在" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "服务器错误" }`

- **示例请求：**

```bash
GET /api/users/userInfo/123
```

（假设 `123` 为用户的 ID）

- **示例响应：**

```json
{
  "qq_id": "123456789",
  "credit": 500,
  "avatar": "/uploads/avatar123.jpg"
}
```

## posts

### 获取帖子列表

- **方法:** GET
- **路径:** `/api/posts/`
- **功能:** 获取数据库中所有未删除的帖子及其图片。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回所有未删除的帖子列表，包含每个帖子的详细信息和相关的图片 URL。
  - **示例:**
    ```json
    [
      {
        "id": 1,
        "title": "二手书转让",
        "content": "出售二手书籍，八成新。",
        "author_id": 1,
        "created_at": "2023-01-01T12:00:00",
        "status": "active",
        "price": 50,
        "campus_id": 1,
        "post_type": "sale",
        "tag": "书籍",
        "images": ["/uploads/1738204953485-tios2b1p2dl.png", "/uploads/1738204953486-tios2b1p2dl.jpg"]
      }
    ]
    ```
- **错误响应:**
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

### 新增帖子

- **方法:** POST
- **路径:** `/api/posts/publish`
- **功能:** 发布新帖子。用户必须在请求头中携带有效的 JWT Token 以验证身份，帖子数据（标题、内容、价格、校区 ID、帖子类型、标签）通过表单数据提交。图片文件（最多 5 张）可选上传，系统会将上传的图片路径保存到数据库。
- **请求头:**
  - `Authorization`: 必填，格式为 `Bearer <JWT_TOKEN>`
- **请求体:** (使用 `multipart/form-data`)

  - **必填字段:**
    - `title` (String): 帖子标题
    - `content` (String): 帖子内容
    - `campus_id` (Integer): 校区 ID
    - `post_type` (String): 帖子类型（如 "sell" 或 "receive"）
  - **可选字段:**
    - `price` (Number): 帖子价格（默认为 0）
    - `tag` (String): 帖子标签
    - `images` (File): 文件类型字段，最多可上传 5 张图片

- **成功响应:**

  - **状态码:** 201
  - **内容:**
    ```json
    {
      "message": "发布成功",
      "image_urls": ["/uploads/1738204953485-filename1.jpg", "/uploads/1738204953490-filename2.jpg"]
    }
    ```
    如果没有上传图片，则返回的 `image_urls` 数组为空。

- **错误响应:**
  - **状态码:** 401
    - 内容: `{ "message": "未提供 Token" }` 或 `{ "message": "无效的 Token" }`
  - **状态码:** 400
    - 内容: `{ "message": "缺少必要参数" }`
  - **状态码:** 500
    - 内容: `{ "message": "服务器错误" }`

### 删除帖子

- **方法:** DELETE
- **路径:** `/api/posts/:post_id`
- **功能:** 删除指定帖子（软删除，将 `status` 字段设置为 `'deleted'`），使用 `Token` 验证用户身份，确保只有帖子的作者可以删除帖子。
- **请求参数:**
  - `post_id`: 帖子的 ID，整数，必填（作为 URL 参数传递）。
  - `Authorization`: 请求头中的 `Token`，字符串，必填，格式为 `Bearer <token>`，用于验证用户身份。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "帖子已标记为删除" }`
- **错误响应:**

  - **状态码:** 400
  - **内容:** `{ "message": "缺少必要参数" }`
  - **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }` 或 `{ "message": "无效的 Token" }`
  - **状态码:** 404
  - **内容:** `{ "message": "帖子未找到或用户无权删除" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

  - 示例：

  - 请求：

```http
DELETE http://localhost:5000/api/posts/1
Authorization: Bearer <your_token_here>
```

### 获取帖子详情

- **方法:** GET
- **路径:** `/api/posts/byID/:post_id`
- **功能:** 获取指定帖子的详细信息及相关的图片 URL。
- **请求参数:**
  - `post_id`: 帖子 ID，整型，必填。
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回指定帖子及相关图片信息。
  - **示例:**
    ```json
    {
      "post": {
        "id": 1,
        "title": "二手书转让",
        "content": "出售二手书籍，八成新。",
        "author_id": 1,
        "created_at": "2023-01-01T12:00:00",
        "status": "active",
        "price": 50,
        "campus_id": 1,
        "post_type": "sale",
        "tag": "书籍",
        "likes": 1,
        "complaints": 0
      },
      "images": ["/uploads/1738204953485-tios2b1p2dl.png", "/uploads/1738204953486-tios2b1p2dl.jpg"]
    }
    ```
- **错误响应:**

  - **状态码:** 400
  - **内容:** `{ "message": "缺少帖子 ID" }`
  - **状态码:** 404
  - **内容:** `{ "message": "帖子未找到或已被删除" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

  - 注意事项

1. **图片上传**：上传的图片存储在服务器的 `public/uploads/` 文件夹中，并且会返回图片的 URL。前端可以通过`http://localhost:5000/uploads/xxx`访问图片，xxx 文件存储在 images 数组里。
2. **Token 验证**：需要使用 JWT Token 验证用户身份。在发送请求时，需要在请求头中提供有效的 Token（`Authorization: Bearer <token>`）。
3. **软删除**：删除帖子时并不从数据库中删除数据，而是通过更新 `status` 字段为 `'deleted'` 来实现软删除。

### 查询帖子（按条件）

- **方法:** GET
- **路径:** `/api/posts/search`
- **功能:** 根据指定条件查询帖子，并返回相关的图片信息。支持根据标题、状态、校区 ID、帖子类型、标签、价格等进行筛选，支持使用关键字在 title 和 content 中进行模糊搜索。
- **请求参数:**
  - `title`: 帖子标题，字符串，可选。
  - `status`: 帖子的状态（'active', 'inactive', 'deleted'），字符串，可选。
  - `campus_id`: 校区 ID，整数，可选。
  - `post_type`: 帖子类型，字符串，可选。
  - `tag`: 帖子的标签，字符串，可选。
  - `min_price`: 最低价格，浮动数值，可选。
  - `max_price`: 最高价格，浮动数值，可选。
  - `keyword`：关键字，字符串，可选。
  - `page`：当前页码，整数，可选，默认 1。
  - `limit`：每页的记录数，整数，可选，默认 10
- **成功响应:**

  - **状态码:** 200
  - **内容:**

  ```
  {
  "total": 50, // 符合条件的总记录数
  "page": 1, // 当前页码
  "count": 10, // 当前页帖子数
  "limit": 10, // 每页记录数
  "posts": [
    {
      "id": 1, // 帖子ID
      "title": "帖子标题", // 帖子标题
      "content": "帖子内容", // 帖子内容
      "status": "active", // 帖子状态
      "campus_id": 1, // 校区ID
      "post_type": "buy", // 帖子类型
      "tag": "电子产品", // 标签
      "price": 100, // 价格
      "images": ["image_url_1", "image_url_2"] // 关联的图片URL列表
    },
    // 其他帖子数据
  ]
  }
  ```

- **无数响应**

```
{
  "total": 10, // 符合条件的总记录数
  "count": 0, // 当前页 post 数
  "limit": 10, // 每页帖子数
  "posts": [] // 空列表
}
```

- **错误响应:**

  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`
  - **状态码:** 404
  - **内容:** `{ "message": "未找到符合条件的帖子" }`

  - 示例请求：

```http
GET http://localhost:5000/api/posts/search?title=二手&status=active&min_price=10&max_price=100
```

### 修改帖子

- **方法:** PUT
- **路径:** `/api/posts/:post_id`
- **功能:** 修改指定帖子的内容。用户必须提供有效的 `token`，并且只能修改自己发布的帖子。
- **请求参数:**
  - **路径参数:**
    - `post_id`: 帖子的 ID，整数，必填。
  - **请求体:**
    - `title`: 帖子标题，字符串，必填。
    - `content`: 帖子内容，字符串，可选。
    - `price`: 帖子价格，浮动数值，可选。
    - `campus_id`: 校区 ID，整数，必填。
    - `status`: 帖子的状态（active, deleted），字符串，可选。
    - `post_type`: 帖子类型（如：sale，求购等），字符串，必填。
    - `tag`: 帖子标签，字符串，可选。
    - `images`: 帖子图片，文件，可选。(旧图片不会保留)
- **请求头:**
  - `Authorization`: Bearer <token>，必填，用于身份验证。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "帖子更新成功" }`
- **错误响应:**

  - **状态码:** 400
  - **内容:** `{ "message": "缺少必要参数" }`
  - **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }` 或 `{ "message": "无效的 Token" }`
  - **状态码:** 404
  - **内容:** `{ "message": "帖子未找到或用户无权修改" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

  - 示例：

  - 请求：

```http
PUT http://localhost:5000/api/posts/1
Content-Type: application/json
Authorization: Bearer <your_token_here>

{
  "title": "二手数学分析教材",
  "price": 50.00,
  "campus_id": 1,
  "post_type": "sale",
  "tag": "教材",
  "status": "active"
}
```

### 修改点赞数

**方法:** `PUT`  
**路径:** `/api/like/:post_id`  
**功能:** 增加或减少指定帖子（`post_id`）的点赞数。通过传递 `like` 为 `true` 来增加点赞，传递 `false` 来减少点赞。

- **请求参数:**

  - `post_id`: 帖子的 ID，整型，必须。
  - `like`: 布尔值，`true` 增加点赞数，`false` 减少点赞数，必须。

- **成功响应:**

  - **状态码:** `200`
  - **内容:** `{ "message": "点赞成功" }` 或 `{ "message": "取消点赞成功" }`

- **错误响应:**
  - **状态码:** `400`
    - **内容:** `{ "message": "无效的 like 参数，必须是 true 或 false" }`
  - **状态码:** `404`
    - **内容:** `{ "message": "帖子未找到" }`
  - **状态码:** `500`
    - **内容:** `{ "message": "服务器错误" }`

---

### 修改投诉数

**方法:** `PUT`  
**路径:** `/api/complaint/:post_id`  
**功能:** 增加或减少指定帖子（`post_id`）的投诉数。通过传递 `complaint` 为 `true` 来增加投诉数，传递 `false` 来减少投诉数。

- **请求参数:**

  - `post_id`: 帖子的 ID，整型，必须。
  - `complaint`: 布尔值，`true` 增加投诉数，`false` 减少投诉数，必须。

- **成功响应:**

  - **状态码:** `200`
  - **内容:** `{ "message": "投诉成功" }` 或 `{ "message": "取消投诉成功" }`

- **错误响应:**
  - **状态码:** `400`
    - **内容:** `{ "message": "无效的 complaint 参数，必须是 true 或 false" }`
  - **状态码:** `404`
    - **内容:** `{ "message": "帖子未找到" }`
  - **状态码:** `500`
    - **内容:** `{ "message": "服务器错误" }`

### 查询当前用户发布历史

- **方法:** GET
- **路径:** `/api/posts/user-history`
- **功能:** 查询当前 token 所指向用户的帖子发布历史。
- **请求头:**
- `Authorization`: `Bearer <JWT_TOKEN>`
- **请求参数:**
  - `page`：当前页码，整数，可选，默认 1。
  - `limit`：每页的记录数，整数，可选，默认 10
- **成功响应:**

  - **状态码:** 200
  - **内容:**

  ```
  {
    "total": integer,     // 用户帖子总数
    "count": integer,     // 当前页帖子数量
    "page": integer,      // 当前页码
    "limit": integer,     // 每页显示数量
    "posts": [
      {
        "id": integer,
        "title": string,
        "content": string,
        "status": string,
        "campus_id": integer,
        "post_type": string,
        "tag": string,
        "images": [
          string// 图片URL数组
        ]
        // . ... 其他帖子字段
      }
    ]
  }
  ```

- **无数响应**

```
{
  "total": 10, // 符合条件的总记录数
  "count": 0, // 当前页 post 数
  "limit": 10, // 每页帖子数
  "posts": [] // 空列表
}
```

- **错误响应:**

  - **状态码:** 401
  - **内容:** `{ "message": "未提供 Token" }`
  - **状态码:** 401
  - **内容:** `{ "message": "无效的用户信息" }`
  - **状态码:** 404
  - **内容:** `{ "message": "用户不存在" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

- 示例请求：

```http
GET /user-history?page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...0
```

## appeals

### 获取所有申诉(仅管理员)

- **方法:** `GET`
- **路径:** `/api/appeals/`
- **功能:** 获取所有未删除的申诉。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** `200`
  - **内容:** 返回申诉列表（`id`, `author_id`, `post_id`, `content`, `status`, `created_at`）
- **错误响应:**
  - **状态码:** `500`
  - **内容:** `{ "message": "服务器错误" }`

---

### 提交申诉

- **方法:** `POST`
- **路径:** `/api/appeals/publish`
- **功能:** 用户提交一条申诉。
- **请求体:** (使用 `multipart/form-data`)
  - **请求参数:**
    - `post_id`: 帖子的 ID，整数类型，必填。
    - `content`: 申诉内容，字符串类型，必填。
    - `images`: 申诉图片，图片类型，可选。
- **成功响应:**
  - **状态码:** `201`
  - **内容:** `{ "message": "申诉提交成功" }`
- **错误响应:**
  - **状态码:** `400`
  - **内容:** `{ "message": "缺少必要参数" }`
  - **状态码:** `404`
  - **内容:** `{ "message": "用户不存在" }` 或 `{ "message": "帖子不存在" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "服务器错误" }`

---

### 查询未解决的申诉

- **方法:** `GET`
- **路径:** `/api/appeals/search/pending`
- **功能:** 查询当前用户下的所有未解决的申诉（过滤已删除或已解决的申诉）。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** `200`
  - **内容:** 返回未解决的申诉列表
- **错误响应:**
  - **状态码:** `401`
  - **内容:** `{ "message": "未提供 Token" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "查询失败" }`

---

### 查询已解决的申诉

- **方法:** `GET`
- **路径:** `/api/appeals/search/resolved`
- **功能:** 查询当前用户下的所有已解决的申诉。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** `200`
  - **内容:** 返回已解决的申诉列表
- **错误响应:**
  - **状态码:** `401`
  - **内容:** `{ "message": "未提供 Token" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "查询失败" }`

---

### 查询已撤销的申诉

- **方法:** `GET`
- **路径:** `/api/appeals/search/deleted`
- **功能:** 查询当前用户下的所有已撤销（删除）的申诉。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** `200`
  - **内容:** 返回已撤销的申诉列表
- **错误响应:**
  - **状态码:** `401`
  - **内容:** `{ "message": "未提供 Token" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "查询失败" }`

---

### 修改申诉状态

- **方法:** `PUT`
- **路径:** `/api/appeals/:appeal_id`
- **功能:** 修改申诉的状态。
- **请求参数:**
  - `appeal_id`: 申诉的 ID，整数类型，必填。
  - `status`: 申诉的新状态，必填。可选值：`'pending'`, `'resolved'`, `'deleted'`。
- **成功响应:**
  - **状态码:** `200`
  - **内容:** `{ "message": "申诉状态已更新" }`
- **错误响应:**
  - **状态码:** `400`
  - **内容:** `{ "message": "缺少参数" }`
  - **状态码:** `403`
  - **内容:** `{ "message": "您没有权限修改该申诉" }`
  - **状态码:** `404`
  - **内容:** `{ "message": "申诉不存在" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "服务器错误" }`

---

### 删除申诉

- **方法:** `DELETE`
- **路径:** `/api/appeals/:appeal_id`
- **功能:** 将申诉状态修改为 `'deleted'`，即软删除申诉。
- **请求参数:**
  - `appeal_id`: 申诉的 ID，整数类型，必填。
- **成功响应:**
  - **状态码:** `200`
  - **内容:** `{ "message": "申诉已删除" }`
- **错误响应:**
  - **状态码:** `400`
  - **内容:** `{ "message": "缺少申诉 ID" }`
  - **状态码:** `403`
  - **内容:** `{ "message": "您没有权限删除该申诉" }`
  - **状态码:** `404`
  - **内容:** `{ "message": "申诉不存在" }`
  - **状态码:** `500`
  - **内容:** `{ "message": "服务器错误" }`

---

## favorites

### 添加收藏

- **方法:** POST
- **路径:** `/api/favorites/add`
- **功能:** 用户可以收藏指定的帖子。如果帖子已被收藏，则返回错误。
- **请求参数:**
  - `post_id`: 帖子的 ID，整数，必填。
  - **Headers:**
    - `Authorization`: 必填，包含 `Bearer token` 格式的认证信息。
- **成功响应:**
  - **状态码:** 201
  - **内容:** `{ "message": "收藏成功" }`
- **错误响应:**
  - **状态码:** 401
  - **内容:** `{ "message": "Token 无效或已过期" }`
  - **状态码:** 404
  - **内容:** `{ "message": "帖子未找到或已被删除" }`
  - **状态码:** 400
  - **内容:** `{ "message": "已经收藏过该帖子" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

---

### 取消收藏

- **方法:** DELETE
- **路径:** `/api/favorites/remove`
- **功能:** 用户取消对指定帖子的收藏。
- **请求参数:**
  - `post_id`: 帖子的 ID，整数，必填。
  - **Headers:**
    - `Authorization`: 必填，包含 `Bearer token` 格式的认证信息。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "取消收藏成功" }`
- **错误响应:**
  - **状态码:** 401
  - **内容:** `{ "message": "无效的 token" }`
  - **状态码:** 404
  - **内容:** `{ "message": "未找到收藏记录" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

---

### 查询用户的所有收藏

- **方法:** GET
- **路径:** `/api/favorites/user/favorites`
- **功能:** 获取用户收藏的所有帖子信息，已删除的帖子不会显示。
- **请求参数:** 无
- **Headers:**
  - `Authorization`: 必填，包含 `Bearer token` 格式的认证信息。
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回用户所有收藏的帖子，包含 `id`, `title`, `content`, `author_id`, `created_at`, `status`, `price`, `campus_id`, `post_type`, `tag` 等字段。
- **错误响应:**
  - **状态码:** 401
  - **内容:** `{ "message": "无效的 token" }`
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

---

- 错误处理

  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

## aiTemlate

### 生成商品信息

- **方法:** POST
- **路径:** `/api/aiTemlate/generate/`
- **功能:** 根据用户输入的文本，调用 AI 生成符合指定结构的商品信息。
- **请求头:**
  - `Authorization`: Bearer <token>，必填，用于身份验证。
- **请求参数:**
  - text: 用户输入的文本，字符串，必填。
- **成功响应:**
  - **状态码:** 200
  - **内容:**
  ```
  {
  "title": "商品名", // 生成的商品名称
  "price": 价格,     // 商品价格
  "tag": "标签",      // 商品标签，可选值： "学业资料" 或 "跑腿代课" 或 "生活用品" 或 "数码电子" 或 "拼单组队" 或 "捞人询问"
  "post_type": "交易类型", // 交易类型，可选值： "sell" 或 "receive"
  "details": "详情"   // 商品详情描述
  }
  ```
- **错误响应:**
  - **状态码:** 400
  - **内容:** `{ "message": "缺少生成文本" }`
  - **状态码:** 401
  - **内容:** `{ "message": "无效的 token" }`
  - **状态码:** 500
  - **内容:** `{ "message": "生成商品信息失败" }`

## responses

### 创建回复(仅管理员)

- **方法:** POST
- **路径:** `/api/responses/`
- **功能:** 管理员创建回复（申诉结果或违规通告），回复内容由管理员编写，默认状态为 "unread"。
- **请求头:**
  - `Authorization`: Bearer `<JWT_TOKEN>` (必须为管理员的 Token，即 token 中 user_id 必须为 1)
- **请求体 (JSON):**
  - `user_id`: 接收回复的用户 ID，整数，必填。
  - `response_type`: 回复类型，字符串，必填，可选值 `"appeal"`（申诉回复）或 `"violation"`（违规通告回复）。
  - `related_id`: 关联的申诉或违规记录的 ID，整数，必填。
  - `content`: 管理员回复内容，字符串，必填。
- **成功响应:**
  - **状态码:** 201
  - **内容:**
    ```json
    {
      "message": "回复创建成功",
      "response_id": 10
    }
    ```
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供 Token" }` 或 `{ "message": "Token 无效" }`
  - **状态码:** 403
    - `{ "message": "只有管理员才能创建回复" }`
  - **状态码:** 400
    - `{ "message": "缺少必要参数" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 查看回复

- **方法:** GET
- **路径:** `/api/responses/`
- **功能:** 查询当前登录用户收到的所有回复（申诉结果或违规通告）。
- **请求头:**
  - `Authorization`: Bearer `<JWT_TOKEN>`
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回一个回复记录数组，每条记录包含 `id`, `user_id`, `response_type`, `related_id`, `content`, `read_status`, `created_at` 等字段。
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供 Token" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 标记回复为已读

- **方法:** PUT
- **路径:** `/api/responses/:response_id/read`
- **功能:** 将当前登录用户收到的指定回复标记为已读。
- **请求头:**
  - `Authorization`: Bearer `<JWT_TOKEN>`
- **请求参数:**
  - `response_id` (URL 参数): 回复的 ID，整数，必填。
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "回复已标记为已读" }`
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供 Token" }` 或 `{ "message": "Token 无效" }`
  - **状态码:** 400
    - `{ "message": "缺少回复ID" }`
  - **状态码:** 404
    - `{ "message": "回复不存在或不属于当前用户" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 查询未读回复

- **方法:** GET
- **路径:** `/api/responses/unread`
- **功能:** 查询当前登录用户收到的所有未读回复（包括申诉结果或违规通告）。
- **请求头:**
  - `Authorization`: Bearer `<JWT_TOKEN>`
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回一个数组，包含所有 `read_status` 为 `unread` 的回复记录，每条记录包含字段 `id`, `user_id`, `response_type`, `related_id`, `content`, `read_status`, `created_at` 等。
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供 Token" }`
  - **状态码:** 500
    - `{ "message": "查询失败" }`

### 查询已读回复

- **方法:** GET
- **路径:** `/api/responses/read`
- **功能:** 查询当前登录用户收到的所有已读回复。
- **请求头:**
  - `Authorization`: Bearer `<JWT_TOKEN>`
- **成功响应:**
  - **状态码:** 200
  - **内容:** 返回一个数组，包含所有 `read_status` 为 `read` 的回复记录，每条记录包含字段 `id`, `user_id`, `response_type`, `related_id`, `content`, `read_status`, `created_at` 等。
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供 Token" }`
  - **状态码:** 500
    - `{ "message": "查询失败" }`

## campusWall

### 获取校园墙帖子列表

- **方法:** GET
- **路径:** `/api/campusWall/`
- **功能:** 获取所有未删除的校园墙帖子**仅供测试**。
- **请求参数:** 无
- **成功响应:**
  - **状态码:** 200
  - **内容:**
  ```json
  {
    "posts": [
      {
        "id": "帖子ID",
        "title": "标题",
        "content": "内容",
        "author_id": "作者ID",
        "campus_id": "校区ID",
        "status": "帖子状态",
        "created_at": "创建时间",
        "images": ["图片URL数组"]
      }
    ]
  }
  ```
- **错误响应:**
  - **状态码:** 500
  - **内容:** `{ "message": "服务器错误" }`

### 发布校园墙帖子

- **方法:** POST
- **路径:** `/api/campusWall/publish`
- **功能:** 发布新的校园墙帖子，支持最多 3 张图片上传。
- **请求头:**
  - `Authorization`: Bearer `<token>`，必填
- **请求体:** (使用 `multipart/form-data`)
  - `title`: 帖子标题，必填
  - `content`: 帖子内容，必填
  - `campus_id`: 校区 ID，必填
  - `images`: 图片文件，可选，最多 3 张
- **成功响应:**
  - **状态码:** 201
  - **内容:** `{ "message": "发布成功" }`
- **错误响应:**
  - **状态码:** 400
    - `{ "message": "缺少必要参数" }`
  - **状态码:** 401
    - `{ "message": "未提供Token" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 删除校园墙帖子

- **方法:** DELETE
- **路径:** `/api/campusWall/:post_id`
- **功能:** 将指定帖子标记为删除状态（软删除）。
- **请求头:**
  - `Authorization`: Bearer `<token>`，必填
- **请求参数:**
  - `post_id`: 帖子 ID（URL 参数）
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "删除成功" }`
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供Token" }`
  - **状态码:** 403
    - `{ "message": "没有权限删除此帖子" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 管理员删除帖子

- **方法:** DELETE
- **路径:** `/api/campusWall/admin/:post_id`
- **功能:** 完全删除校园墙帖子，包括关联的图片文件（仅管理员可用）（**仅测试**）。
- **请求头:**
  - `Authorization`: Bearer `<token>`，必填
- **请求参数:**
  - `post_id`: 帖子 ID（URL 参数）
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "删除成功" }`
- **错误响应:**
  - **状态码:** 401
    - `{ "message": "未提供Token" }`
  - **状态码:** 403
    - `{ "message": "您没有权限完全删除帖子" }`
  - **状态码:** 404
    - `{ "message": "帖子不存在" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`

### 发布校园墙帖子

- **方法:** PUT
- **路径:** `/api/campusWall/:post_id`
- **功能:** 发布新的校园墙帖子，支持最多 3 张图片上传。
- **请求头:**
  - `Authorization`: Bearer `<token>`，必填
- **请求体:** (使用 `multipart/form-data`)
  - `title`: 帖子标题，必填
  - `content`: 帖子内容，必填
  - `campus_id`: 校区 ID，必填
  - `images`: 图片文件，可选，最多 3 张
- **成功响应:**
  - **状态码:** 200
  - **内容:** `{ "message": "更新成功" }`
- **错误响应:**
  - **状态码:** 400
    - `{ "message": "缺少必要参数" }`
  - **状态码:** 401
    - `{ "message": "未提供Token" }`
    - **状态码:** 404
    - `{ "message": "帖子未找到或用户无权修改" }`
  - **状态码:** 500
    - `{ "message": "服务器错误" }`
- **注意** 一旦上传新图片，原帖图片全部删除，请前端**谨慎**设计调用逻辑
