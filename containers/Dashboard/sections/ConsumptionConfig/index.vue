<template>
  <div>
    <!-- 币种 -->
    <a-form-item :label="$t('scope.text_453')">
      <a-select :value="fieldValue('currency')" @change="onCurrencyChange">
        <a-select-option v-for="obj in newCurrencys" :key="obj.item_id" :value="obj.item_id">
          {{ obj.item_name }}
        </a-select-option>
      </a-select>
    </a-form-item>
    <!-- 云环境和云平台 -->
    <a-form-item v-if="fieldMap.cloud_env" :label="$t('dashboard.text_98')">
      <a-row :gutter="8">
        <a-col :span="12">
          <a-form-item class="mb-0">
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
          <a-form-item class="mb-0">
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
    <!-- 云账号 -->
    <a-form-item v-if="fieldMap.account" :label="$t('scope.text_568')" class="mb-0">
      <a-select
        allowClear
        class="w-100"
        :labelInValue="labelInValue"
        :value="fieldValue('account')"
        :placeholder="$t('dashboard.text_99')"
        @change="onAccountChange"
        :filterOption="filterOption">
        <a-select-option v-for="item of accounts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
      </a-select>
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters, mapState } from 'vuex'
import { CURRENCYS } from '@/constants'
import { currencyUnitMap } from '@/constants/currency'
import { typeClouds } from '@/utils/common/hypervisor'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'ConsumptionConfig',
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
  },
  data () {
    return {
      CURRENCYS,
      cloudEnvs: [],
      cloudEnvData: {},
      brands: [],
      brandData: {},
      accounts: [],
      accountLoading: false,
    }
  },
  computed: {

    boundModel () {
      return this.model || this.fd
    },
    ...mapState('common', {
      currency: state => state.bill.currency,
      currencyOpts: state => state.bill.currencyOpts,
    }),
    ...mapGetters(['scope', 'capability']),
    cloudEnv () {
      return R.is(Object, this.cloudEnvData) ? this.cloudEnvData.key : this.cloudEnvData
    },
    brand () {
      return R.is(Object, this.brandData) ? this.brandData.key : this.brandData
    },
    newCurrencys () {
      return this.currencyOpts.map(val => {
        const localItem = currencyUnitMap[val.item_id]
        const text = localItem ? localItem.label : val.item_name
        const currencyItem = { ...val }
        if (val.item_id.indexOf('*_') !== -1) {
          currencyItem.item_name = this.$t('common.show_origin_2', [val.item_name.replace('*_', '')])
        } else if (val.item_id.indexOf('_') !== -1) {
          currencyItem.item_name = this.$t('common.unit_shows_all_bills', [val.item_name.replace('_', '')])
        } else if (val.item_id.indexOf('*') !== -1) {
          currencyItem.item_name = this.$t('common.show_origin_1', [val.item_name.replace('*', '')])
        } else {
          currencyItem.item_name = this.$t('common.only_show_bills', [text])
        }
        return currencyItem
      })
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
    this.am = new this.$Manager('cloudaccounts')
    this.fetchCloudEnvs()
    this.fetchAccounts()
  },
  methods: {
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
    fieldValue (key) {
      const d = this.fieldMap[key]
      if (!d) return undefined
      const { name, ...opts } = resolveFieldMeta(d) || {}
      const v = this.boundModel?.[name]
      return v !== undefined ? v : opts.initialValue
    },
    onCurrencyChange (value) {
      this.setModelFields({ [this.fieldMap.currency.name]: value })
    },
    onCloudEnvChange (cloudEnv) {
      this.setModelFields({ [this.fieldMap.cloud_env.name]: cloudEnv })
      this.cloudEnvChange(cloudEnv)
    },
    onBrandChange (brand) {
      this.setModelFields({ [this.fieldMap.brand.name]: brand })
      this.brandChange(brand)
    },
    onAccountChange (account) {
      this.setModelFields({ [this.fieldMap.account.name]: account })
      this.accountChange(account)
    },
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
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
      let brands = this.capability.brands || []
      brands = R.concat(brands, this.capability.disabled_brands || [])
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
          account: undefined,
        })
        this.fetchBrands()
        this.fetchAccounts()
        this.$emit('update:env', cloudEnvId)
      } else {
        this.setModelFields({
          cloud_env: undefined,
          brand: undefined,
          account: undefined,
        })
      }
    },
    brandChange (brand) {
      const brandId = R.is(Object, brand) ? brand.key : brand
      this.brandData = brand
      if (brandId) {
        this.setModelFields({
          account: undefined,
        })
        this.fetchAccounts()
        this.$emit('update:brand', brandId)
      } else {
        this.setModelFields({
          brand: undefined,
          account: undefined,
        })
      }
    },
    accountChange (account) {
      const accountId = R.is(Object, account) ? account.key : account
      this.$emit('update:account', accountId)
    },
  },
}
</script>
