// 全局配置 ant-design-vue
import { h, defineComponent, mergeProps, shallowRef, watch } from 'vue'
import { Spin, Form, Button, Input, InputNumber, Alert } from 'ant-design-vue'
import InfoCircleFilled from '@ant-design/icons-vue/es/icons/InfoCircleFilled'
import Icon from '@/components/Icon'

/** 未显式传 labelAlign 时默认左对齐 */
function setFormLabelAlignLeft (comp) {
  if (!comp || !comp.props || !comp.props.labelAlign) return
  comp.props.labelAlign.default = 'left'
}

const ALERT_INFO_ICON_STYLE = 'color: var(--ant-color-primary, #1890ff) !important;'

function isShowIconAttr (val) {
  return val === true || val === '' || val === 'true' || val === 1
}

/**
 * a-alert type=info 默认图标跟随主题色。
 * 用内联 style + !important（高于 antd CSS-in-JS / .anticon{color:inherit}）。
 */
function createThemedAlert (RawAlert) {
  return defineComponent({
    name: 'AAlert',
    inheritAttrs: false,
    props: {
      type: { type: String, default: undefined },
      showIcon: { type: Boolean, default: undefined },
      icon: { type: [Object, Function, String], default: undefined },
      banner: { type: Boolean, default: undefined },
      closable: { type: Boolean, default: undefined },
      closeText: { default: undefined },
      message: { default: undefined },
      description: { default: undefined },
      afterClose: { type: Function, default: undefined },
      prefixCls: { type: String, default: undefined },
      closeIcon: { default: undefined },
      onClose: { type: Function, default: undefined },
    },
    setup (props, { attrs, slots }) {
      return () => {
        const type = props.type ?? attrs.type ?? 'info'
        const showIcon = props.showIcon ?? attrs.showIcon ?? attrs['show-icon']
        // banner 默认展示图标（与 antd Alert 一致）
        const show = isShowIconAttr(showIcon) || (props.banner && showIcon === undefined)
        const hasCustomIcon = props.icon != null || !!slots.icon || attrs.icon != null
        const pass = {
          type: props.type,
          showIcon: props.showIcon,
          banner: props.banner,
          closable: props.closable,
          closeText: props.closeText,
          message: props.message,
          description: props.description,
          afterClose: props.afterClose,
          prefixCls: props.prefixCls,
          closeIcon: props.closeIcon,
          onClose: props.onClose,
          icon: props.icon,
        }
        // 去掉 undefined，避免覆盖 attrs
        Object.keys(pass).forEach((k) => {
          if (pass[k] === undefined) delete pass[k]
        })
        if (type === 'info' && show && !hasCustomIcon) {
          // 作为 prop 传入，确保挂到带 .ant-alert-icon 的节点上
          pass.icon = h(InfoCircleFilled, { style: ALERT_INFO_ICON_STYLE })
        }
        return h(RawAlert, mergeProps(attrs, pass), slots)
      }
    },
  })
}

/** 运行时再注入一层样式，保证排在 antd cssinjs 之后；模块加载时也执行，方便 HMR */
function ensureAlertInfoThemeStyle () {
  if (typeof document === 'undefined') return
  const id = 'oc-alert-info-theme'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = `
.ant-alert.ant-alert-info .ant-alert-icon,
.ant-alert.ant-alert-info .ant-alert-icon.anticon,
.ant-alert.ant-alert-info > .anticon {
  color: var(--ant-color-primary, #1890ff) !important;
}
.ant-alert.ant-alert-info .ant-alert-icon svg,
.ant-alert.ant-alert-info .ant-alert-icon svg path,
.ant-alert.ant-alert-info > .anticon svg,
.ant-alert.ant-alert-info > .anticon svg path {
  color: inherit !important;
  fill: currentColor !important;
}
`
}
ensureAlertInfoThemeStyle()

/**
 * primary / ghost / link / default hover，以及 Input hover/focus 跟随 --ant-color-primary。
 * ConfigProvider token 在兼容场景下常未落到 cssinjs（登录按钮/用户名框会变成 antd 默认蓝，
 * 而头像等业务样式已用 CSS 变量），造成登录页主题色不一致。
 */
function ensurePrimaryButtonThemeStyle () {
  if (typeof document === 'undefined') return
  const id = 'oc-btn-primary-theme'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('style')
    el.id = id
  }
  // 始终挂到 head 末尾，压过后续注入的 antd cssinjs
  document.head.appendChild(el)
  el.textContent = `
.ant-btn-primary:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):not(.ant-btn-background-ghost) {
  background-color: var(--ant-color-primary, #1890ff) !important;
  border-color: var(--ant-color-primary, #1890ff) !important;
  color: #fff !important;
}
.ant-btn-primary:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):not(.ant-btn-background-ghost):hover {
  background-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
  border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
}
.ant-btn-primary:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):not(.ant-btn-background-ghost):active {
  background-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 75%, #000) !important;
  border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 75%, #000) !important;
}
.ant-btn-primary.ant-btn-background-ghost:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous) {
  color: var(--ant-color-primary, #1890ff) !important;
  border-color: var(--ant-color-primary, #1890ff) !important;
  background: transparent !important;
}
.ant-btn-primary.ant-btn-background-ghost:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):hover {
  color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
  border-color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
}
.ant-btn.ant-btn-link:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous) {
  color: var(--ant-color-primary, #1890ff) !important;
}
.ant-btn.ant-btn-link:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):hover {
  color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
}
.ant-btn.ant-btn-default:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):hover,
.ant-btn.ant-btn-default:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):focus,
.ant-btn.ant-btn-default:not(:disabled):not(.ant-btn-disabled):not(.ant-btn-dangerous):active {
  color: var(--ant-color-primary, #1890ff) !important;
  border-color: var(--ant-color-primary, #1890ff) !important;
}
/* Input / Password：hover、focus 边框与光晕跟随主题色（登录用户名框等） */
.ant-input:not(.ant-input-disabled):not(.ant-input-borderless):hover,
.ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):not(.ant-input-affix-wrapper-borderless):hover {
  border-color: var(--ant-color-primary, #1890ff) !important;
}
.ant-input:not(.ant-input-disabled):focus,
.ant-input-focused,
.ant-input-affix-wrapper:not(.ant-input-affix-wrapper-disabled):focus,
.ant-input-affix-wrapper-focused {
  border-color: var(--ant-color-primary, #1890ff) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ant-color-primary, #1890ff) 20%, transparent) !important;
}
.ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input,
.ant-input-affix-wrapper-status-error:not(.ant-input-affix-wrapper-disabled):not(.ant-input-affix-wrapper-borderless).ant-input-affix-wrapper,
.ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:hover,
.ant-input-affix-wrapper-status-error:not(.ant-input-affix-wrapper-disabled):not(.ant-input-affix-wrapper-borderless).ant-input-affix-wrapper:hover,
.ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:focus,
.ant-input-affix-wrapper-status-error:not(.ant-input-affix-wrapper-disabled):not(.ant-input-affix-wrapper-borderless).ant-input-affix-wrapper-focused {
  border-color: #ff4d4f !important;
}
.ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:focus,
.ant-input-affix-wrapper-status-error:not(.ant-input-affix-wrapper-disabled):not(.ant-input-affix-wrapper-borderless).ant-input-affix-wrapper-focused {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
}
/* TopAlert 内链接（控制台地址 / 设置）跟随主题色 */
.global-top-alert.ant-alert .ant-alert-message a,
.global-top-alert-link {
  color: var(--ant-color-primary, #1890ff) !important;
}
.global-top-alert.ant-alert .ant-alert-message a:hover,
.global-top-alert-link:hover {
  color: color-mix(in srgb, var(--ant-color-primary, #1890ff) 85%, #000) !important;
}
`
}
ensurePrimaryButtonThemeStyle()

/** 表单 extra/explain 字重与正文一致，避免 cssinjs 后注入导致看起来偏粗 */
function ensureFormExtraFontStyle () {
  if (typeof document === 'undefined') return
  const id = 'oc-form-extra-font'
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = `
.ant-form-item .ant-form-item-extra,
.ant-form-item .ant-form-item-explain,
div.ant-form-item-extra,
div.ant-form-item-explain {
  font-weight: 400 !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`
}
ensureFormExtraFontStyle()

/** a-form-model-item 旧写法用 prop，antdv4 Form.Item 已改为 name 并会 warning。
 * 显式声明 prop/name，映射后只把 name 传给 Form.Item，避免 prop 落入 attrs 触发弃用 warning/异常。
 */
function createFormModelItem (RawFormItem) {
  return defineComponent({
    name: 'AFormModelItem',
    inheritAttrs: false,
    props: {
      prop: { type: [String, Number, Array], default: undefined },
      name: { type: [String, Number, Array], default: undefined },
    },
    setup (props, { attrs, slots }) {
      return () => {
        const name = props.name !== undefined && props.name !== null ? props.name : props.prop
        return h(RawFormItem, mergeProps(attrs, name !== undefined && name !== null ? { name } : {}), slots)
      }
    },
  })
}

/**
 * antdv4 Button.icon 需为 VNode；旧代码大量 icon="plus" 字符串会渲染成英文。
 * 包装 AButton：字符串 icon → 项目 Icon；显式透传 type/shape 等，避免 compat 下 attrs 丢失导致样式错乱。
 */
function createLegacyButton (RawButton) {
  const LegacyButton = defineComponent({
    name: 'AButton',
    inheritAttrs: false,
    props: {
      prefixCls: String,
      type: String,
      htmlType: { type: String, default: 'button' },
      shape: String,
      size: String,
      loading: { type: [Boolean, Object], default: false },
      disabled: { type: Boolean, default: undefined },
      ghost: { type: Boolean, default: undefined },
      block: { type: Boolean, default: undefined },
      danger: { type: Boolean, default: undefined },
      icon: { type: [String, Object, Function], default: undefined },
      href: String,
      target: String,
      title: String,
      onClick: Function,
      onMousedown: Function,
    },
    setup (props, { attrs, slots }) {
      return () => {
        const nextSlots = { ...slots }
        const {
          icon,
          ...restProps
        } = props

        if (typeof icon === 'string' && icon) {
          if (!nextSlots.icon) {
            nextSlots.icon = () => h(Icon, { type: icon })
          }
        } else if (icon != null) {
          restProps.icon = icon
        }

        return h(RawButton, mergeProps(restProps, attrs), nextSlots)
      }
    },
  })
  LegacyButton.Group = RawButton.Group
  LegacyButton.__ANT_BUTTON = true
  return LegacyButton
}

function normalizeTextInputValue (v) {
  if (v && typeof v === 'object' && v.target != null) return v.target.value
  return v
}

/**
 * antdv4 Input 受控时只认 props.value；v-decorator 只改 DOM 会在 focus/重渲染后被清空。
 * 包装本地值 + __decoratorSyncValue，与 InputNumber 同思路。
 */
function createLegacyInput (RawInput) {
  const LegacyInput = defineComponent({
    name: 'AInput',
    inheritAttrs: false,
    props: {
      value: { type: [String, Number], default: undefined },
      defaultValue: { type: [String, Number], default: undefined },
    },
    emits: ['change', 'update:value', 'blur', 'focus', 'input', 'pressEnter'],
    setup (props, { attrs, slots, emit, expose }) {
      const innerRef = shallowRef(null)
      const localValue = shallowRef(
        props.value !== undefined && props.value !== null
          ? props.value
          : (props.defaultValue ?? ''),
      )

      watch(
        () => props.value,
        (v) => {
          if (v !== undefined) localValue.value = v
        },
      )

      expose({
        focus: () => innerRef.value?.focus?.(),
        blur: () => innerRef.value?.blur?.(),
        __decoratorSyncValue: (v) => {
          if (v === undefined || v === null) return
          localValue.value = v
        },
      })

      return () => {
        const {
          onChange,
          onInput,
          'onUpdate:value': onUpdateValue,
          ...restAttrs
        } = attrs
        return h(RawInput, mergeProps(restAttrs, {
          ref: innerRef,
          value: localValue.value,
          onChange: (e) => {
            const next = normalizeTextInputValue(e)
            localValue.value = next
            emit('change', e)
            emit('update:value', next)
            if (typeof onChange === 'function') onChange(e)
          },
          onInput: (e) => {
            const next = normalizeTextInputValue(e)
            localValue.value = next
            emit('input', e)
            emit('update:value', next)
            if (typeof onInput === 'function') onInput(e)
          },
          'onUpdate:value': (v) => {
            localValue.value = v
            emit('update:value', v)
            if (typeof onUpdateValue === 'function') onUpdateValue(v)
          },
          onBlur: (e) => emit('blur', e),
          onFocus: (e) => emit('focus', e),
          onPressEnter: (e) => emit('pressEnter', e),
        }), slots)
      }
    },
  })
  LegacyInput.Group = RawInput.Group
  LegacyInput.Search = RawInput.Search
  LegacyInput.Password = RawInput.Password
  LegacyInput.TextArea = RawInput.TextArea
  return LegacyInput
}

/**
 * antdv4 InputNumber 用内部 mergedValue，v-decorator 在挂载后写入 props 往往不刷新展示。
 * 包装一层本地值 + __decoratorSyncValue，供兼容层安全同步 initialValue（不派发 DOM 事件）。
 */
function createLegacyInputNumber (RawInputNumber) {
  return defineComponent({
    name: 'AInputNumber',
    inheritAttrs: false,
    props: {
      value: { type: [Number, String], default: undefined },
      defaultValue: { type: [Number, String], default: undefined },
    },
    emits: ['change', 'update:value', 'blur', 'focus'],
    setup (props, { attrs, slots, emit, expose }) {
      const innerRef = shallowRef(null)
      const localValue = shallowRef(
        props.value !== undefined && props.value !== null
          ? props.value
          : props.defaultValue,
      )

      watch(
        () => props.value,
        (v) => {
          // 父级显式 :value（如 Disk sizeFieldValue）时跟随
          if (v !== undefined) localValue.value = v
        },
      )

      expose({
        focus: () => innerRef.value?.focus?.(),
        blur: () => innerRef.value?.blur?.(),
        __decoratorSyncValue: (v) => {
          if (v === undefined || v === null) return
          localValue.value = v
        },
      })

      return () => {
        const { onChange, 'onUpdate:value': onUpdateValue, ...restAttrs } = attrs
        return h(RawInputNumber, mergeProps(restAttrs, {
          ref: innerRef,
          value: localValue.value,
          onChange: (v) => {
            localValue.value = v
            emit('change', v)
            emit('update:value', v)
            if (typeof onChange === 'function') onChange(v)
          },
          'onUpdate:value': (v) => {
            localValue.value = v
            emit('update:value', v)
            if (typeof onUpdateValue === 'function') onUpdateValue(v)
          },
          onBlur: (e) => emit('blur', e),
          onFocus: (e) => emit('focus', e),
        }), slots)
      }
    },
  })
}

export default {
  autoRegister: false,
  install (app) {
    // 全局设置 loading icon（使用项目 Icon + spin，保证 a-spin 也会转圈）
    Spin.setDefaultIndicator({
      indicator: () =>
        h(Icon, {
          type: 'loading',
          spin: true,
          style: 'font-size: 24px',
        }),
    })

    // a-form / AForm：默认 labelAlign=left
    setFormLabelAlignLeft(Form)
    setFormLabelAlignLeft(app.component('AForm'))

    // 兼容旧写法 a-form-model / a-form-model-item（antdv4 已移除 FormModel）
    if (!app.component('AFormModel')) {
      app.component('AFormModel', Form)
    }
    // 始终覆盖：prop → name，避免 Form.Item 弃用警告
    app.component('AFormModelItem', createFormModelItem(Form.Item))
    setFormLabelAlignLeft(app.component('AFormModel'))

    // 始终包装原始 ant Button，避免 HMR / 重复 install 套娃
    app.component('AButton', createLegacyButton(Button))
    // a-alert info 图标 / primary·link·default 按钮跟随主题色
    ensureAlertInfoThemeStyle()
    ensurePrimaryButtonThemeStyle()
    ensureFormExtraFontStyle()
    app.component('AAlert', createThemedAlert(Alert))
    // Input：兼容 v-decorator initialValue，避免 focus 后清空
    app.component('AInput', createLegacyInput(Input))
    // InputNumber：兼容 v-decorator initialValue 展示
    app.component('AInputNumber', createLegacyInputNumber(InputNumber))
  },
}
