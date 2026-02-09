[English](README.md) | **中文**

# skill-x-social

X (Twitter) 浏览器自动化 skill — 通过 Playwright + Chrome 发推、点赞、回复、转推、引用推文。

## 为什么用浏览器自动化？

- **API 太贵** — X 官方 API 发推需要付费订阅（$200+/月）
- **机器人浏览器会被封** — X 能检测并封禁无头浏览器和常见自动化指纹
- **真实浏览器指纹** — 复用用户本机 Chrome，避免被检测
- **一次登录** — 手动登录一次，会话持久保存在 Chrome 配置文件中

## 功能

| 操作 | 脚本 | 说明 |
|------|------|------|
| 发推 | `scripts/post.ts` | 发布推文，支持文本和图片（最多 4 张） |
| 点赞 | `scripts/like.ts` | 点赞任意推文 |
| 回复 | `scripts/reply.ts` | 回复推文，可附带图片 |
| 转推 | `scripts/retweet.ts` | 转推（不带评论） |
| 引用 | `scripts/quote.ts` | 引用推文并附加评论，可附带图片 |

所有脚本使用 stdin/stdout JSON 通信 — 管道输入，解析输出。完整 IO 协议见 [SKILL.md](SKILL.md)。

## 快速开始

### 前置条件

- **Node.js** >= 20
- **Google Chrome** 已安装

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Chrome 路径

默认路径为 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`。

如果 Chrome 安装在其他位置，查找并写入 `.env`：

```bash
# 查找 Chrome 安装位置（macOS）
CHROME=$(mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'" 2>/dev/null | head -1)

# 如果找到，写入 .env
if [ -n "$CHROME" ]; then
  echo "CHROME_PATH=$CHROME/Contents/MacOS/Google Chrome" >> .env
  echo "已添加 CHROME_PATH 到 .env"
else
  echo "未找到 Chrome，请先安装 Google Chrome。"
fi
```

### 3. X 认证

```bash
npx tsx scripts/setup.ts
```

此命令会打开 Chrome，你需要手动登录 X。脚本会自动检测登录完成（超时：5 分钟）。

验证：

```bash
cat data/x-auth.json  # {"authenticated": true, ...}
```

## 使用

```bash
# 发推
echo '{"content":"Hello world"}' | npx tsx scripts/post.ts

# 发推附带图片
echo '{"content":"看看这个","imagePaths":["/path/to/image.png"]}' | npx tsx scripts/post.ts

# 点赞
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx scripts/like.ts

# 回复
echo '{"tweetUrl":"https://x.com/user/status/123","content":"写得好！"}' | npx tsx scripts/reply.ts

# 转推
echo '{"tweetUrl":"https://x.com/user/status/123"}' | npx tsx scripts/retweet.ts

# 引用推文
echo '{"tweetUrl":"https://x.com/user/status/123","comment":"有意思"}' | npx tsx scripts/quote.ts
```

输出为单行 JSON：

```json
{"success": true, "message": "Tweet posted: https://x.com/user/status/123456"}
```

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `CHROME_PATH` | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | Chrome 可执行文件路径 |

在项目根目录的 `.env` 中设置。

### 超时与限制

编辑 `lib/config.ts` 可调整：

- 页面导航超时（默认：30 秒）
- 元素等待超时（默认：5 秒）
- 推文字符限制（默认：280）
- 每条推文最大图片数（默认：4）
- 视口大小（默认：1280x800）

### 数据目录

| 路径 | 用途 |
|------|------|
| `data/x-browser-profile/` | Chrome 配置文件（含登录会话） |
| `data/x-auth.json` | 认证状态标记 |

均已在 `.gitignore` 中忽略。

## 故障排查

### 认证过期

重新运行认证：

```bash
npx tsx scripts/setup.ts
```

### Chrome 启动失败

清除浏览器锁文件：

```bash
rm -f data/x-browser-profile/SingletonLock data/x-browser-profile/SingletonSocket data/x-browser-profile/SingletonCookie
```

### X 界面选择器变更

如果脚本因找不到元素而失败，可能是 X 更新了界面。更新 `lib/config.ts` 中的 `config.selectors`。

## 许可证

[MIT](LICENSE)
