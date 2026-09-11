<template>
  <div>
    <a-dropdown :trigger="['click']" :getPopupContainer="triggerNode => triggerNode.parentNode">
      <div class="trigger d-flex align-items-center justify-content-center">
        <a-tooltip :title="$t('common.more')" placement="bottom">
          <icon type="navbar-more" style="font-size: 20px;" />
        </a-tooltip>
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
/* 下拉挂在 navbar-item-icon 内，需压过其 :hover color:inherit !important */
.navbar-item-icon .about-upgrade-icon.oc-icon,
.navbar-item-icon:hover .about-upgrade-icon.oc-icon,
.ant-dropdown-menu .about-upgrade-icon.oc-icon {
  color: #52c41a !important;
  fill: #52c41a !important;
}
</style>
