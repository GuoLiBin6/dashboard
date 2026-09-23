<script>
import * as R from 'ramda'
import { Tooltip as ATooltip } from 'ant-design-vue'
import { hasPermission } from '@/utils/auth'

export default {
  name: 'PageListActionButton',
  props: {
    item: {
      type: Object,
    },
    row: {
      type: Object,
    },
    rows: {
      type: Array,
    },
    buttonType: {
      type: String,
      default: 'link',
    },
    buttonSize: {
      type: String,
      default: 'default',
    },
    buttonStyle: {
      type: Object,
    },
    buttonBlock: {
      type: Boolean,
      default: false,
    },
    // 是否作为 popover 的 trigger 渲染
    popoverTrigger: Boolean,
  },
  computed: {
    label () {
      return this.item.label
    },
    meta () {
      const raw = R.is(Function, this.item.meta) ? this.item.meta(this.row) : null
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { validate: true }
      }
      // 禁止对 Vue 组件实例做 rest 展开（会触发 ownKeys 警告）
      if (raw.$ && typeof raw.$ === 'object') {
        return { validate: true }
      }
      const { validate = true, ...rest } = raw
      return {
        validate,
        ...rest,
      }
    },
    extraMeta () {
      const raw = R.is(Function, this.item.extraMeta) ? this.item.extraMeta(this.row) : null
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { validate: true }
      }
      if (raw.$ && typeof raw.$ === 'object') {
        return { validate: true }
      }
      const { validate = true, ...rest } = raw
      return {
        validate,
        ...rest,
      }
    },
    disabled () {
      const isValidate = this.meta.validate
      const isExtraValidate = this.extraMeta?.validate
      let isPermission = true
      // singleAction判断
      if (this.item.permission && this.row) {
        isPermission = hasPermission({ key: this.item.permission, resourceData: this.row })
      }
      // groupActions判断
      if (this.item.permission && !this.row && this.rows && this.rows.length && this.meta.buttonType !== 'primary') {
        isPermission = this.rows.every(item => {
          return hasPermission({ key: this.item.permission, resourceData: item })
        })
      }
      if (this.item.permission && !this.row && ((!this.rows || !this.rows.length) || this.meta.buttonType === 'primary')) {
        isPermission = hasPermission({ key: this.item.permission, resourceData: null })
      }
      return !isValidate || !isPermission || !isExtraValidate
    },
    tooltip () {
      return this.meta.tooltip || this.extraMeta.tooltip
    },
    // 有有效提示内容才包 Tooltip（空串/false 不算）
    hasTooltip () {
      const t = this.tooltip
      return !(t == null || t === false || t === '')
    },
  },
  methods: {
    handleClick (e) {
      e.stopPropagation()
      if (this.disabled) return
      this.$emit('hidden-popover', e)
      this.item.action(this.row)
      // this.$emit('clear-selected')
    },
    handlePopoverClick (e) {
      e.stopPropagation()
      this.$emit('click', e)
    },
    // 挂到菜单项内，避免 portal 到 body 抢走 hover、弄坏二级菜单
    getTooltipPopupContainer (node) {
      return (node && node.parentElement) || document.body
    },
  },
  render (h) {
    // antdv4：在 a-menu-item/a-dropdown 等场景需要稳定的单一根节点，避免 Fragment 导致内部取 parentNode 报错
    const baseBtnProps = {
      style: this.buttonStyle,
      block: this.buttonBlock,
      size: this.buttonSize,
      type: this.meta.buttonType || this.buttonType,
      disabled: this.disabled,
    }

    let action
    if (this.popoverTrigger) {
      const btnType = this.meta.buttonType || this.buttonType
      action = h('a-button', {
        ...baseBtnProps,
        class: {
          'page-list-action-trigger': true,
          'page-list-action-dropdown-btn': btnType === 'primary',
        },
        onClick: this.handlePopoverClick,
      }, {
        default: () => [
          this.label,
          // 同时给 props/type，兼容你们自定义 icon 的两种取参方式
          h('icon', { class: 'ml-1 page-list-action-dropdown-icon', props: { type: 'pull-down' }, type: 'pull-down' }),
        ],
      })
    } else {
      action = h('a-button', {
        ...baseBtnProps,
        onClick: this.handleClick,
      }, {
        default: () => [this.label],
      })
    }

    // 下拉触发器不要包 Tooltip，否则会弄坏 a-dropdown
    // 菜单项：Tooltip + 拉满宽度，禁用态也可居中；popup 挂父节点，二级菜单可正常 hover
    if (!this.popoverTrigger && this.hasTooltip) {
      const trigger = h('span', {
        class: 'page-list-action-tooltip-trigger',
        style: { display: 'block', width: '100%', textAlign: 'center' },
      }, [action])
      const tip = this.tooltip
      const tooltipProps = {
        placement: 'left',
        destroyTooltipOnHide: true,
        getPopupContainer: this.getTooltipPopupContainer,
      }
      if (typeof tip === 'string') {
        tooltipProps.title = tip
        action = h(ATooltip, tooltipProps, { default: () => [trigger] })
      } else {
        action = h(ATooltip, tooltipProps, {
          title: () => tip,
          default: () => [trigger],
        })
      }
    }

    if (this.item.render) {
      action = this.item.render(
        this.row,
        {
          style: this.buttonStyle,
          block: this.buttonBlock,
          size: this.buttonSize,
          type: this.meta.buttonType || this.buttonType,
          disabled: this.disabled,
          onClick: this.handleClick,
        },
        h,
      )
    }

    // 直接返回单个 VNode，避免额外 wrapper 影响 antd menu/button 样式与可见性
    return action
  },
}
</script>

<style lang="less">
@import "../../../styles/less/theme";

/* 仅操作列下拉触发文字；不影响弹层内菜单项 */
.page-list-action-trigger.ant-btn-link:not(:disabled) {
  color: var(--ant-color-primary, @primary-color);
  .page-list-action-dropdown-icon {
    color: inherit;
  }
  &:hover,
  &:focus,
  &.ant-dropdown-open {
    color: var(--ant-color-primary, @primary-color) !important;
    background-color: rgba(0, 0, 0, 0.06);
  }
}

.page-list-action-dropdown-btn {
  .page-list-action-dropdown-icon {
    color: inherit;
  }
}
</style>
