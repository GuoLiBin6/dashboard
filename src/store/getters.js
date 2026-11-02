import {
  THEME_BG_GRAY_HUE,
  DEFAULT_THEME_COLOR,
  DEFAULT_BG_LEVEL_LIGHT,
  DEFAULT_BG_LEVEL_GRAY_LIGHT,
  DEFAULT_DARK_BG_LEVEL,
  deriveBgColors,
  resolveBgLevel,
  nearestBgHue,
  isThemeBgGray,
} from '@/utils/theme/utils'

/** 开源版 / CE 版不允许自定义浅色背景 */
const isBgColorDisabled = state => !process.env.VUE_APP_IS_PRIVATE || state.app.isSysCE

export default {
  logo: (state, getters) => getters['app/logo'],
  loginLogo: (state, getters) => getters['app/loginLogo'],
  copyright: (state, getters) => getters['app/copyright'],
  hasBillingAccount: (state, getters) => getters['app/hasBillingAccount'],
  billingAccountCheckLoaded: (state, getters) => getters['app/billingAccountCheckLoaded'],
  workflow: state => state.app.workflow,
  scope: state => state.auth.scope,
  auth: state => state.auth,
  userInfo: state => state.auth.info,
  capability: state => state.auth.capability,
  permission: state => state.auth.permission,
  stats: state => state.auth.stats,
  scopeResource: state => state.auth.scopeResource,
  windows: state => state.window.windows,
  common: state => state.common,
  dialogs: state => state.dialog.dialogs,
  sidePages: state => state.sidePage.sidePages,
  isAdminMode: (state, getters) => getters['auth/isAdminMode'],
  isDomainMode: (state, getters) => getters['auth/isDomainMode'],
  isProjectMode: (state, getters) => getters['auth/isProjectMode'],
  l3PermissionEnable: (state, getters) => getters['auth/l3PermissionEnable'],
  currentScopeResource: (state, getters) => getters['auth/currentScopeResource'],
  isSidepageOpen: (state, getters) => getters['sidePage/isSidepageOpen'],
  userConfigInfo: (state, getters) => state.userConfig.info,
  profile: (state, getters) => state.profile.data,
  theme: (state) => {
    const profile = state.profile.data
    return (profile.value && profile.value.theme) || state.setting.theme
  },
  // 全站深色模式（独立于侧栏 theme，仅本地偏好）
  // 深色模式为商业版能力：开源版 / CE 版一律不生效，即使本地存有商业版的偏好
  darkMode: (state) => {
    if (!process.env.VUE_APP_IS_PRIVATE || state.app.isSysCE) return false
    return !!state.setting.darkMode
  },
  // 开源版仅默认蓝色；商业版才读 profile / 本地多主题色
  themeColor: (state) => {
    const isOpenSource = !process.env.VUE_APP_IS_PRIVATE || state.app.isSysCE
    if (isOpenSource) {
      return process.env.THEME_COLOR || DEFAULT_THEME_COLOR
    }
    const profile = state.profile.data
    return (profile.value && profile.value.themeColor) || state.setting.themeColor || DEFAULT_THEME_COLOR
  },
  // ===== 背景色：两层选择（色系 + 渐变深度）=====
  // 浅色色系：未设置过 → 跟随主题色（主题色也无 → 拂晓蓝）；显式 none/gray → 灰色系
  themeBgHue: (state, getters) => {
    if (isBgColorDisabled(state)) return THEME_BG_GRAY_HUE
    const hue = state.setting.themeBgHue
    // 注意顺序：isThemeBgGray 对空值也返回 true，必须先判「是否设置过」
    if (hue) return isThemeBgGray(hue) ? THEME_BG_GRAY_HUE : hue
    // 兼容历史彩色背景（仅当旧值确实是一个彩色 hex 时）
    const profile = state.profile.data
    const legacy = (profile.value && profile.value.themeBgColor) || state.setting.themeBgColor
    if (!isThemeBgGray(legacy)) return nearestBgHue(legacy)
    // 完全没设置过：跟随主色系
    return getters.themeColor || DEFAULT_THEME_COLOR
  },
  themeBgLevel: (state, getters) => resolveBgLevel(
    state.setting.themeBgLevel,
    getters.themeBgHue === THEME_BG_GRAY_HUE ? DEFAULT_BG_LEVEL_GRAY_LIGHT : DEFAULT_BG_LEVEL_LIGHT,
  ),
  // 浅色色板：灰色系出中性灰梯度
  themeBgPalette: (state, getters) => deriveBgColors(getters.themeBgHue, false),
  // 浅色实际底色
  themeBgColor: (state, getters) => {
    const level = resolveBgLevel(
      state.setting.themeBgLevel,
      getters.themeBgHue === THEME_BG_GRAY_HUE ? DEFAULT_BG_LEVEL_GRAY_LIGHT : DEFAULT_BG_LEVEL_LIGHT,
    )
    return getters.themeBgPalette[level]
  },
  // 深色色系：空 → 跟随主题色
  themeDarkBgHue: (state, getters) => state.setting.themeDarkBgHue || getters.themeColor,
  themeDarkBgLevel: (state) => resolveBgLevel(state.setting.themeDarkBgLevel, DEFAULT_DARK_BG_LEVEL),
  themeDarkBgPalette: (state, getters) => deriveBgColors(getters.themeDarkBgHue, true),
  // 深色实际底色
  darkBgColor: (state, getters) => {
    return getters.themeDarkBgPalette[resolveBgLevel(state.setting.themeDarkBgLevel, DEFAULT_DARK_BG_LEVEL)]
  },
  globalRounded: state => !!state.setting.globalRounded,
  setting: state => state.setting,
  scopedPolicy: state => state.scopedPolicy,
  globalConfig: state => state.common.globalConfig,
  projectTags: state => state.projectTags,
  globalSetting: state => state.globalSetting,
  isSysCE: state => state.app.isSysCE,
}
