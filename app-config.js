/*
 * NianBox 应用对接配置（方案 B：应用独立仓库 + 独立地址）。
 *
 * 应用仓库：chenzhe223-tech/niantou-box-app
 * 应用地址：https://chenzhe223-tech.github.io/niantou-box-app/
 *
 * 说明：官网其它文件（index.html / styles.css / script.js / favicon.svg）都不需要改动。
 * 将来应用换地址时，只需要改下面的 appUrl 一行，地址规则固定为
 * https://<用户名>.github.io/<应用仓库名>/
 */
window.NIANBOX_CONFIG = Object.freeze({
  appUrl: "https://chenzhe223-tech.github.io/niantou-box-app/",
  appLabel: "打开念头盒 ↗",
  appStatus: "live"
});
