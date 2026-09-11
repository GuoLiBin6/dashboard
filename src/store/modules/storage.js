import storage from '@/utils/storage'
import http from '@/utils/http'

const STORAGE_DOMAIN_KEY = '__oc_selected_domain__'
const STORAGE_PROJECT_KEY = '__oc_selected_project__'

/** 同一 id 并发请求合并；已 404 的 id 短时跳过，避免控制台刷屏 */
const projectInflight = Object.create(null)
const failedProjectIds = new Set()

export default {
  state: {
    domain: storage.get(STORAGE_DOMAIN_KEY) || {},
    project: storage.get(STORAGE_PROJECT_KEY) || {},
  },
  mutations: {
    SET_DOMAIN (state, domain) {
      storage.set(STORAGE_DOMAIN_KEY, domain)
      state.domain = domain
    },
    SET_PROJECT (state, project) {
      storage.set(STORAGE_PROJECT_KEY, project)
      state.project = project
    },
  },
  actions: {
    async getDomainById ({ commit }, payload = {}) {
      if (!payload?.key) return Promise.resolve()
      try {
        const { data } = await http.get('/v1/domains/' + payload.key)
        return Promise.resolve(data)
      } catch (err) {
        commit('SET_DOMAIN', {})
      }
    },
    async getProjectById ({ commit, state }, payload = {}) {
      if (!payload?.key) return Promise.resolve()
      if (failedProjectIds.has(payload.key)) return Promise.resolve()
      if (projectInflight[payload.key]) return projectInflight[payload.key]
      projectInflight[payload.key] = (async () => {
        try {
          const { data } = await http.get('/v1/projects/' + payload.key, {
            params: { project_domain: payload.project_domain || state.domain?.key },
          })
          if (data) {
            commit('SET_PROJECT', payload)
            failedProjectIds.delete(payload.key)
          }
          return data
        } catch (err) {
          failedProjectIds.add(payload.key)
          commit('SET_PROJECT', {})
        } finally {
          delete projectInflight[payload.key]
        }
      })()
      return projectInflight[payload.key]
    },
  },
}
