<template>
  <div>
    <a-dropdown
      :trigger="['click']"
      v-model:open="visible"
      @openChange="handleOpenChange">
      <div
        class="trigger d-flex align-items-center justify-content-center"
        :title="$t('common.more')"
        @mousedown.prevent>
        <icon type="navbar-more" style="font-size: 20px;" />
      </div>
      <template #overlay>
        <a-menu @click="handleDropdownClick">
          <a-menu-item key="/guide" v-if="isAdminMode && !isCE() && showMenuMap.feature_select && showMenuMap.more">{{$t('navbar.button.feature_select')}}</a-menu-item>
          <a-menu-item :key="docsUrl" v-if="showMenuMap.docs && showMenuMap.more">{{$t('navbar.button.docs')}}</a-menu-item>
          <a-menu-item key="/licenses" v-if="showMenuMap.about && showMenuMap.more">
            <span>{{isCE() || $store.getters.isSysCE ? $t('scope.text_145') : $t('navbar.button.about')}}</span>
            <icon v-if="!isOEM && isAdminMode && updateAvailable" type="cloud-upload" class="about-upgrade-icon ml-1" fill="#52c41a" style="color: #52c41a" />
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import setting from '@/config/setting'
import { isCE } from '@/utils/utils'
import { DOCS_MAP } from '@/constants/docs'

export default {
  name: 'HelpPopover',
  props: {
    showMenuMap: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    return {
      visible: false,
      updateAvailable: false,
      isCE,
      isOEM: setting.brand?.en !== setting.defaultBrand.en,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode']),
    docsUrl () {
      return DOCS_MAP.introduction()
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    if (!this.isOEM && !this.isCE() && !this.$store.getters.isSysCE) {
      this.manager = new this.$Manager('updates', 'v1')
      this.getUpdateInfo()
    }
  },
  methods: {
    getUpdateInfo () {
      this.manager.list({
        params: {
          $t: +new Date(),
        },
      }).then(res => {
        if (res.data.data && res.data.data.length) {
          const updateInfo = R.find(R.propEq('updateAvailable', true))(res.data.data)
          if (updateInfo) {
            this.updateAvailable = true
          }
        }
      })
    },
    handleOpenChange () {
      // Dropdown 打开后会再次聚焦触发器，延迟 blur 清掉 antd focus-visible 蓝框
      const blurActive = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
      this.$nextTick(blurActive)
      setTimeout(blurActive, 50)
    },
    handleDropdownClick (item) {
      if (item.key === 'setting') return
      const newWindow = item.key.startsWith('http')
      if (newWindow) {
        this.$openNewWindowForMenuHook('document_configured_callback_address.product_manual_callback_address', () => {
          window.open(item.key)
        })
      } else {
        this.$router.push(item.key)
      }
    },
  },
}
</script>

<style lang="less" scoped>
.trigger {
  height: 100%;
  // padding: 0 20px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:focus-visible,
  &:focus-within,
  &:active {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  :deep(*),
  :deep(*:focus),
  :deep(*:focus-visible) {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  :deep(.oc-icon) {
    color: inherit;
  }
}
.about-upgrade-icon,
.about-upgrade-icon.oc-icon,
:deep(.about-upgrade-icon) {
  color: #52c41a !important;
  fill: #52c41a !important;
}
</style>

<style lang="less">
/* 下拉菜单内升级图标保持绿色；压过 navbar hover 的 color:inherit */
.navbar-item-icon .about-upgrade-icon.oc-icon,
.navbar-item-icon:hover .about-upgrade-icon.oc-icon,
.ant-dropdown-menu .about-upgrade-icon.oc-icon {
  color: #52c41a !important;
  fill: #52c41a !important;
}

/* 盖过 antd cssinjs 的 :focus-visible 主色描边（specificity 较高） */
.navbar-item-icon.ant-dropdown-trigger:focus,
.navbar-item-icon.ant-dropdown-trigger:focus-visible,
.navbar-item-icon .ant-dropdown-trigger:focus,
.navbar-item-icon .ant-dropdown-trigger:focus-visible,
.navbar-item-icon .ant-popover-open:focus,
.navbar-item-icon .ant-popover-open:focus-visible,
.navbar-item-icon .trigger:focus,
.navbar-item-icon .trigger:focus-visible {
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
}
</style>
