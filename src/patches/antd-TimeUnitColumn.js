/**
 * TimeUnitColumn 补丁：避免 props 名 onSelect（Vue/compat 会当成事件监听弄丢）。
 * 使用 selectHandler 接收列点击回调。
 */
import { createVNode as _createVNode } from 'vue'
import { scrollTo, waitElementReady } from 'ant-design-vue/es/vc-picker/utils/uiUtil'
import { useInjectPanel } from 'ant-design-vue/es/vc-picker/PanelContext'
import classNames from 'ant-design-vue/es/_util/classNames'
import { ref, onBeforeUnmount, watch, defineComponent, nextTick, shallowRef } from 'vue'

function resolveSelect (val) {
  if (typeof val === 'function') return val
  if (Array.isArray(val)) {
    const fn = val.find((v) => typeof v === 'function')
    return typeof fn === 'function' ? fn : null
  }
  return null
}

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'TimeUnitColumn',
  inheritAttrs: false,
  props: ['prefixCls', 'units', 'selectHandler', 'onSelect', 'value', 'active', 'hideDisabledOptions'],
  setup (props) {
    const { open } = useInjectPanel()
    const ulRef = shallowRef(null)
    const liRefs = ref(new Map())
    const scrollRef = ref()

    watch(() => props.value, () => {
      const li = liRefs.value.get(props.value)
      if (li && open.value !== false) {
        scrollTo(ulRef.value, li.offsetTop, 120)
      }
    })

    onBeforeUnmount(() => {
      scrollRef.value && scrollRef.value()
    })

    watch(open, () => {
      scrollRef.value && scrollRef.value()
      nextTick(() => {
        if (open.value) {
          const li = liRefs.value.get(props.value)
          if (li) {
            scrollRef.value = waitElementReady(li, () => {
              scrollTo(ulRef.value, li.offsetTop, 0)
            })
          }
        }
      })
    }, { immediate: true, flush: 'post' })

    return () => {
      const {
        prefixCls,
        units,
        selectHandler,
        onSelect,
        value,
        active,
        hideDisabledOptions,
      } = props
      const select = resolveSelect(selectHandler) || resolveSelect(onSelect)
      const cellPrefixCls = `${prefixCls}-cell`
      return _createVNode('ul', {
        class: classNames(`${prefixCls}-column`, {
          [`${prefixCls}-column-active`]: active,
        }),
        ref: ulRef,
        style: { position: 'relative' },
      }, [(units || []).map((unit) => {
        if (hideDisabledOptions && unit.disabled) return null
        return _createVNode('li', {
          key: unit.value,
          ref: (element) => {
            liRefs.value.set(unit.value, element)
          },
          class: classNames(cellPrefixCls, {
            [`${cellPrefixCls}-disabled`]: unit.disabled,
            [`${cellPrefixCls}-selected`]: value === unit.value,
          }),
          onClick: (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (unit.disabled) return
            if (select) select(unit.value)
          },
        }, [_createVNode('div', {
          class: `${cellPrefixCls}-inner`,
        }, [unit.label])])
      })])
    }
  },
})
