/**
 * Vue Router 4 不再保留路径未声明的 params。
 * 不可写入 history.state（含 Proxy 会 DataCloneError → VR 回退 location.assign 整页刷新）。
 * 用内存暂存 + sessionStorage，供目标页 getRouteNavParams 读取。
 */
export const ROUTE_NAV_PARAMS_KEY = '__oc_route_nav_params__'

let pendingNavParams = null

function safeClone (params) {
  if (!params || typeof params !== 'object') return null
  try {
    return JSON.parse(JSON.stringify(params))
  } catch (e) {
    return null
  }
}

function readSessionParams () {
  try {
    const raw = sessionStorage.getItem(ROUTE_NAV_PARAMS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (e) {
    return null
  }
}

function writeSessionParams (params) {
  try {
    if (!params) {
      sessionStorage.removeItem(ROUTE_NAV_PARAMS_KEY)
      return
    }
    const cloned = safeClone(params)
    if (cloned) sessionStorage.setItem(ROUTE_NAV_PARAMS_KEY, JSON.stringify(cloned))
  } catch (e) { /* ignore quota / private mode */ }
}

export function setRouteNavParams (params) {
  const cloned = safeClone(params)
  pendingNavParams = cloned
  writeSessionParams(cloned)
}

export function peekRouteNavParams () {
  return pendingNavParams && typeof pendingNavParams === 'object' ? pendingNavParams : null
}

export function clearRouteNavParams () {
  pendingNavParams = null
  writeSessionParams(null)
}

/**
 * 合并 route.params + sessionStorage + 本次 push 暂存，得到业务跳转参数。
 * @param {object} [route]
 * @param {{ consume?: boolean }} [opts] consume=true 时清掉暂存，避免重复应用
 */
export function getRouteNavParams (route, opts = {}) {
  const { consume = false } = opts
  const routeParams = (route && route.params) || {}
  const sessionParams = readSessionParams() || {}
  const pending = peekRouteNavParams() || {}
  if (consume) clearRouteNavParams()
  return {
    ...routeParams,
    ...sessionParams,
    ...pending,
  }
}
