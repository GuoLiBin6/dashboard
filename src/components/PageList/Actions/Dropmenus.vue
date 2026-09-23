<template>
  <a-dropdown
    v-model:open="visible"
    :trigger="['click']"
    @openChange="handleVisibleChange">
    <action-button
      ref="dropdown-button"
      :class="{ 'ml-2': group }"
      :button-size="buttonSize"
      :row="row"
      :item="item"
      :button-type="buttonType"
      :button-style="buttonStyle"
      :button-block="buttonBlock"
      popover-trigger
      @clear-selected="clearSelected" />
    <template #overlay>
      <a-menu :selectable="false">
        <template v-if="!isSubmenus">
          <a-menu-item
            v-for="opt in flatOptions"
            :key="opt.label"
            class="sub-link-btn">
            <action-button
              button-size="small"
              :button-block="true"
              :button-style="{ fontSize: '12px' }"
              :item="opt"
              :row="row"
              @hidden-popover="hiddenPopover"
              @clear-selected="clearSelected" />
          </a-menu-item>
        </template>
        <template v-else>
          <a-sub-menu
            v-for="opt in groupOptions"
            :key="opt.label"
            class="submenu-item"
            :title="opt.label">
            <a-menu-item
              v-for="sub in getVisibleSubs(opt)"
              :key="`${opt.label}__${sub.label}`"
              class="submenu-item sub-link-btn">
              <action-button
                :item="sub"
                :row="row"
                button-size="small"
                :button-block="true"
                :button-style="{ fontSize: '12px' }"
                @hidden-popover="hiddenPopover"
                @clear-selected="clearSelected" />
            </a-menu-item>
          </a-sub-menu>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script>
import * as R from 'ramda'
import ActionButton from './ActionButton'

export default {
  name: 'PageListDropmenus',
  components: {
    ActionButton,
  },
  props: {
    item: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
    },
    buttonType: {
      type: String,
    },
    buttonSize: {
      type: String,
    },
    buttonStyle: {
      type: Object,
    },
    group: {
      type: Boolean,
    },
    buttonBlock: {
      type: Boolean,
    },
  },
  data () {
    return {
      visible: false,
      options: [],
      // 是否为组模式
      isSubmenus: false,
    }
  },
  computed: {
    flatOptions () {
      return this.options.filter(opt => !this.getHidden(opt))
    },
    groupOptions () {
      return this.options.filter(opt => !this.getSubmenusHidden(opt.submenus))
    },
  },
  methods: {
    getVisibleSubs (opt) {
      return (opt.submenus || []).filter(sub => !this.getHidden(sub))
    },
    genOptions () {
      if (!R.is(Function, this.item.actions)) {
        throw new Error('actions must be a function')
      }
      const options = this.item.actions(this.row)
      this.isSubmenus = options.length > 0 && options.every(item => Object.prototype.hasOwnProperty.call(item, 'submenus'))
      this.options = options
    },
    handleVisibleChange (visible) {
      const btn = this.$refs['dropdown-button']
      if (btn && btn.disabled) {
        this.visible = false
        return
      }
      if (visible) {
        this.genOptions()
      }
    },
    hiddenPopover () {
      this.visible = false
    },
    clearSelected () {
      this.$emit('clear-selected')
    },
    getHidden (item) {
      return R.is(Function, item.hidden) ? item.hidden(this.row) : item.hidden === true
    },
    getSubmenusHidden (submenus) {
      if (!submenus || !submenus.length) return true
      let hidden = true
      for (let i = 0, len = submenus.length; i < len; i++) {
        if (!this.getHidden(submenus[i])) {
          hidden = false
          break
        }
      }
      return hidden
    },
  },
}
</script>

<style lang="less">
.page-list-actions-dropmenus-wrap {
  .ant-popover-inner-content {
    padding-left: 5px !important;
    padding-right: 5px !important;
  }
}
/* overlay 挂到 body，需非 scoped；启用/禁用菜单项统一居中 */
.ant-dropdown-menu-item.sub-link-btn,
.ant-dropdown-menu-item.submenu-item {
  text-align: center;
  .ant-btn {
    text-align: center;
  }
  .ant-btn[disabled],
  .ant-btn:disabled {
    text-align: center;
  }
}
</style>

<style lang="less" scoped>
@import "../../../styles/less/theme";

.submenu-item {
  cursor: pointer;
  min-width: 130px;
}
.sub-link-btn {
  .ant-btn-link {
    color: rgba(0, 0, 0, 0.65);
    text-align: center;
  }
  .ant-btn-link[disabled] {
    color: rgba(0, 0, 0, 0.25);
    text-align: center;
  }
}
.submenu-item-label {
  font-size: 12px;
  color: #3c73b9;
  padding-top: 8px;
}
.ant-dropdown-menu-item, .ant-dropdown-menu-submenu-title {
  padding: 5px 0 !important;
  text-align: center;
}
</style>
