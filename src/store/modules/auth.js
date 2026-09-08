import * as R from 'ramda'
import _ from 'lodash'
import { clear as clearDashboardCache } from '@Dashboard/utils/cache'
import http from '@/utils/http'
import { PERMISSION, ALL_RESOURCES } from '@/constants/permission'
import {
  getTokenFromCookie,
  decodeToken,
  getRegionFromCookie,
  setRegionInCookie,
  setHistoryUsersInStorage,
  getScopeFromCookie,
  getTenantFromCookie,
  setTenantInCookie,
  setScopeInCookie,
  removeTenantInCookie,
  removeScopeInCookie,
  getHistoryUsersFromStorage,
  getLoggedUsersFromStorage,
  setLoggedUsersInStorage,
  getSsoIdpIdFromCookie,
  setLoginModeInStorage,
  checkSessionUser,
  SESSION_LOGIN_USER_KEY,
} from '@/utils/auth'
import { SCOPES_MAP } from '@/constants'
import router from '@/router'
import { removeKeyIgnoreCase, getKeyIgnoreCase, redirectAfterAuth, genReferRouteQuery } from '@/utils/utils'
import { safeAuthRedirectUrl } from '@/utils/safeRedirect'
import storage from '@/utils/storage'
import { aesEncryptWithCustomKey } from '@/utils/crypto'

// 后端 502/不可达时短期不再重复请求，避免刷接口导致页面卡死
const BACKEND_UNREACHABLE_TTL = 30000
let backendUnreachableUntil = 0

function isBackendUnreachable (error) {
  const status = error?.response?.status
  const noResponse = !error?.response
  const is502 = status === 502
  const isNetwork = noResponse || error?.code === 'ECONNREFUSED' || error?.message?.includes('Network')
  return is502 || isNetwork
}

const initialState = {
  scope: getScopeFromCookie() || 'project',
  tenant: getTenantFromCookie(),
  region: getRegionFromCookie(),
  token: getTokenFromCookie(),
  auth: decodeToken(getTokenFromCookie()) || {},
  info: {
    projectId: '',
    projects: [],
    domain: {},
  },
  permission: null,
  scopeResource: null,
  capability: {},
  stats: {},
  regions: {
    captcha: false,
    domains: [],
    idps: [],
    regions: [],
    api_server: '',
  },
  registersStatus: true,
  // loggedUsers记录的key为username + domain，是获取用户信息之后记录的
  // historyUsers记录的key为username，是登录成功之前记录的
  historyUsers: getHistoryUsersFromStorage() || {},
  loggedUsers: getLoggedUsersFromStorage() || {},
  // 提交的登录表单数据
  loginFormData: {},
  canRenderDefaultLayout: false,
  noActionLogoutSeconds: 0,
}

function normalizeTenant (val) {
  if (!val || typeof val !== 'string') return ''
  const v = val.trim()
  // 兼容将租户写成 "id/<uuid>" 或 "id/<uuid>/<something>"
  if (v.startsWith('id/')) {
    const rest = v.slice(3)
    const segs = rest.split('/').filter(Boolean)
    return segs[0] || ''
  }
  return v
}

export default {
  state: {
    ...initialState,
  },
  mutations: {
    SET_SCOPE (state, payload) {
      setScopeInCookie(payload)
      state.scope = payload
    },
    SET_TENANT (state, payload) {
      setTenantInCookie(payload)
      state.tenant = payload
    },
    SET_REGION (state, payload) {
      setRegionInCookie(payload)
      state.region = payload
    },
    RESET_COOKIE (state, payload) {
      state.scope = 'project'
      state.tenant = ''
      removeTenantInCookie()
      removeScopeInCookie()
    },
    UPDATE_AUTH (state) {
      const token = getTokenFromCookie()
      const auth = decodeToken(token)
      state.token = token
      state.auth = auth
    },
    SET_INFO (state, payload) {
      state.info = payload
    },
    SET_CAPABILITY (state, payload) {
      state.capability = payload
    },
    SET_STATS (state, payload) {
      state.stats = payload
    },
    SET_PERMISSION (state, payload) {
      state.permission = payload
    },
    SET_SCOPERESOURCE (state, payload) {
      state.scopeResource = payload
    },
    SET_REGIONS (state, payload) {
      state.regions = payload
    },
    SET_REGISTERS_STATUS (state, payload) {
      state.registersStatus = payload
    },
    SET_LOGIN_FORM_DATA (state, payload) {
      state.loginFormData = payload
    },
    UPDATE_HISTORY_USERS (state, payload) {
      const newVal = { ...state.historyUsers }
      if (payload.action === 'delete') {
        removeKeyIgnoreCase(newVal, payload.key)
      } else {
        const key = payload.key || (state.info.name.toLowerCase() + '@' + state.info.domain.name.toLowerCase())
        const oldVal = getKeyIgnoreCase(newVal, key)
        removeKeyIgnoreCase(newVal, key)
        const data = {
          ...oldVal,
          ...payload.value,
        }
        // 设置创建时间
        const timestamp = +new Date()
        if (!_.get(data, 'create_time')) {
          _.set(data, 'create_time', timestamp)
        }
        // 设置更新时间
        _.set(data, 'update_time', timestamp)
        // 最多存储5条纪录，超过5则移除掉创建时间最早的
        if (Object.keys(newVal).length > 5) {
          const newValArr = Object.entries(newVal)
          const oldestUser = _.minBy(newValArr, o => o[1].create_time)
          oldestUser[0] && delete newVal[oldestUser[0]]
        }
        if (payload.action === 'unset') {
          _.unset(data, payload.path)
        }
        newVal[key] = data
      }
      setHistoryUsersInStorage(newVal)
      state.historyUsers = newVal
    },
    UPDATE_LOGGED_USERS (state, payload) {
      // 如果是sso登录则不保存信息
      // if (state.auth && state.auth.is_sso) return
      const newVal = { ...state.loggedUsers }
      if (payload.action === 'delete') {
        removeKeyIgnoreCase(newVal, payload.key)
      } else {
        const info = state.info || {}
        const name = typeof info.name === 'string' ? info.name.toLowerCase() : ''
        const domainName = info.domain && typeof info.domain.name === 'string' ? info.domain.name.toLowerCase() : ''
        const fallbackKey = name && domainName ? `${name}@${domainName}` : ''
        const key = payload.key || fallbackKey || ''
        const oldVal = getKeyIgnoreCase(newVal, key)
        removeKeyIgnoreCase(newVal, key)
        const data = {
          ...oldVal,
          ...payload.value,
        }
        // 设置创建时间
        const timestamp = +new Date()
        if (!_.get(data, 'create_time')) {
          _.set(data, 'create_time', timestamp)
        }
        // 设置更新时间
        _.set(data, 'update_time', timestamp)
        // 最多存储5条纪录，超过5则移除掉创建时间最早的
        if (Object.keys(newVal).length > 5) {
          const newValArr = Object.entries(newVal)
          const oldestUser = _.minBy(newValArr, o => o[1].create_time)
          oldestUser[0] && delete newVal[oldestUser[0]]
        }
        if (payload.action === 'unset') {
          _.unset(data, payload.path)
        }
        if (key) {
          newVal[key] = data
        }
      }
      setLoggedUsersInStorage(newVal)
      state.loggedUsers = newVal
    },
    SET_CAN_RENDER_DEFAULT_LAYOUT (state, payload) {
      state.canRenderDefaultLayout = payload
    },
    LOGOUT (state) {
      state.token = null
      state.auth = {}
      state.loginFormData = {}
      state.info = { ...initialState.info }
      state.permission = null
      state.scopeResource = null
      state.capability = {}
      state.stats = {}
      state.canRenderDefaultLayout = false
    },
    SET_NO_ACTION_LOGOUT_SECONDS (state, payload) {
      state.noActionLogoutSeconds = payload
    },
    CLEAR_LOGGED_USERS (state) {
      setLoggedUsersInStorage({})
      state.loggedUsers = {}
    },
    CLEAR_DASHBOARD_CACHE () {
      clearDashboardCache()
    },
  },
  getters: {
    // 是否切换到管理后台
    isAdmin (state) {
      return state.scope === SCOPES_MAP.system.key
    },
    // 是否切换到域管理后台
    isDomain (state) {
      return state.scope === SCOPES_MAP.domain.key
    },
    // 当前用户是否有含有 system 权限 项目
    isSystemAdmin (state) {
      return state.info.projects.some(item => item.id === state.info.projectId && item.system_capable)
    },
    // 当前用户是否有含有 domain 权限 项目
    isDomainAdmin (state) {
      return state.info.projects.some(item => item.id === state.info.projectId && item.domain_capable)
    },
    // 是否在管理后台视图下
    isAdminMode (state, getters) {
      return getters.isAdmin && getters.isSystemAdmin
    },
    // 是否在域管理后台视图下
    isDomainMode (state, getters) {
      return getters.isDomain && getters.isDomainAdmin
    },
    // 是否在项目视图下
    isProjectMode (state, getters) {
      return !getters.isAdminMode && !getters.isDomainMode
    },
    l3PermissionEnable (state) {
      return state.info.non_default_domain_projects
    },
    currentScopeResource (state, getters) {
      const ret = [...ALL_RESOURCES]
      const systemResource = state.scopeResource && state.scopeResource.system
      const domainResource = state.scopeResource && state.scopeResource.domain
      // 如果为管理后台返回所有的资源
      if (getters.isAdminMode) {
        return ret
      }
      // 如果为域管理后台返回所有资源减去管理的资源
      if (getters.isDomainMode) {
        _.remove(ret, resource => {
          return systemResource && systemResource.includes(resource)
        })
        return ret
      }
      // 如果为普通后台减去管理资源和域资源
      _.remove(ret, resource => {
        return (
          (systemResource && systemResource.includes(resource)) ||
          (domainResource && domainResource.includes(resource))
        )
      })
      return ret
    },
    currentLoggedUserKey (state) {
      const info = state.info || {}
      const name = typeof info.name === 'string' ? info.name.toLowerCase() : ''
      const domainName = info.domain && typeof info.domain.name === 'string' ? info.domain.name.toLowerCase() : ''
      if (!name || !domainName) return ''
      return `${name}@${domainName}`
    },
    currentHistoryUserKey (state) {
      return state.auth.user || state.loginFormData.username
    },
  },
  actions: {
    async login ({ commit, state, dispatch }, data) {
      try {
        const _data = { ...data }
        let matchedUser
        if (_data.username) {
          if (_data.domain) {
            matchedUser = _.get(state.loggedUsers, `${_data.username}@${_data.domain}`) || _.get(state.historyUsers, _data.username)
          } else {
            matchedUser = _.get(state.historyUsers, _data.username)
          }
        }
        if (matchedUser) {
          const tenant = normalizeTenant(matchedUser.tenant)
          if (tenant) {
            _data.username = `${tenant}/${_data.username}`
            await commit('SET_TENANT', tenant)
          }
          if (matchedUser.scope) {
            await commit('SET_SCOPE', matchedUser.scope)
          }
        } else {
          await commit('RESET_COOKIE')
        }
        const response = await http.post('/v1/auth/login', _data)
        await commit('UPDATE_AUTH')
        const newCurrentHistoryUserStorageValue = {
          scope: getScopeFromCookie(),
          tenant: getTenantFromCookie(),
        }
        await commit('SET_SCOPE', newCurrentHistoryUserStorageValue.scope)
        await commit('SET_TENANT', newCurrentHistoryUserStorageValue.tenant)
        if (data.username) {
          await commit('UPDATE_HISTORY_USERS', {
            key: data.username,
            value: newCurrentHistoryUserStorageValue,
          })
        }
        await commit('scopedPolicy/DEL_DATA', {
          name: 'sub_hidden_menus',
        })
        // 本地存储记录登录方式信息，下次登录默认使用该方式登录 {mode: 'account|mobile', content: 'username|phone number'}
        const { mobile, username } = data
        setLoginModeInStorage({ mode: mobile ? 'mobile' : 'account', content: mobile || username })
        return response.data
      } catch (error) {
        throw error
      }
    },
    async logout ({ commit, state }, data) {
      try {
        // http 实例已默认 baseURL='/api'，这里不要重复加 '/api' 前缀
        const response = await http.post('/v1/auth/logout', data)
        await commit('LOGOUT')
        await commit('RESET_COOKIE')
        await commit('profile/REST_ID', null, { root: true })
        await commit('common/REST_BILL_CURRENCY', null, { root: true })
        await commit('scopedPolicy/DEL_DATA', { name: 'sub_hidden_menus' }, { root: true })
        await commit('monitor/setMonitorResourceAlerts', [], { root: true })
        const { regions = {} } = state
        const { is_forget_login_user } = regions
        if (is_forget_login_user) {
          await commit('CLEAR_LOGGED_USERS')
        }
        await commit('CLEAR_DASHBOARD_CACHE')
        // 清除本地用户
        storage.session.remove(SESSION_LOGIN_USER_KEY)
        return response.data
      } catch (error) {
        throw error
      }
    },
    /**
     * @description Get user info
     */
    async getInfo ({ commit, state, getters, dispatch }) {
      try {
        if (Date.now() < backendUnreachableUntil) return {}
        const isSessionUser = checkSessionUser()
        if (!isSessionUser) {
          await dispatch('logout')
          router.push({
            path: '/auth/login',
            query: genReferRouteQuery(router.currentRoute),
          })
          return {}
        }
        const response = await http.get('/v1/auth/user')
        backendUnreachableUntil = 0
        // 兼容不同后端返回结构：{ data: user } 或 { data: { data: user } }
        const user = response?.data?.data?.data || response?.data?.data
        if (!user) {
          await dispatch('logout')
          router.push({
            path: '/auth/login',
          })
          return {}
        }
        await commit('SET_INFO', user)
        const info = state.info || {}
        await commit('UPDATE_LOGGED_USERS', {
          key: getters.currentLoggedUserKey,
          value: {
            displayname: info.displayname,
            projectName: info.projectName,
            projectDomain: info.projectDomain,
            domain: info.domain || {},
            scope: getScopeFromCookie(),
            tenant: getTenantFromCookie(),
            name: info.name,
            isSSO: state.auth.is_sso,
            idpId: state.auth.is_sso ? getSsoIdpIdFromCookie() : null,
          },
        })
        // 设置本地登录用户
        if (user && user.id) {
          storage.session.set(SESSION_LOGIN_USER_KEY, aesEncryptWithCustomKey(user.id, 'cloudpods'))
        }
        return user
      } catch (error) {
        if (isBackendUnreachable(error)) backendUnreachableUntil = Date.now() + BACKEND_UNREACHABLE_TTL
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          try {
            await dispatch('logout')
          } catch (e) {
            // ignore logout error
          }
          router.push({
            path: '/auth/login',
          })
        }
        return {}
      }
    },
    async getCapabilities ({ commit, state }) {
      try {
        if (Date.now() < backendUnreachableUntil) {
          await commit('SET_CAPABILITY', {})
          return {}
        }
        const response = await http.get('/v2/capabilities', {
          params: {
            scope: state.scope,
          },
        })
        backendUnreachableUntil = 0
        const data = (response.data.data && response.data.data[0]) || {}
        await commit('SET_CAPABILITY', data)
        return response.data
      } catch (error) {
        if (isBackendUnreachable(error)) backendUnreachableUntil = Date.now() + BACKEND_UNREACHABLE_TTL
        throw error
      }
    },
    async getStats ({ commit, state }) {
      try {
        const response = await http.get('/v1/auth/stats', {
          params: {
            scope: state.scope,
          },
        })
        const data = response.data.data || {}
        await commit('SET_STATS', data)
        return response.data.data
      } catch (error) {
        throw error
      }
    },
    async getPermission ({ commit, state }) {
      try {
        const data = R.map(item => [state.scope, ...item], PERMISSION)
        const response = await http.post('/v1/auth/permissions', data)
        await commit('SET_PERMISSION', response.data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async getScopeResource ({ commit }) {
      try {
        const response = await http.get('/v1/auth/scoped_resources')
        const data = R.map(item => {
          return R.flatten(R.values(item))
        }, response.data)
        await commit('SET_SCOPERESOURCE', data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async getRegions ({ commit, state }, params) {
      try {
        const response = await http.get('/v1/auth/regions', {
          params: params,
        })
        // 如果当前region不在regions列表中，则重新设置region
        const regions = response.data.regions
        if (
          (state.region && !regions.includes(state.region)) ||
          !state.region
        ) {
          commit('SET_REGION', regions[0])
        }
        await commit('SET_REGIONS', response.data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async getRegistersStatus ({ commit }) {
      try {
        const response = await http.get('/v1/registers/status')
        await commit('SET_REGISTERS_STATUS', response.data.status === 'true')
        return response.data
      } catch (error) {
        throw error
      }
    },
    // 登录后所做的后续处理
    async onAfterLogin ({ commit, state, dispatch, getters }, payload) {
      const totp_on = state.auth.totp_on
      const system_totp_on = state.auth.system_totp_on
      const totp_verified = state.auth.totp_verified
      const totp_init = state.auth.totp_init
      // 如果获取到有效的二维码且开启了totp则进入首次初始化页面
      if (
        totp_on &&
        system_totp_on &&
        !totp_verified &&
        !totp_init
      ) {
        // 获取密码问题，如果设置过则直接进入绑定秘钥页面，没有跳转至设置密码问题页面
        try {
          const recovery = await dispatch('getRecovery')
          if (recovery) {
            router.replace({
              path: '/auth/bindsecret',
              query: {
                rf: router.currentRoute.value.query.rf,
              },
            })
          }
        } catch (error) {
          if (error.response.status === 404) {
            router.replace({
              path: '/auth/setsecretquestion',
              query: {
                rf: router.currentRoute.value.query.rf,
              },
            })
          }
          throw error
        }
      } else if (
        !_.get(getKeyIgnoreCase(state.historyUsers, getters.currentHistoryUserKey) || {}, 'secret') &&
        totp_on &&
        system_totp_on &&
        !totp_verified &&
        totp_init
      ) {
        router.replace({
          path: '/auth/secretverify',
          query: {
            rf: router.currentRoute.value.query.rf,
          },
        })
      } else if (
        _.get(getKeyIgnoreCase(state.historyUsers, getters.currentHistoryUserKey) || {}, 'secret') &&
        totp_on &&
        system_totp_on &&
        !totp_verified &&
        totp_init
      ) {
        router.replace({
          path: '/auth/bindsecret',
          query: {
            rf: router.currentRoute.value.query.rf,
          },
        })
      } else {
        const { rf, pathAuthPage, pathAuth, path, pathQuery } = router.currentRoute.value.query
        if (rf) {
          const safeRf = safeAuthRedirectUrl(rf, state.regions?.cors_hosts)
          if (safeRf) {
            document.location.href = safeRf
            return
          }
          // 不安全的 rf 忽略，继续默认流程
        }
        if (!pathAuthPage && pathAuth && path) {
          if (!redirectAfterAuth(router, { path, pathQuery }, state.regions?.cors_hosts)) {
            router.replace('/')
          }
        } else {
          router.replace('/')
        }
      }
    },
    async validPasscode ({ commit }, data) {
      try {
        const response = await http.post('/v1/auth/passcode', data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async getRecovery ({ commit }, params) {
      try {
        const response = await http.get('/v1/auth/recovery', { params })
        return response.data
      } catch (error) {
        throw error
      }
    },
    async setRecovery ({ commit }, data) {
      try {
        const response = await http.post('/v1/auth/recovery', data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async credential ({ commit }, data) {
      try {
        const response = await http.post('/v1/auth/credential', data)
        return response.data
      } catch (error) {
        throw error
      }
    },
    async initcredential ({ commit, getters }, data) {
      try {
        const response = await http.post('/v1/auth/initcredential', data)
        await await commit('UPDATE_HISTORY_USERS', {
          key: getters.currentHistoryUserKey,
          value: {
            secret: response.data.qrcode,
          },
        })
        return response.data
      } catch (error) {
        throw error
      }
    },
  },
}
