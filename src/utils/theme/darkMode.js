/**
 * 深色模式（Dark Mode）DOM 标记同步。
 *
 * 标记挂在 <html> 上，便于 Modal / Dropdown / Select 等挂在 body 的浮层也能命中样式。
 * 放在 mutation 里调用（而不是只依赖 App.vue 的 watch），保证「点开关即刻生效」。
 *
 * vxe-table / vxe-pc-ui 自带 [data-vxe-ui-theme=dark] 的完整暗色变量
 * （表头、行 hover、勾选行、输入框、分页…），这里同步切换该属性，
 * 避免逐条覆盖变量时漏掉状态色（hover / 选中变成白底）。
 * 项目侧的微调仍写在 styles/less/dark.less。
 */
export const DARK_MODE_CLASS = 'oc-dark-mode'

export function applyDarkModeClass (on) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!root) return
  const dark = !!on
  root.classList.toggle(DARK_MODE_CLASS, dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  if (dark) {
    root.setAttribute('data-vxe-ui-theme', 'dark')
  } else {
    root.setAttribute('data-vxe-ui-theme', 'light')
  }
}

/**
 * 深色模式下页面底色：写到 <html> 的内联变量上。
 * dark.less 里 --oc-dark-bg 只作浅色/未指定时的兜底，
 * 内联优先级更高，body / #app / 非圆角壳都能一并跟随。
 */
export function applyDarkBgColor (hex) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (!root) return
  if (hex) {
    root.style.setProperty('--oc-dark-bg', hex)
  } else {
    root.style.removeProperty('--oc-dark-bg')
  }
}

/**
 * 当前是否处于深色模式。
 * 供 canvas 类组件（echarts）读取 —— 它们吃不到 CSS 变量，需要 JS 判断。
 */
export function isDarkMode () {
  if (typeof document === 'undefined') return false
  return !!document.documentElement && document.documentElement.classList.contains(DARK_MODE_CLASS)
}
