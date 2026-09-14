/**
 * 打破 utils/auth、utils/http、router ↔ store/modules 的循环初始化 TDZ。
 * 业务代码通过 getStore() 取实例；store/index.js 在 Vuex 创建后 setStore。
 */
let _store = null

export function setStore (store) {
  _store = store
}

export function getStore () {
  return _store
}
