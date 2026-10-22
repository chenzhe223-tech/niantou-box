# 念头盒 NianBox

**好点子，别让它溜了。**  
把每一个念头，留给未来的创造。

NianBox 是一个面向生活问题、突发灵感和产品创意的品牌官网。当前仓库承载品牌介绍页，并预留正式应用的链接入口。

## 文件结构

- `index.html` — 单页品牌官网
- `styles.css` — 响应式视觉样式
- `script.js` — 官网交互与应用链接行为
- `app-config.js` — 正式应用链接配置
- `favicon.svg` — 品牌图标
- `.github/workflows/deploy.yml` — GitHub Pages 自动部署

## 本地预览

无需构建工具，直接打开 `index.html` 即可预览；也可以运行任何静态 HTTP 服务器，例如：

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## GitHub Pages 发布

仓库工作流位于 `.github/workflows/deploy.yml`。每次向 `main` 分支推送提交时，GitHub Actions 会上传静态站点并部署到 Pages。

第一次发布时，请在仓库设置中确认：

1. 打开 **Settings → Pages**。
2. 在 **Build and deployment → Source** 选择 **GitHub Actions**。
3. 打开 **Actions** 标签，确认工作流运行成功。
4. 成功部署后，访问 `https://davylab.github.io/niantou-box/`。

## 连接正式应用

修改 `app-config.js`：

```js
window.NIANBOX_CONFIG = Object.freeze({
  appUrl: "https://你的正式应用网址/",
  appLabel: "打开念头盒",
  appStatus: "live"
});
```

保存并提交后，导航入口会自动链接至正式应用。请只填写真实、可公开访问的 HTTPS 地址。正式应用尚未发布时，请保持 `appUrl` 为空、`appStatus` 为 `coming-soon`。

## 重要说明

官网的“收住一个念头”区域只是用于展示产品理念的互动样例。输入内容只会短暂显示在当前页面内，刷新后不会保存；它不是正式的念头盒记录应用。未来应用可独立开发，再通过 `app-config.js` 连接。

当前仓库没有后端，不采集或上传访客输入。GitHub Pages 仅负责静态网站托管。
