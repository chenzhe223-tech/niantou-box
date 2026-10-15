/*
 * NianBox 官网 ↔ 应用对接配置（方案 B：应用独立仓库 + 独立地址）。
 *
 * 应用仓库：chenzhe223-tech/niantou-box-app
 * 应用地址：https://chenzhe223-tech.github.io/niantou-box-app/
 * 云端接口：https://nianbox-cloud.chenzhe223.workers.dev
 *
 * 三个字段的用途：
 *   appUrl        —— 官网上所有 [data-app-link] 入口指向的地址；
 *   appLabel      —— 这些入口的按钮文案；
 *   appStatus     —— 只有 "live" 才会把入口指向应用，否则留在本页体验；
 *   cloudEndpoint —— 官网「快速记录」提交到云端收件箱的接口地址。
 *
 * 换用户名 / 换仓库名 / 换云端域名，都只改这个文件，页面和脚本都不用动。
 * 注意：这里只放公开地址，任何令牌、密钥都不能写进官网代码。
 */
window.NIANBOX_CONFIG = Object.freeze({
  appUrl: "https://chenzhe223-tech.github.io/niantou-box-app/",
  appLabel: "打开念头盒 ↗",
  appStatus: "live",
  cloudEndpoint: "https://nianbox-cloud.chenzhe223.workers.dev"
});