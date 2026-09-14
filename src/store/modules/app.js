/**
 * 勿在此 import @scope/store/modules/app。
 * 链路 scope app → @/utils/auth → @/store → modules/app 会形成循环初始化 TDZ：
 * Cannot access 'scopeApp' before initialization。
 *
 * 真实 app 模块由 ./index.js 的 scope glob（/scope/store/modules/*.js）注册并覆盖同名模块。
 */
export default {
  state: {},
  mutations: {},
  actions: {},
}
