<template>
  <area-selects
    ref="areaSelects"
    :model="model"
    :form-draft-key="formDraftKey"
    :names="names"
    :isRequired="isRequired"
    :defaultActiveFirstOption="defaultActiveFirstOption"
    :zoneParams="zoneParams"
    :providerParams="providerParams"
    :cloudregionParams="cloudregionParams"
    :filterBrandResource="filterBrandResource"
    @providerFetchSuccess="providerFetchSuccess"
    @cloudregionFetchSuccess="cloudregionFetchSuccess"
    @fetchsDone="$emit('fetchsDone', $event)" />
</template>
<script>
import AreaSelects from '@/sections/AreaSelects/model'
const PROVIDERS = {
  postpaid: ['Aliyun', 'Huawei', 'Google', 'Qcloud', 'HCSO', 'HCS', 'Aws'],
  prepaid: ['Aliyun', 'Huawei', 'Qcloud'],
}
export default {
  name: 'ItemArea',
  components: {
    // 区域
    AreaSelects,
  },
  props: {
    /** a-form-model：传入 form.fd，走 AreaSelects model 模式（必传） */
    model: {
      type: Object,
      required: true,
    },
    names: {
      type: Array,
    },
    defaultActiveFirstOption: {
      type: Array,
    },
    isRequired: {
      type: Boolean,
    },
    billingType: {
      type: String,
    },
    filterBrandResource: String,
    formDraftKey: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      providerList: [],
    }
  },
  computed: {
    isRds () {
      return this.$route.path.indexOf('rds') > -1
    },
    service () {
      return this.isRds ? 'dbinstances' : 'elasticcaches'
    },
    providerParams () {
      const params = {
        service: this.service,
        // cloud_env: 'public',
        ...this.scopeParams,
      }

      if (this.service === 'elasticcaches') {
        params.brands = ['Huawei', 'Aliyun', 'Qcloud', 'HCS', 'Aws']
      }

      return params
    },
    zoneParams () {
      return {
        service: this.service,
        ...this.scopeParams,
      }
    },
    cloudregionParams () {
      return {
        service: this.service,
        ...this.scopeParams,
      }
    },
  },
  inject: ['form', 'scopeParams'],
  watch: {
    billingType (type) {
      this.doFetchs(type)
    },
  },
  created () {
    if (this.isRds) {
      this.providers = PROVIDERS.postpaid
    }
  },
  methods: {
    doFetchs (billingType) {
      this.providers = PROVIDERS[billingType]
      this.$refs.areaSelects.fetchs(['provider', 'cloudregion'])
    },
    providerFetchSuccess (list = []) {
      const _list = list.filter(({ name }) => {
        if (this.providers) {
          return this.providers.indexOf(name) > -1
        }
        return true
      })
      this.providerList = _list
      if (this.providerList.length === 0 && this.model) {
        this.model.sku = undefined
      }
      return _list
    },
    cloudregionFetchSuccess (list = []) {
      if (this.providerList.length === 0) {
        return []
      }
      return list.filter(({ provider }) => {
        if (this.providers) {
          return this.providers.indexOf(provider) > -1
        }
        return true
      })
    },
  },
}
</script>
