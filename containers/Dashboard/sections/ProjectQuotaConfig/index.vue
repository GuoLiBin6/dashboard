<template>
  <div>
    <a-form-item :label="$t('dashboard.text_96')" v-if="fieldMap.all_usage_key">
      <usage-select
        class="w-100"
        :value="fieldValue('all_usage_key')"
        :usages="usages"
        @change="onAllUsageChange" />
      <div slot="extra" v-if="showDocsLink()">
        <i18n path="metricConfig.create_form.all_usage_extra">
          <template #link>
            <help-link :href="metricDoc">{{$t('metricConfig.create_form.all_usage_link')}}</help-link>
          </template>
        </i18n>
      </div>
    </a-form-item>
    <a-form-item :label="usageLabel || $t('dashboard.text_97')" v-if="fieldMap.usage_key">
      <usage-select
        class="w-100"
        :value="fieldValue('usage_key')"
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
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { PROJECT_QUOTA_CONFIG, getMetricDocs } from '@Dashboard/constants'
import UsageSelect from '@Dashboard/sections/QuotaConfig/UsageSelect'
import { showDocsLink } from '@/constants/docs'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'ProjectQuotaConfig',
  components: {
    UsageSelect,
  },
  props: {
    fieldMap: {
      type: Object,
      required: true,
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
    usageLabel: String,
    type: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      showDocsLink,
      translateUsage: this.$tm('project_quota_usage') || {},
      metricDoc: getMetricDocs(this.$store.getters.scope),
    }
  },
  computed: {

    boundModel () {
      return this.model || this.fd
    },
    ...mapGetters(['scope']),
    projectQuotaConfig () {
      return PROJECT_QUOTA_CONFIG[this.type]
    },
    usages () {
      const ret = []
      for (const key in this.projectQuotaConfig) {
        ret.push({
          key,
          label: this.translateUsage[key] ? this.translateUsage[key] : key,
        })
      }
      return ret
    },
  },
  created () {
    this.ensureFieldInitials()
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
    onAllUsageChange (allUsage) {
      this.setModelFields({ [this.fieldMap.all_usage_key.name]: allUsage })
      this.allUsageChange(allUsage)
    },
    onUsageChange (usage) {
      this.setModelFields({ [this.fieldMap.usage_key.name]: usage })
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
