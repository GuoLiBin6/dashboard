/**
 * Root Router
 * author: houjiazong <houjiazong@gmail.com>
 * date: 2018/08/07
 */
import { createRouter, createWebHistory } from 'vue-router'
import { getProductName } from '@/utils/auth'
import { resolveLabel } from '@/utils/i18nLabel'
import { setRouteNavParams } from '@/utils/routeNavParams'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

/** VR4 丢弃非 path params：跳转前写入内存/sessionStorage，勿写 history.state */
function withNavParams (location) {
  if (!location || typeof location !== 'object' || !location.params) return location
  const params = location.params
  if (!params || typeof params !== 'object' || !Object.keys(params).length) return location
  setRouteNavParams(params)
  return location
}

const originalPush = router.push
const originalReplace = router.replace
router.push = function push (location) {
  return originalPush.call(this, withNavParams(location)).catch(err => err)
}
router.replace = function replace (location) {
  return originalReplace.call(this, withNavParams(location)).catch(err => err)
}

router.afterEach((to, from) => {
  const name = getProductName()
  const rawLabel = to.meta?.label
  const labelText = resolveLabel(rawLabel)
  document.title = labelText ? `${name}-${labelText}` : name
})

export default router
