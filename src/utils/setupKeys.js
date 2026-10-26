/**
 * 从 auth 抽出：hypervisor 等模块只需 setupKeys 判断时从此处引用，
 * 避免 auth ↔ hypervisor ↔ store 循环初始化导致 typeClouds TDZ。
 */
import * as R from 'ramda'
import * as Features from '@/constants/feature'
import { GROUP_VALIDATION_GROUPS } from '@/constants/feature'
import { getStore } from '@/store/accessor'

export function hasSetupKey (envs) {
  const store = getStore()
  if (!store) return true
  const { globalSetting = {} } = store.state
  if (!globalSetting || !globalSetting.value || !globalSetting.value.setupKeys || globalSetting.value.setupKeys.length === 0) return true
  const _envs = R.type(envs) === 'String' ? [envs] : envs
  if (!_envs.length) return true
  const { setupKeys } = globalSetting.value
  let f = false
  for (let i = 0; i < _envs.length; i++) {
    const env = _envs[i]
    // 开启组验证的组只校验成员，不单独校验组 key；其他情况直接校验 env
    if (Features.default.groups.includes(env) && GROUP_VALIDATION_GROUPS.includes(env)) {
      const childs = Features.default.items.filter(item => item.meta?.group === env)
      for (let j = 0; j < childs.length; j++) {
        if (setupKeys.indexOf(childs[j].key) > -1) {
          f = true
          break
        }
      }
      if (f) break
    } else if (setupKeys.indexOf(env) > -1) {
      f = true
      break
    }
  }
  return f
}
