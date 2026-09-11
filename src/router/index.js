/**
 * Root Router
 * author: houjiazong <houjiazong@gmail.com>
 * date: 2018/08/07
 */
import { createRouter, createWebHistory } from 'vue-router'
import { getProductName } from '@/utils/auth'
import { resolveLabel } from '@/utils/i18nLabel'
import routes from './routes'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

const originalPush = router.push
const originalReplace = router.replace
router.push = function push (location) {
  return originalPush.call(this, location).catch(err => err)
}
router.replace = function replace (location) {
  return originalReplace.call(this, location).catch(err => err)
}

router.afterEach((to, from) => {
  const name = getProductName()
  const rawLabel = to.meta?.label
  const labelText = resolveLabel(rawLabel)
  document.title = labelText ? `${name}-${labelText}` : name
})

export default router
