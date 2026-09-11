import * as R from 'ramda'
import storage from '@/utils/storage'
import { getLanguage } from '@/utils/common/cookie'

const _l2MenuVisible = storage.get('__oc_l2_menu_visible__')
const _l2MenuWidth = storage.get('__oc_l2_menu_width__')
const defaultBrand = { 'zh-CN': '内置虚拟化', en: 'Buiilt-in Virtualization', 'ja-JP': '内蔵バーチャライゼーション' }

function clampL2MenuWidth (w) {
  const n = Number(w)
  if (!Number.isFinite(n)) return 160
  return Math.min(300, Math.max(160, Math.round(n)))
}

export default {
  language: getLanguage(),
  themeColor: storage.get('__oc_theme_color__') || process.env.THEME_COLOR || '#1890FF',
  // 全局圆角壳背景色（商业版可配）；默认 none → 灰色，不套主题色
  themeBgColor: storage.get('__oc_theme_bg_color__') || 'none',
  theme: storage.get('__oc_theme__') || process.env.THEME || 'dark',
  // 是否开启全局圆角样式；关闭时保持现有样式
  globalRounded: true,
  brand: process.env.BRAND || defaultBrand,
  defaultBrand,
  oemDictionary: process.env.OEM_DICTIONARY || {},
  product: process.env.PRODUCT || (process.env.VUE_APP_IS_PRIVATE ? { 'zh-CN': '云管平台', en: 'Cloud Management Platform', 'ja-JP': 'クラウド管理プラットフォーム' } : { 'zh-CN': 'Cloudpods', en: 'Cloudpods', 'ja-JP': 'Cloudpods' }),
  l2MenuVisible: !R.isNil(_l2MenuVisible) && !R.isNil(_l2MenuVisible) ? _l2MenuVisible : true,
  // EE 二级菜单可拖拽宽度（160–300），CE 不使用
  l2MenuWidth: clampL2MenuWidth(_l2MenuWidth),
  monitorAlertNotifyTriggerTime: process.env.VUE_APP_MONITOR_ALERT_NOTIFY_TRIGGER_TIME || 1000 * 60 * 60, // 默认值1小时
  oemVersion: process.env.OEM_VERSION || process.env.VUE_APP_OEM_VERSION || '',
}
