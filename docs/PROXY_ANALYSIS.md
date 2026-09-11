# 本地代理请求后端：dashboard-v3 vs ee/dashboard 对比

## 1. 配置来源

| 项目 | 构建工具 | 代理配置来源 | 环境变量 |
|------|----------|--------------|----------|
| **ee/dashboard** | Webpack (vue-cli) | `vue.config.js` 默认 + `dev.server.config.js` 覆盖 | 无 VITE_*，用 VUE_APP_BASE_API=/api |
| **dashboard-v3** | Vite | 有 `dev.server.config.js` 时**完全采用**其 proxy，否则用 `apiTarget`（来自 VITE_PROXY_TARGET） | .env 有 VITE_PROXY_TARGET，**仅在没有 dev.server.config.js 时生效** |

- 两边的 **dev.server.config.js** 结构一致：`/api` → `target: 'https://hpc.yunion.io:9443'`，`ws`、`changeOrigin`、`secure: false`。
- **dashboard-v3**：存在 `dev.server.config.js` 时，**不会**读 `VITE_PROXY_TARGET`，target 只来自 dev.server.config.js。

## 2. 合并方式差异

**ee/dashboard (Webpack)**  
- `vue.config.js`: `devServer: Object.assign(默认 devServer, dev.server.config.js)`  
- 默认里有 `proxy: { '/api': { target: 'https://127.0.0.1:3000', proxyTimeout: 2min } }`  
- 合并后 **整块 proxy 被 dev.server.config.js 的 proxy 替换**，所以最终只有 dev.server.config.js 的配置，**没有** proxyTimeout。

**dashboard-v3 (Vite)**  
- `baseProxy = { ...dev.server.config.js.proxy }`，再对 `baseProxy['/api']` 做：  
  `baseProxy['/api'] = { ...baseProxy['/api'], configure: proxyErrorConfigure }`  
- 即：完全采用 dev.server.config.js 的 proxy，只给 `/api` **多加了 `configure` 回调**（见下）。

## 3. 错误处理差异（问题关键）

**ee/dashboard**  
- 使用 Webpack dev server 自带的代理错误行为：连接失败时由底层直接报错，浏览器看到的可能是连接失败、超时等，**不会**统一成固定 JSON。

**dashboard-v3**  
- 在 `configure(proxy)` 里做了：  
  `proxy.removeAllListeners('error')`  
  `proxy.on('error', (err, req, res) => { ... res.end(JSON.stringify({ error: "Bad Gateway", message: "Backend unreachable" })) })`  
- 因此：**任何**代理错误（连接被拒、超时、TLS 校验失败等）都会变成 502 + `{ error: "Bad Gateway", message: "Backend unreachable" }`。  
- 也就是说：“Backend unreachable” 是 **vite 配置里主动返回的**，真实原因是底层代理触发了 `error` 事件。

## 4. 代理实现差异

- **ee/dashboard**：Webpack dev server 使用 **http-proxy-middleware**（底层 http-proxy），与 Webpack 集成较深。  
- **dashboard-v3**：Vite 使用自带的 **http-proxy** 封装。  
- 两者对 HTTPS 目标、`secure: false`、超时等的处理可能略有不同，导致同一 target 在 Webpack 能通、在 Vite 上触发 `error`（例如 TLS 校验或超时）。

## 5. 可能原因小结

在“网络是通的”前提下，dashboard-v3 仍出现 `Backend unreachable`，通常表示：

1. **TLS/证书**：Node 侧请求 `https://hpc.yunion.io:9443` 时校验证书失败（自签、链不完整等），触发了 proxy 的 `error`。dev.server.config.js 里虽有 `secure: false`，但 Vite 使用的 http-proxy 是否把该选项正确传到底层 HTTPS agent，需看版本与文档。  
2. **超时**：握手或首包过慢。当前 dev.server.config.js 的 `/api` 未设 `timeout`/`proxyTimeout`，Vite 默认超时可能较短，容易先报错。  
3. **协议/SNI**：对 HTTPS 的 SNI、协议版本等处理与 Webpack 不同，导致连接失败并触发 `error`。

## 6. 如何判断 502 来自代理还是后端

- **终端有** `[vite] http proxy error:`：说明是 **Vite 代理连目标失败**（连接被拒、TLS、超时等），代理会返回 502 且响应头带 `X-Vite-Proxy-Error: 1`。
- **终端没有** 上述打印：说明代理已把请求转发到目标，**502 是目标服务器（或上游）返回的**。请在浏览器 Network 里看该请求的 Response Headers：
  - 若有 **`X-Vite-Proxy-Error: 1`** → 仍是代理错误（理论上此时终端应有日志，若没有可能是日志被吞）。
  - 若**没有**该头 → 502 来自 `dev.server.config.js` 里配置的 target（如 hpc.yunion.io:9443），需检查该后端或换一个可用的 target。

## 7. 建议修改（已做其一）

- 在 **vite 合并 `/api` 时** 显式加上 **超时**（与 vite 无 dev.server.config 时一致、与 ee 默认 2 分钟同量级），避免因超时过早触发 `error`：  
  `timeout: 1000 * 60 * 2`（2 分钟）。  
- 若仍报错，再考虑：为 HTTPS target 显式传入 `secure: false` 或自定义 `agent`（如 `rejectUnauthorized: false`），确保校验证书被关闭。
