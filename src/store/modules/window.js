export default {
  state: {
    windows: {},
  },
  mutations: {
    CREATE (state, payload) {
      // 保底初始化，避免后续 update 访问 undefined
      state.windows[payload.id] = {
        id: payload.id,
        dialogIds: [],
        sidePageIds: [],
        ...payload,
      }
    },
    UPDATE (state, payload) {
      // 某些场景下（例如异常顺序、热更新、或 createWindow 未成功提交）
      // update 可能先于 create 到达，这里做兜底防止直接报错。
      if (!state.windows[payload.id]) {
        state.windows[payload.id] = {
          id: payload.id,
          dialogIds: [],
          sidePageIds: [],
        }
      }
      const keys = Object.keys(payload)
      for (let i = 0, len = keys.length; i < len; i++) {
        if (keys[i] !== 'id') {
          state.windows[payload.id][keys[i]] = payload[keys[i]]
        }
      }
    },
    DESTROY (state, id) {
      delete state.windows[id]
    },
  },
  actions: {
    create ({ commit }, payload) {
      commit('CREATE', payload)
    },
    update ({ commit }, payload) {
      commit('UPDATE', payload)
    },
    destroy ({ commit }, id) {
      commit('DESTROY', id)
    },
  },
}
