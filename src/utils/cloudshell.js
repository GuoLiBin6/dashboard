/**
 * CloudShell 最大高度：顶边不超过 navbar 底边 + --oc-page-inset + 12px。
 * margin-top 仍为 --oc-page-inset；额外 12px 通过限制最大高度体现。
 */
export function getCloudShellGap () {
  const app = document.getElementById('app')
  if (!app || !app.classList.contains('app-global-rounded')) return 0
  const inset = parseFloat(getComputedStyle(app).getPropertyValue('--oc-page-inset'))
  return Number.isFinite(inset) ? inset : 5
}

/** 上安全边界相对 navbar+inset 再下移的额外距离 */
export const CLOUDSHELL_TOP_SAFE_EXTRA = 12

export function getMaxCloudShellHeight () {
  const minHeight = 28
  const app = document.getElementById('app')
  const navbar = document.querySelector('.navbar-wrap')
  const viewH = document.documentElement.clientHeight || window.innerHeight || document.body.offsetHeight || 0

  if (!app) {
    return Math.max(minHeight, viewH - 60 - CLOUDSHELL_TOP_SAFE_EXTRA)
  }

  const styles = getComputedStyle(app)
  const rect = app.getBoundingClientRect()
  const padTop = parseFloat(styles.paddingTop) || 0
  const padBottom = parseFloat(styles.paddingBottom) || 0
  const gap = getCloudShellGap()
  const navbarH = parseFloat(styles.getPropertyValue('--oc-navbar-height')) || 60

  const contentTop = rect.top + padTop
  const contentBottom = rect.bottom - padBottom

  let navBottom = contentTop + navbarH
  if (navbar && navbar.getBoundingClientRect) {
    const bottom = navbar.getBoundingClientRect().bottom
    if (Number.isFinite(bottom)) navBottom = Math.max(navBottom, bottom)
  }

  // 上安全边界 = navbar 下方 inset，再下移 12px
  const safeTop = navBottom + gap + CLOUDSHELL_TOP_SAFE_EXTRA
  return Math.max(minHeight, Math.floor(contentBottom - safeTop))
}
