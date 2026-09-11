import storage from '@/utils/storage'
import setting from '@/config/setting'

function clampL2MenuWidth (w) {
  const n = Number(w)
  if (!Number.isFinite(n)) return 160
  return Math.min(300, Math.max(160, Math.round(n)))
}

export default {
  state: {
    ...setting,
    // 当前路由是否具备可展示的二级菜单内容（收藏/关联菜单），不持久化
    l2MenuContentShow: false,
  },
  mutations: {
    SET_THEME (state, theme) {
      storage.set('__oc_theme__', theme)
      state.theme = theme
    },
    SET_THEME_COLOR (state, themeColor) {
      storage.set('__oc_theme_color__', themeColor)
      state.themeColor = themeColor
    },
    SET_THEME_BG_COLOR (state, themeBgColor) {
      storage.set('__oc_theme_bg_color__', themeBgColor)
      state.themeBgColor = themeBgColor
    },
    SET_L2_MENU_VISIBLE (state, visible) {
      storage.set('__oc_l2_menu_visible__', visible)
      state.l2MenuVisible = visible
    },
    SET_L2_MENU_CONTENT_SHOW (state, show) {
      state.l2MenuContentShow = !!show
    },
    SET_L2_MENU_WIDTH (state, width) {
      const next = clampL2MenuWidth(width)
      storage.set('__oc_l2_menu_width__', next)
      state.l2MenuWidth = next
    },
    SET_GLOBAL_ROUNDED (state, enabled) {
      state.globalRounded = !!enabled
    },
  },
}
