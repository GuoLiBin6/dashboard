<template>
  <div class="cloudaccount pt-2">
    <a-alert type="info" show-icon class="mt-2" v-if="!isCE && !$store.getters.isSysCE && $store.getters.isAdminMode">
      <template #message>{{$t('cloudenv.text_223')}}<icon type="navbar-more" style="font-size: 15px;" />{{$t('cloudenv.text_224')}}</template>
    </a-alert>
    <template v-for="(cloudaccounts, env) of types" :key="env">
      <div class="env-item-wrap my-5" v-if="isShowItem(env)">
        <h2 class="mb-3">{{ envTitle[env] }}</h2>
        <div class="items d-flex flex-wrap">
          <template v-for="(item, cloudaccount) of cloudaccounts" :key="cloudaccount">
            <div
              class="item mr-3"
              v-if="isShowItem(item)"
              :class="{ active: currentItem.name === item.name, 'is-logo-only': item.hiddenName }"
              @click="selectProvider(item)">
              <img class="item-logo" :src="item.logo" :style="logoStyle(item)" />
              <h5 v-if="showName(item)">{{ item.name }}</h5>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { CLOUDACCOUNT_TYPES, ENV_TITLE } from '@Cloudenv/views/cloudaccount/constants'
import { isCE } from '@/utils/utils'
import { hasSetupKey, billSupportBrands } from '@/utils/auth'
import setting from '@/config/setting'

export default {
  name: 'SelectCloudaccount',
  props: {
    currentItem: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      envTitle: ENV_TITLE,
    }
  },
  computed: {
    isCE () {
      return isCE()
    },
    globalSettingSetupKeys () {
      const { globalSetting } = this.$store.state
      if (globalSetting && globalSetting.value) {
        return globalSetting.value.setupKeys
      }
      return undefined
    },
    types () {
      const typesMap = {}
      for (const box in CLOUDACCOUNT_TYPES) {
        for (const brand in CLOUDACCOUNT_TYPES[box]) {
          if (hasSetupKey([brand])) {
            if (!typesMap[box]) {
              typesMap[box] = {
                [brand]: CLOUDACCOUNT_TYPES[box][brand],
              }
            } else {
              typesMap[box][brand] = CLOUDACCOUNT_TYPES[box][brand]
            }
            if (brand === 'cloudpods') {
              const { companyInfo = {} } = this.$store.state.app
              const { inner_copyright_en, inner_copyright, inner_logo, inner_logo_format } = companyInfo
              CLOUDACCOUNT_TYPES[box][brand].name = setting.language === 'en' ? (inner_copyright_en || CLOUDACCOUNT_TYPES[box][brand].name) : (inner_copyright || CLOUDACCOUNT_TYPES[box][brand].name)
              CLOUDACCOUNT_TYPES[box][brand].logo = inner_logo && inner_logo_format ? `data:${inner_logo_format};base64,${inner_logo}` : CLOUDACCOUNT_TYPES[box][brand].logo
            }
          }
        }
      }
      if (hasSetupKey(['bill']) && !hasSetupKey(['onecloud', 'public', 'private', 'vmware', 'storage'])) {
        const setUpKeys = this.globalSettingSetupKeys || []
        const billTargetItems = billSupportBrands.filter(key => setUpKeys.includes('bill_' + key))
        if (!billTargetItems.length) {
          // 旧版本 license只签发bill
          if (!hasSetupKey('public')) {
            if (!typesMap.public) {
              typesMap.public = {}
            }
            billSupportBrands.map(key => {
              typesMap.public[key] = CLOUDACCOUNT_TYPES.public[key]
            })
          }
        } else {
          // 新版本 license签发billItem
          typesMap.public = typesMap.public || {}
          billTargetItems.map(key => {
            typesMap.public[key] = CLOUDACCOUNT_TYPES.public[key]
          })
        }
      }
      return typesMap
    },
  },
  watch: {
    globalSettingSetupKeys: {
      handler (value) {
        if (value && value.length > 0 && this.defaultItem()) {
          this.$emit('update:currentItem', this.defaultItem())
        }
      },
      immediate: true,
    },
  },
  methods: {
    defaultItem () {
      for (const env in this.types) {
        for (const provider in this.types[env]) {
          if (this.globalSettingSetupKeys.indexOf(provider.toLowerCase()) > -1) {
            return this.types[env][provider]
          }
        }
      }
    },
    isShowItem (item) {
      if (this.globalSettingSetupKeys === undefined) {
        return true
      }
      if (typeof item === 'string') {
        if (item === 'private' && this.globalSettingSetupKeys.indexOf('vmware') > -1) return true
        return this.globalSettingSetupKeys.indexOf(item) > -1 || (this.globalSettingSetupKeys.indexOf('bill') > -1 && this.isBillEnv(item))
      }
      return this.globalSettingSetupKeys.indexOf(item.provider.toLowerCase()) > -1 || this.isShowBillItem(item)
    },
    isBillEnv (env) {
      if (env === 'public') {
        return true
      }
      return false
    },
    isShowBillItem (item) {
      if (this.globalSettingSetupKeys.indexOf('bill') === -1) return false
      if (billSupportBrands.indexOf(item.provider.toLowerCase()) > -1) {
        if (this.globalSettingSetupKeys.indexOf(`bill_${item.provider.toLowerCase()}`) > -1) {
          return true
        }
      }
      return false
    },
    selectProvider (item) {
      this.$emit('update:currentItem', item)
    },
    showName (item) {
      if (item.hiddenName === true) {
        return false
      } else {
        return true
      }
    },
    // 只采用宽高配置，忽略 position/top/right，避免破坏垂直居中
    logoStyle (item) {
      const style = item.logoStyle || {}
      if (item.hiddenName === true) {
        return {
          display: 'block',
          width: style.width || '100px',
          height: style.height || '24px',
        }
      }
      return {
        display: 'block',
        height: style.height || '24px',
        width: style.width || 'auto',
        maxHeight: '24px',
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import '@/styles/less/theme';

.cloudaccount {
  h2 {
    font-size: 14px;
    margin: 0;
    font-weight: 700;
  }

  .items {
    gap: 0;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    max-width: 150px;
    min-height: 40px;
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid #eee;
    border-radius: 6px;
    box-sizing: border-box;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.85);
    background: #fff;
    transition: border-color 0.15s ease, color 0.15s ease;

    &.is-logo-only {
      min-width: 120px;
      max-width: 160px;
    }

    .item-logo {
      flex-shrink: 0;
      display: block;
      vertical-align: middle;
    }

    h5 {
      margin: 0 0 0 8px;
      font-size: 14px;
      font-weight: 400;
      line-height: 24px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    &:hover,
    &.active {
      border-color: var(--antd-wave-shadow-color, @primary-color);
      color: var(--antd-wave-shadow-color, @primary-color);

      h5 {
        color: var(--antd-wave-shadow-color, @primary-color);
      }
    }
  }
}
</style>
