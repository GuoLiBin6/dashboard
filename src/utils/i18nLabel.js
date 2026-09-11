import * as R from 'ramda'
import i18n from '@/locales'

export function resolveLabel (raw) {
  if (!raw) return ''
  // 函数：动态 label
  if (R.is(Function, raw)) return raw()
  // 对象：{ t: 'xxx.yyy' }
  if (raw && typeof raw === 'object' && raw.t) {
    return i18n.te(raw.t) ? i18n.t(raw.t) : raw.t
  }
  // 字符串 key：'xxx.yyy'
  if (typeof raw === 'string' && i18n.te(raw)) {
    return i18n.t(raw)
  }
  // 已翻译好的普通字符串
  return raw
}
