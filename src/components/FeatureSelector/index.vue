<template>
  <div>
    <div v-for="mod in moduleGroups" :key="mod.key">
      <div class="module">
        <span class="title">{{ mod.label }}</span>
        <template v-for="g in mod.groups" :key="g.key">
          <div v-if="!g.licenseDisabled" class="group">
            <div class="title">{{ g.label }}</div>
            <div class="d-flex flex-wrap">
              <div
                v-if="g.items && g.items.length > 1"
                class="item d-flex p-2 mr-3 align-items-center"
                :class="{ checked: g.checked }"
                @click="onClickGroup(g)">
                <span class="flex-fill">{{ $t('scope.text_114') }}</span>
              </div>
              <a-tooltip
                v-for="item in g.visibleItems"
                :key="item.key"
                :title="item.disabled ? item.reason : ''">
                <div
                  class="item d-flex p-2 mr-3 align-items-center"
                  :class="{ checked: item.checked, disabled: item.disabled }"
                  @click="handleItemClick(item)">
                  <img v-if="item.icon" :src="item.icon" :style="item.logoStyle ? item.logoStyle : 'width: 24px'" />
                  <span v-if="!item.hiddenName" class="flex-fill">{{ item.label }}</span>
                </div>
              </a-tooltip>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapState } from 'vuex'
import i18n from '@/locales'
import originC from '@/constants/feature'
import setting from '@/config/setting'
import { fillBillSupportFeatures } from '@/utils/auth'
import { isSAAS } from '@/utils/utils'

const languageList = ['zh-CN', 'ja-JP', 'en']

const languageItems = [
  {
    key: 'zh-CN',
    label: '简体中文',
    value: 'zh-CN',
    checked: true,
    disabled: false,
    meta: {
      group: 'language',
      is_account: false,
      is_feature: true,
      module: 'resource_managent',
    },
  },
  {
    key: 'en',
    label: 'English',
    value: 'en',
    checked: true,
    disabled: false,
    meta: {
      group: 'language',
      is_account: false,
      is_feature: true,
      module: 'resource_managent',
    },
  },
  {
    key: 'ja-JP',
    label: '日本語',
    value: 'ja-JP',
    checked: true,
    disabled: false,
    meta: {
      group: 'language',
      is_account: false,
      is_feature: true,
      module: 'resource_managent',
    },
  },
]

const c = R.clone(originC)
if (isSAAS()) {
  c.groups.push('language')
  c.items.push(...languageItems)
  if (c.moduleGroups[0]) {
    c.moduleGroups[0].groups.push({
      label: i18n.t('common.language_management'),
      value: 'language',
      key: 'group-language',
      checked: true,
      selected: ['zh-CN', 'en', 'ja-JP'],
      items: [...languageItems],
    })
  }
}

function normalizeFeatureKeys (list = []) {
  return list.map(f => (typeof f === 'string' ? f : (f && (f.key || f.value)))).filter(Boolean)
}

export default {
  name: 'FeatureSelector',
  props: {
    defaultItems: {
      type: Array,
      default: () => [],
    },
    /* (item) => { return { disabled: true, reason: 'xxx' } } */
    PreItemCheck: {
      type: Function,
      required: false,
    },
    /* (item) => { return true/false } */
    PreItemFilter: {
      type: Function,
      required: false,
    },
  },
  emits: ['change'],
  data () {
    return {
      selectedItems: [],
      // 标记用户是否已手动改过，避免 defaultItems 反复回写冲掉选择
      touched: false,
    }
  },
  computed: {
    ...mapState({
      licenseCompute: state => state.app.license.compute,
    }),
    supportedFeatures () {
      const ret = this.licenseCompute?.features || []
      return fillBillSupportFeatures(normalizeFeatureKeys(ret), true)
    },
    hasLicenseFeatures () {
      return this.supportedFeatures.length > 0
    },
    options () {
      return c.items.map((item) => {
        const next = { ...item }
        if (next.key === 'cloudpods') {
          const { companyInfo = {} } = this.$store.state.app
          const { inner_logo, inner_logo_format, inner_copyright, inner_copyright_en } = companyInfo
          if (inner_logo && inner_logo_format) {
            next.icon = `data:${inner_logo_format};base64,${inner_logo}`
          }
          if (setting.language === 'en' && inner_copyright_en) {
            next.label = inner_copyright_en
          } else if (setting.language === 'zh-CN' && inner_copyright) {
            next.label = inner_copyright
          }
        }
        if (!isSAAS()) {
          const unsupported = this.hasLicenseFeatures && !this.supportedFeatures.includes(next.key)
          next.disabled = unsupported
          next.licenseDisabled = unsupported
        }
        return next
      })
    },
    moduleGroups () {
      const selectedOptions = this.options.filter(option => this.selectedItems.indexOf(option.value) >= 0)
      return c.moduleGroups.map((m) => {
        const groups = (m.groups || []).map((g) => {
          const items = (g.items || []).map((raw) => {
            const base = this.options.find(o => o.key === raw.key) || { ...raw }
            const item = { ...base }
            item.checked = this._itemChecked(item)
            Object.assign(item, this._itemDisabled(selectedOptions, item))
            return item
          })
          return {
            ...g,
            items,
            visibleItems: items.filter(i => !i.licenseDisabled),
            selected: items.filter(i => i.checked).map(i => i.value),
            checked: this._groupChecked(items),
            licenseDisabled: this._groupLicenseDisabled(items),
          }
        })
        return { ...m, groups }
      })
    },
  },
  watch: {
    defaultItems: {
      immediate: true,
      handler (val) {
        // 用户已操作后，不再被父级每次新数组引用重置
        if (this.touched) return
        const next = this._selectedItems(val || [])
        if (!R.equals(next, this.selectedItems)) {
          this.selectedItems = next
        }
      },
    },
    selectedItems (val) {
      this.$emit('change', [...val])
    },
    supportedFeatures (val, oldVal) {
      if (R.equals(val, oldVal)) return
      // license 首次就绪时，按授权收敛一次；用户已点选则保留当前选择再过滤
      const base = this.touched ? this.selectedItems : (this.defaultItems || [])
      const next = this._selectedItems(base)
      if (!R.equals(next, this.selectedItems)) {
        this.selectedItems = next
      }
    },
  },
  methods: {
    changeItems (val) {
      this.touched = false
      this.selectedItems = this._selectedItems(val || [])
    },
    handleItemClick (item) {
      if (item.disabled) return
      this.onClickItem(item)
    },
    _groupLicenseDisabled (currentItems) {
      return currentItems.length > 0 && currentItems.every(item => item.licenseDisabled)
    },
    _selectedItems (currentItems) {
      let items = c.items.filter(option => currentItems.indexOf(option.value) >= 0)

      if (R.is(Function, this.PreItemFilter)) {
        items = items.filter(this.PreItemFilter)
      }

      if (isSAAS() && !items.some(item => languageList.includes(item.key))) {
        items = items.concat(languageItems)
      }

      const options = items.filter(item => !this._itemDisabled(items, item).disabled)
      return options.map(item => item.value)
    },
    _updateSelectedItems (currentItems) {
      this.touched = true
      this.selectedItems = this._selectedItems(currentItems)
    },
    _itemDisabled (currentOptions, item) {
      if (R.is(Function, this.PreItemCheck)) {
        const ret = this.PreItemCheck(item)
        if (R.propEq('disabled', true)(ret)) return ret
      }

      if (R.has('validators', item) && R.is(Array, item.validators)) {
        const vrs = item.validators.map(v => v(currentOptions))
        const ret = R.find(R.propEq('disabled', true), vrs)
        return ret || { disabled: false, reason: '' }
      }
      return { disabled: !!item.disabled, reason: item.reason || '' }
    },
    _itemChecked (item) {
      return this.selectedItems.indexOf(item.value) >= 0
    },
    _groupChecked (groupItems) {
      const items = groupItems.filter(item => !item.licenseDisabled)
      return items.length > 0 && R.all(this._itemChecked, items)
    },
    addItem (item) {
      this._updateSelectedItems([...this.selectedItems, item])
    },
    removeItem (item) {
      this._updateSelectedItems(this.selectedItems.filter(v => v !== item))
    },
    onClickItem (item) {
      if (this.selectedItems.indexOf(item.value) < 0) {
        this.addItem(item.value)
      } else {
        this.removeItem(item.value)
      }
    },
    addItems (items) {
      this._updateSelectedItems([...this.selectedItems, ...items])
    },
    removeItems (items) {
      this._updateSelectedItems(this.selectedItems.filter(v => items.indexOf(v) < 0))
    },
    onClickGroup (group) {
      const items = group.items.filter(i => !i.licenseDisabled && !i.disabled).map(item => item.value)
      if (!items.length) return
      group.checked ? this.removeItems(items) : this.addItems(items)
    },
  },
}
</script>

<style scoped lang="less">
@import '@/styles/less/theme';

.module {
  border-color: #e8e8e8;
  margin-bottom: 10px;
  margin-top: 10px;
  border-style: double;
  border-width: 1px;
  border-radius: 6px;
  padding: 10px;

  .title {
    font-size: large;
    font-weight: 900;
  }

  .group {
    margin-left: 10px;

    .title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
      margin-top: 10px;
    }

    .item {
      min-width: 120px;
      max-width: 150px;
      cursor: pointer;
      display: block;
      font-size: 14px;
      margin-bottom: 10px;
      border: 1px solid #eee;
      text-align: center;
      border-radius: 6px;
      box-sizing: border-box;
      color: rgba(0, 0, 0, 0.85);

      &.checked {
        border-color: var(--antd-wave-shadow-color, @primary-color);
        color: var(--antd-wave-shadow-color, @primary-color);

        span {
          color: var(--antd-wave-shadow-color, @primary-color);
        }
      }

      &.disabled {
        color: rgba(0, 0, 0, .25);
        background-color: #f5f5f5;
        border-color: #d9d9d9;
        text-shadow: none;
        box-shadow: none;
        cursor: not-allowed;

        &:hover {
          border-color: #d9d9d9;
          color: rgba(0, 0, 0, .25);
        }

        span {
          color: rgba(0, 0, 0, .25);
        }
      }
    }
  }
}
</style>
