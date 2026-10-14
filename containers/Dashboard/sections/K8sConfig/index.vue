<template>
  <div>
    <a-form-item :label="$t('dashboard.text_96')">
      <usage-select
        class="w-100"
        :value="boundModel.all_usage_key"
        :usages="allUsages"
        @change="onAllUsageChange" />
      <div slot="extra" v-if="showDocsLink()">
        <i18n path="metricConfig.create_form.all_usage_extra">
          <template #link>
            <help-link :href="metricDoc">{{$t('metricConfig.create_form.all_usage_link')}}</help-link>
          </template>
        </i18n>
      </div>
    </a-form-item>
    <a-form-item :label="usageLabel || $t('dashboard.text_97')">
      <usage-select
        class="w-100"
        :value="boundModel.usage_key"
        :usages="usages"
        @change="onUsageChange" />
      <div slot="extra">
        <i18n :path="usageLabel?'metricConfig.create_form.metric_extra':'metricConfig.create_form.usage_extra'">
          <template #link>
            <help-link :href="metricDoc">{{$t('metricConfig.create_form.usage_link')}}</help-link>
          </template>
        </i18n>
      </div>
    </a-form-item>
    <a-form-item :label="$t('dashboard.usage_metric_name')" class="mb-0">
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-input class="w-100" :value="boundModel.usage_label" @change="e => onInputChange('usage_label', e.target.value)" />
      </a-form-item>
    </a-form-item>
    <a-form-item :label="$t('dashboard.remaining_usage_metric_name')" class="mb-0">
      <a-form-item :wrapperCol="{ span: 24 }">
        <a-input class="w-100" :value="boundModel.un_usage_label" @change="e => onInputChange('un_usage_label', e.target.value)" />
      </a-form-item>
    </a-form-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { K8S_USAGE_CONFIG, getMetricDocs } from '@Dashboard/constants'
import UsageSelect from '@Dashboard/sections/QuotaConfig/UsageSelect'
import { showDocsLink } from '@/constants/docs'

export default {
  name: 'K8sConfig',
  components: {
    UsageSelect,
  },
  props: {
    /** a-form-model：字段与 form.fd 对齐 */
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
    usageLabel: String,
  },
  data () {
    return {
      showDocsLink,
      translateUsage: this.$t('k8s_usage'),
      metricDoc: getMetricDocs(this.$store.getters.scope),
    }
  },
  computed: {

    boundModel () {
      return this.model || this.fd
    },
    ...mapGetters(['scope']),
    allUsages () {
      const ret = []
      for (const key in K8S_USAGE_CONFIG) {
        if (K8S_USAGE_CONFIG[key].isOnlyAllPartKey && K8S_USAGE_CONFIG[key].scope === this.scope) {
          ret.push({
            key,
            scope: K8S_USAGE_CONFIG[key].scope,
            label: this.translateUsage[key] ? this.translateUsage[key] : key,
          })
        }
      }
      return ret
    },
    usages () {
      const ret = []
      const allUsageKey = this.boundModel?.all_usage_key || ''
      for (const key in K8S_USAGE_CONFIG) {
        const { isOnlyAllPartKey, belongAllPartKeys } = K8S_USAGE_CONFIG[key]
        if (!isOnlyAllPartKey && belongAllPartKeys && belongAllPartKeys.includes(allUsageKey) && K8S_USAGE_CONFIG[key].scope === this.scope) {
          ret.push({
            key,
            scope: K8S_USAGE_CONFIG[key].scope,
            label: this.translateUsage[key] ? this.translateUsage[key] : key,
            belongAllPartKeys: K8S_USAGE_CONFIG[key].belongAllPartKeys,
          })
        }
      }
      if (!ret.length) {
        return this.allUsages
      }
      return ret
    },
  },
  methods: {
    setModelFields (values) {
      if (!this.boundModel || !values) return
      Object.keys(values).forEach((k) => {
        this.$set(this.boundModel, k, values[k])
      })
    },
    onInputChange (name, value) {
      this.setModelFields({ [name]: value })
    },
    onAllUsageChange (allUsage) {
      this.setModelFields({ all_usage_key: allUsage })
      this.allUsageChange(allUsage)
    },
    onUsageChange (usage) {
      this.setModelFields({ usage_key: usage })
      this.usageChange(usage)
    },
    allUsageChange (allUsage) {
      this.$emit('update:all_usage_key', allUsage)
    },
    usageChange (usage) {
      this.$emit('update:usage_key', usage)
    },
  },
}
</script>
