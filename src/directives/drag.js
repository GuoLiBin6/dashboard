import Vue from 'vue'

export function bindDialogDrag (wrap) {
  if (!wrap || wrap.__ocDialogDragCleanup) return wrap.__ocDialogDragCleanup
  const header = wrap.querySelector('.ant-modal-header')
  const dragDom = wrap.querySelector('.ant-modal')
  if (!header || !dragDom) return null

  header.style.cursor = 'move'
  header.style.userSelect = 'none'

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target && e.target.closest && e.target.closest('.ant-modal-close')) return
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startLeft = dragDom.offsetLeft
    const startTop = dragDom.offsetTop
    const maxLeft = Math.max(0, document.documentElement.clientWidth - dragDom.offsetWidth)
    const maxTop = Math.max(0, document.documentElement.clientHeight - dragDom.offsetHeight)

    dragDom.style.position = 'relative'
    dragDom.style.margin = '0'
    dragDom.style.transform = 'none'
    dragDom.style.left = `${startLeft}px`
    dragDom.style.top = `${startTop}px`
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev) => {
      let left = startLeft + ev.clientX - startX
      let top = startTop + ev.clientY - startY
      if (left < 0) left = 0
      if (top < 0) top = 0
      if (left > maxLeft) left = maxLeft
      if (top > maxTop) top = maxTop
      dragDom.style.left = `${left}px`
      dragDom.style.top = `${top}px`
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  header.addEventListener('mousedown', onMouseDown)
  const cleanup = () => {
    header.removeEventListener('mousedown', onMouseDown)
    wrap.__ocDialogDragCleanup = null
  }
  wrap.__ocDialogDragCleanup = cleanup
  return cleanup
}

export function unbindDialogDrag (wrap) {
  if (wrap && typeof wrap.__ocDialogDragCleanup === 'function') {
    wrap.__ocDialogDragCleanup()
  }
}

const dialogDrag = {
  mounted () {},
  bind () {},
}

Vue.directive('dialogDrag', dialogDrag)

export default dialogDrag
