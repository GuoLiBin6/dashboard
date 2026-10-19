<template>
  <div>
    <a-form-item :label="$t('dashboard.text_98')">
      <a-row :gutter="8">
        <a-col :span="12">
          <a-form-item :wrapperCol="{ span: 24 }" class="mb-0">
            <a-select
              allowClear
              class="w-100"
              :labelInValue="labelInValue"
              :value="fieldValue('cloud_env')"
              :placeholder="$t('dashboard.text_99')"
              @change="onCloudEnvChange"
              :filterOption="filterOption">
              <a-select-option v-for="item of cloudEnvs" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item :wrapperCol="{ span: 24 }" class="mb-0">
            <a-select
              allowClear
              class="w-100"
              :labelInValue="labelInValue"
              :value="fieldValue('brand')"
              :placeholder="$t('dashboard.text_99')"
              @change="onBrandChange"
              :filterOption="filterOption">
              <a-select-option v-for="item of brands" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form-item>
    <a-form-item :label="$t('dashboard.text_100')">
      <a-radio-group :value="regionAccountType" @change="regionAccountTypeChange">
        <a-radio-button value="region">{{$t('dashboard.text_101')}}</a-radio-button>
        <a-radio-button value="account">{{$t('dashboard.text_102')}}</a-radio-button>
        <a-radio-button v-if="showTag" value="schedtag">{{ $t('dictionary.schedtag') }}</a-radio-button>
      </a-radio-group>
      <a-form-item :wrapperCol="{ span: 24 }" class="mb-0 mt-2" v-if="regionAccountType === 'region'">
        <a-select
          allowClear
          class="w-100"
          :labelInValue="labelInValue"
          :value="fieldValue('region')"
          :placeholder="$t('dashboard.text_99')"
          @change="onRegionChange"
          :filterOption="filterOption"
          :loading="regionLoading">
          <a-select-option v-for="item of regions" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :wrapperCol="{ span: 24 }" class="mb-0 mt-2" v-if="regionAccountType === 'account'">
        <a-select
          allowClear
          class="w-100"
          :labelInValue="labelInValue"
          :value="fieldValue('account')"
          :placeholder="$t('dashboard.text_99')"
          @change="onAccountChange"
          :filterOption="filterOption"
          :loading="accountLoading">
          <a-select-option v-for="item of accounts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :wrapperCol="{ span: 24 }" class="mb-0 mt-2" v-if="showTag && regionAccountType === 'schedtag'">
        <a-select
          allowClear
          class="w-100"
          :labelInValue="labelInValue"
          :value="fieldValue('schedtag')"
          :placeholder="$t('dashboard.text_99')"
          @change="onSchedtagChange"
          :filterOption="filterOption"
          :loading="schedtagLoading">
          <a-select-option v-for="item of schedtags" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
        </a-select>
      </a-form-item>
    </a-form-item>
    <a-form-item :label="$t('iam.project_tag')" v-if="showTag && hasField('tags')">
      <pairs-tag :value="fieldValue('tags') || []" @input="onTagsChange" />
    </a-form-item>
    <a-form-item :label="$t('dashboard.text_96')" class="mb-0" v-if="hasField('all_usage_key')">
      <a-form-item :wrapperCol="{ span: 24 }">
        <usage-select
          class="w-100"
          :value="fieldValue('all_usage_key')"
          :usages="totalUsageOptions"
          @change="onAllUsageChange" />
        <div slot="extra" v-if="showDocsLink()">
          <i18n path="metricConfig.create_form.all_usage_extra">
            <template #link>
              <help-link :href="metricDoc">{{$t('metricConfig.create_form.all_usage_link')}}</help-link>
            </template>
          </i18n>
        </div>
      </a-form-item>
    </a-form-item>
    <a-form-item :label="usageLabel || $t('dashboard.text_97')" class="mb-0" v-if="hasField('usage_key')">
      <a-form-item :wrapperCol="{ span: 24 }">
        <usage-select
          class="w-100"
          :value="fieldValue('usage_key')"
          :usages="partUsageOptions"
          @change="onUsageChange" />
        <div slot="extra">
          <i18n :path="usageLabel?'metricConfig.create_form.metric_extra':'metricConfig.create_form.usage_extra'">
            <template #link>
              <help-link :href="metricDoc">{{$t('metricConfig.create_form.usage_link')}}</help-link>
            </template>
          </i18n>
        </div>
      </a-form-item>
    </a-form-item>
    <a-form-item :label="$t('dashboard.usage_metric_name')" class="mb-0" v-if="hasField('usage_label')">
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-input class="w-100" :value="fieldValue('usage_label')" @change="e => onInputChange('usage_label', e.target.value)" />
      </a-form-item>
    </a-form-item>
    <a-form-item :label="$t('dashboard.remaining_usage_metric_name')" class="mb-0" v-if="hasField('un_usage_label')">
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-input class="w-100" :value="fieldValue('un_usage_label')" @change="e => onInputChange('un_usage_label', e.target.value)" />
      </a-form-item>
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { USAGE_CONFIG, getMetricDocs } from '@Dashboard/constants'
import { typeClouds } from '@/utils/common/hypervisor'
import { usageMap } from '@/constants/generalUsage'
import PairsTag from '@/sections/PairsTag'
import { showDocsLink } from '@/constants/docs'
import { resolveFieldMeta } from '@/utils/common/ant'
import UsageSelect from './UsageSelect'

export default {
  name: 'QuotaConfig',
  components: {
    UsageSelect,
    PairsTag,
  },
  props: {
    labelInValue: {
      type: Boolean,
    },
    fieldMap: {
      type: Object,
    },
    /** a-form-model：与 fieldMap 字段对齐（通常 form.fd） */
    model: {
      type: Object,
      required: true,
    },
    fc: {
      type: Object,
      default: null,
    },
    fd: {
      type: Object,
      required: false,
    },
    usageLabel: {
      type: String,
    },
    colorLabel: {
      type: String,
    },
    showTag: {
      type: Boolean,
      default: false,
    },
    /* showHostType: {
      type: Boolean,
      default: false,
    }, */
  },
  data () {
    return {
      showDocsLink,
      regionAccountType: _.get(this.model, 'regionAccountType') || _.get(this.fd, 'regionAccountType') || this.fieldMap?.regionAccountType?.initialValue || 'region',
      cloudEnvs: [],
      cloudEnvData: {},
      brands: [],
      brandData: {},
      accounts: [],
      accountLoading: false,
      regions: [],
      regionLoading: false,
      // vue-i18n v9+：$t('usage') 对对象消息返回 key 字符串，需 $tm 取整表
      translateUsage: this.$tm('usage') || {},
      totalUsageOptions: [],
      partUsageOptions: [],
      metricDoc: getMetricDocs(this.$store.getters.scope),
      schedtags: [],
      schedtagLoading: false,
    }
  },
  computed: {

    boundModel () {
      return this.model || this.fd
    },
    ...mapGetters(['scope', 'capability']),
    cloudEnv () {
      return R.is(Object, this.cloudEnvData) ? this.cloudEnvData.key : this.cloudEnvData
    },
    brand () {
      return R.is(Object, this.brandData) ? this.brandData.key : this.brandData
    },
    isRing () {
      if (this.usageLabel) {
        return false
      } else {
        return true
      }
    },
    isOneCloud () {
      return this.brand === typeClouds.brandMap.OneCloud.key
    },
  },
  created () {
    this.ensureFieldInitials()
  },
  unmounted () {
    this.am = null
    this.rm = null
  },
  mounted () {
    this.setModelFields({
      regionAccountType: this.regionAccountType,
    })
    this.am = new this.$Manager('cloudaccounts')
    this.rm = new this.$Manager('cloudregions')
    this.sm = new this.$Manager('schedtags')
    this.fetchCloudEnvs()
    this.$watch('regionAccountType', {
      handler (val) {
        this.setModelFields({
          region: undefined,
          account: undefined,
        })
        if (val === 'region') {
          this.fetchRegions()
        }
        if (val === 'account') {
          this.fetchAccounts()
        }
        if (val === 'schedtag') {
          this.fetchSchedtags()
        }
      },
      immediate: true,
    })
    this.totalUsageOptions = this.totalUsages()
    let key = ''
    if (this.fd && this.fd.all_usage_key) {
      key = this.fd.all_usage_key
    }
    this.partUsageOptions = this.partUsages(key)
  },
  methods: {
    hasField (key) {
      if (!this.fieldMap) return true
      return !!this.fieldMap[key]
    },
    fieldName (key) {
      return resolveFieldMeta(this.fieldMap?.[key], key)?.name || key
    },
    ensureFieldInitials () {
      Object.keys(this.fieldMap || {}).forEach((key) => {
        const d = this.fieldMap[key]
        const meta = resolveFieldMeta(d)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.boundModel && this.boundModel[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.boundModel, name, opts.initialValue)
        }
      })
    },
    setModelFields (values) {
      if (!this.boundModel || !values) return
      Object.keys(values).forEach((k) => {
        this.$set(this.boundModel, k, values[k])
      })
    },
    setFieldByKey (key, value) {
      this.setModelFields({ [this.fieldName(key)]: value })
    },
    fieldValue (key) {
      const meta = resolveFieldMeta(this.fieldMap?.[key], key) || {}
      const name = meta.name || key
      const v = this.boundModel?.[name]
      return v !== undefined ? v : meta.initialValue
    },
    onInputChange (key, value) {
      this.setFieldByKey(key, value)
    },
    onTagsChange (value) {
      this.setFieldByKey('tags', value)
    },
    onCloudEnvChange (cloudEnv) {
      this.setFieldByKey('cloud_env', cloudEnv)
      this.cloudEnvChange(cloudEnv)
    },
    onBrandChange (brand) {
      this.setFieldByKey('brand', brand)
      this.brandChange(brand)
    },
    onRegionChange (region) {
      this.setFieldByKey('region', region)
      this.regionChange(region)
    },
    onAccountChange (account) {
      this.setFieldByKey('account', account)
      this.accountChange(account)
    },
    onSchedtagChange (schedtag) {
      this.setFieldByKey('schedtag', schedtag)
      this.schedtagChange(schedtag)
    },
    onAllUsageChange (allUsage) {
      this.setFieldByKey('all_usage_key', allUsage)
      this.allUsageChange(allUsage)
    },
    onUsageChange (usage) {
      this.setFieldByKey('usage_key', usage)
      this.usageChange(usage)
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    /*
     * @params {Object} cloudEnv { key: <cloudEnvId> }
     */
    _setInitCloudEnv (cloudEnv) {
      if (!R.isNil(cloudEnv) && !R.isEmpty(cloudEnv)) {
        if (this.labelInValue) {
          this.setModelFields({
            cloud_env: { key: cloudEnv.key, label: cloudEnv.label },
          })
        } else {
          this.setModelFields({
            cloud_env: cloudEnv.key,
          })
        }
      }
    },
    /*
     * @params {Object} brand { key: <brandId> }
     */
    _setInitBrand (brand) {
      if (!R.isNil(brand) && !R.isEmpty(brand)) {
        if (this.labelInValue) {
          this.setModelFields({
            brand: { key: brand.key, label: brand.label },
          })
        } else {
          this.setModelFields({
            brand: brand.key,
          })
        }
      }
    },
    /*
     * @params {Object} region { key: <regionId> }
     */
    _setInitRegion (region) {
      if (!R.isNil(region) && !R.isEmpty(region)) {
        if (this.labelInValue) {
          this.setModelFields({
            region: { key: region.key, label: region.label },
          })
        } else {
          this.setModelFields({
            region: region.key,
          })
        }
      }
    },
    /*
     * @params {Object} account { key: <accountId> }
     */
    _setInitAccount (account) {
      if (!R.isNil(account) && !R.isEmpty(account)) {
        if (this.labelInValue) {
          this.setModelFields({
            account: { key: account.key, label: account.label },
          })
        } else {
          this.setModelFields({
            account: account.key,
          })
        }
      }
    },
    fetchCloudEnvs () {
      const cloudEnvs = []
      let brands = this.capability.brands
      brands = R.concat(brands, this.capability.disabled_brands)
      brands = R.uniq(brands)
      for (let i = 0, len = brands.length; i < len; i++) {
        const data = R.find(R.propEq('key', typeClouds.brandMap[brands[i]].cloud_env))(cloudEnvs)
        if (!data) {
          cloudEnvs.push({ key: typeClouds.brandMap[brands[i]].cloud_env, label: this.$t(`cloud_env.${typeClouds.brandMap[brands[i]].cloud_env}`) })
        }
      }
      this.cloudEnvs = cloudEnvs.map(val => ({ ...val, key: val.key, label: val.label }))
      let defaultData
      const initialValue = this.fieldMap?.cloud_env?.initialValue
      if (initialValue) {
        const findInitValue = this.cloudEnvs.find(val => val.key === (initialValue.key || initialValue))
        if (findInitValue) {
          defaultData = { key: findInitValue.key, label: findInitValue.label }
        }
      }
      this._setInitCloudEnv(defaultData)
      this.cloudEnvChange(defaultData)
    },
    fetchBrands () {
      let brands = []
      R.forEachObjIndexed((value, key) => {
        if (value.cloud_env === this.cloudEnv) {
          brands.push(value)
        }
      }, typeClouds.brandMap)
      brands = brands.filter(item => this.capability.brands.includes(item.brand) || this.capability.disabled_brands.includes(item.brand))
      this.brands = brands.map(val => ({ ...val, key: val.key, label: val.label }))
      let defaultData
      const initialValue = this.fieldMap?.brand?.initialValue
      if (initialValue) {
        const findInitValue = this.brands.find(val => val.key === (initialValue.key || initialValue))
        if (findInitValue) {
          defaultData = { key: findInitValue.key, label: findInitValue.label }
        }
      }
      this._setInitBrand(defaultData)
      this.brandChange(defaultData)
    },
    async fetchRegions () {
      this.regionLoading = true
      try {
        const params = {
          scope: this.scope,
        }
        if (this.cloudEnv) params.cloud_env = this.cloudEnv
        if (this.brand) params.brand = this.brand
        const response = await this.rm.list({ params })
        const data = response.data.data
        this.regions = data.map(val => ({ ...val, key: val.id, label: val._i18n && val._i18n.name ? val._i18n.name : val.name })) || []
        let defaultData
        const initialValue = this.fieldMap?.region?.initialValue
        if (initialValue) {
          const findInitValue = this.regions.find(val => val.key === (initialValue.key || initialValue))
          if (findInitValue) {
            defaultData = { key: findInitValue.key, label: findInitValue.label }
          }
        }
        this.regionChange(defaultData)
        this._setInitRegion(defaultData)
      } catch (error) {
        throw error
      } finally {
        this.regionLoading = false
      }
    },
    async fetchAccounts () {
      this.accountLoading = true
      try {
        const params = {
          scope: this.scope,
        }
        if (this.cloudEnv) params.cloud_env = this.cloudEnv
        if (this.brand) params.brand = this.brand
        const response = await this.am.list({ params })
        const data = response.data.data
        this.accounts = data.map(val => ({ ...val, key: val.id, label: val.name })) || []
        let defaultData
        const initialValue = this.fieldMap?.account?.initialValue
        if (initialValue) {
          const findInitValue = this.accounts.find(val => val.key === (initialValue.key || initialValue))
          if (findInitValue) {
            defaultData = { key: findInitValue.key, label: findInitValue.label }
          }
        }
        this.accountChange(defaultData)
        this._setInitAccount(defaultData)
      } catch (error) {
        throw error
      } finally {
        this.accountLoading = false
      }
    },
    cloudEnvChange (cloudEnv) {
      const cloudEnvId = R.is(Object, cloudEnv) ? cloudEnv.key : cloudEnv
      this.cloudEnvData = cloudEnv
      if (cloudEnvId) {
        this.setModelFields({
          brand: undefined,
          region: undefined,
          account: undefined,
        })
        this.fetchBrands()
        if (this.regionAccountType === 'region') {
          this.fetchRegions()
        }
        if (this.regionAccountType === 'account') {
          this.fetchAccounts()
        }
        if (this.regionAccountType === 'schedtag') {
          this.fetchSchedtags()
        }
        this.$emit('update:env', cloudEnvId)
      } else {
        this.setModelFields({
          cloud_env: undefined,
          brand: undefined,
          region: undefined,
          account: undefined,
        })
      }
      this.updateUsages()
    },
    brandChange (brand) {
      const brandId = R.is(Object, brand) ? brand.key : brand
      this.brandData = brand
      if (brandId) {
        this.setModelFields({
          region: undefined,
          account: undefined,
        })
        if (this.regionAccountType === 'region') {
          this.fetchRegions()
        }
        if (this.regionAccountType === 'account') {
          this.fetchAccounts()
        }
        this.$emit('update:brand', brandId)
        this.setModelFields({ brand: brand })
      } else {
        this.setModelFields({
          brand: undefined,
          region: undefined,
          account: undefined,
        })
      }
      this.updateUsages()
    },
    regionChange (region) {
      const regionId = R.is(Object, region) ? region.key : region
      this.$emit('update:region', regionId)
    },
    accountChange (account) {
      const accountId = R.is(Object, account) ? account.key : account
      this.$emit('update:account', accountId)
    },
    allUsageChange (allUsage) {
      this.partUsageOptions = this.partUsages(allUsage)
      this.setModelFields({ usage_key: undefined })
      this.$emit('update:all_usage_key', allUsage)
    },
    usageChange (usage) {
      this.$emit('update:usage_key', usage)
    },
    colorChange (color) {
      this.$emit('update:color', color)
    },
    regionAccountTypeChange (e) {
      this.regionAccountType = e.target.value
      this.setFieldByKey('regionAccountType', e.target.value)
    },
    totalKeys () {
      const keys = []
      for (const res in usageMap) {
        if (usageMap[res].field && usageMap[res].field.total && usageMap[res].field.total[this.scope]) {
          if (R.is(Array, usageMap[res].field.total[this.scope])) {
            usageMap[res].field.total[this.scope].map(key => {
              keys.push(key)
            })
          } else {
            keys.push(usageMap[res].field.total[this.scope])
          }
        }
      }
      return keys
    },
    partKeys (totalKey) {
      const keys = []
      for (const res in usageMap) {
        if (usageMap[res].field) {
          if (totalKey) {
            if (!usageMap[res].field.total) {
              continue
            }
            if (!usageMap[res].field.total[this.scope]) {
              continue
            }
            if (R.is(String, usageMap[res].field.total[this.scope]) && usageMap[res].field.total[this.scope] !== totalKey) {
              continue
            }
            if (R.is(Array, usageMap[res].field.total[this.scope]) && !usageMap[res].field.total[this.scope].includes(totalKey)) {
              continue
            }
          }
          for (const part in usageMap[res].field) {
            if (part !== 'total') {
              if (usageMap[res].field[part][this.scope]) {
                if (R.is(Array, usageMap[res].field[part][this.scope])) {
                  usageMap[res].field[part][this.scope].map(key => {
                    keys.push(key)
                  })
                } else if (R.is(String, usageMap[res].field[part][this.scope])) {
                  keys.push(usageMap[res].field[part][this.scope])
                }
              }
            }
          }
        }
      }
      return keys
    },
    updateUsages () {
      console.log('update')
      this.totalUsageOptions = this.totalUsages()
      let key = ''
      if (this.fd && this.fd.all_usage_key) {
        key = this.fd.all_usage_key
      }
      this.partUsageOptions = this.partUsages(key)
    },
    usages () {
      const ret = []
      for (const key in USAGE_CONFIG) {
        if (USAGE_CONFIG[key].scope && USAGE_CONFIG[key].scope !== this.$store.getters.scope) {
          continue
        }
        if (USAGE_CONFIG[key].clouds && USAGE_CONFIG[key].clouds.length > 0 && this.cloudEnv && !USAGE_CONFIG[key].clouds.includes(this.cloudEnv)) {
          if (!USAGE_CONFIG[key].brands) {
            continue
          }
          if (USAGE_CONFIG[key].brands && this.brand && !USAGE_CONFIG[key].brands.includes(this.brand)) {
            continue
          }
        }
        const k = USAGE_CONFIG[key].origin_key || key
        ret.push({
          key: k,
          scope: USAGE_CONFIG[key].scope,
          label: this.translateUsage[k] ? this.translateUsage[k] : k,
        })
      }
      return ret
    },
    totalUsages () {
      const usages = this.usages()
      if (!this.isRing) {
        return usages
      }
      const totalKeys = this.totalKeys()
      const ret = []
      for (var i = 0; i < usages.length; i++) {
        if (totalKeys.includes(usages[i].key)) {
          ret.push(usages[i])
        }
      }
      return ret
    },
    partUsages (val) {
      const usages = this.usages()
      if (!this.isRing) {
        return usages
      }
      const partKeys = this.partKeys(val)
      const ret = []
      for (var i = 0; i < usages.length; i++) {
        if (partKeys.includes(usages[i].key)) {
          ret.push(usages[i])
        }
      }
      return ret
    },
    async fetchSchedtags () {
      this.schedtagLoading = true
      try {
        const params = {
          scope: this.scope,
        }
        if (this.cloudEnv) params.cloud_env = this.cloudEnv
        if (this.brand) params.brand = this.brand
        const response = await this.sm.list({ params })
        const data = response.data.data
        this.schedtags = data.map(val => ({ ...val, key: val.id, label: val.name })) || []
        let defaultData
        const initialValue = this.fieldMap?.account?.initialValue
        if (initialValue) {
          const findInitValue = this.schedtags.find(val => val.key === (initialValue.key || initialValue))
          if (findInitValue) {
            defaultData = { key: findInitValue.key, label: findInitValue.label }
          }
        }
        this.schedtagChange(defaultData)
        this._setInitSchedtag()
      } catch (error) {
        throw error
      } finally {
        this.schedtagLoading = false
      }
    },
    schedtagChange (schedtag) {
      const schedtagId = R.is(Object, schedtag) ? schedtag.key : schedtag
      this.$emit('update:schedtag', schedtagId)
    },
    _setInitSchedtag (schedtag) {
      if (!R.isNil(schedtag) && !R.isEmpty(schedtag)) {
        if (this.labelInValue) {
          this.setModelFields({
            schedtag: { key: schedtag.key, label: schedtag.label },
          })
        } else {
          this.setModelFields({
            schedtag: schedtag.key,
          })
        }
      }
    },
  },
}
</script>
