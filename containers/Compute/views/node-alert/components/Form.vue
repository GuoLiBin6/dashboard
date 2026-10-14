<template>
  <a-form-model ref="formRef" :model="form" :rules="rules" style="wdith: 400px;" v-bind="formItemLayout">
    <a-form-model-item :label="$t('compute.text_732')" prop="metric">
      <a-select v-model:value="form.metric" :disabled="metricDisabled" @change="metricChange">
        <a-select-option v-for="item in metricOpts" :key="item.key" :value="item.key">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_733')" prop="window">
      <a-input-number v-model:value="form.window" :min="windowMin" />{{$t('compute.text_734')}}
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_735')" prop="comparator">
      <a-select v-model:value="form.comparator">
        <a-select-option v-for="item in comparatorOpts" :key="item.key" :value="item.key">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_736')" prop="threshold">
      <a-input type="number" :min="0" v-model:value="form.threshold">
        <div slot="addonAfter" v-if="thresholdUnit">{{ thresholdUnit }}</div>
      </a-input>
    </a-form-model-item>
    <a-form-model-item :label="$t('monitor.level')" prop="level">
      <a-radio-group v-model:value="form.level">
        <a-radio-button v-for="item in levelOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_739')" prop="channel">
      <a-select v-model:value="form.channel">
        <a-select-option v-for="item in channelOpts" :key="item.key" :value="item.key">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_740')" prop="recipients">
      <a-spin v-show="!recipientsLoaded" />
      <base-select
        v-show="recipientsLoaded"
        v-model="form.recipients"
        class="w-100"
        :filterable="true"
        needParams
        resource="receivers"
        version="v1"
        :params="recipientParams"
        v-model:resList="recipientOpts"
        v-model:initLoaded="recipientsLoaded"
        :select-props="{ placeholder: $t('common.tips.select', [$t('compute.text_740')]), allowClear: true, mode: 'multiple' }" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import * as R from 'ramda'
import { LEVEL_CN } from '@Compute/views/node-alert/constants'
import { findPlatform } from '@/utils/common/hypervisor'

export default {
  name: 'NodeAlertForm',
  props: {
    metricOpts: {
      type: Array,
    },
    alertType: {
      type: String,
      required: true,
      validator: val => ['guest', 'host'].includes(val),
    },
    hypervisor: {
      type: String,
    },
    fdInitailValue: {
      type: Object,
      default: () => {
        return {
          window: 5,
          comparator: '>=',
          level: 'normal',
          channel: 'email',
        }
      },
    },
    monitorMetric: {
      type: String,
    },
  },
  data () {
    const metric = this.monitorMetric || this.fdInitailValue.metric || this.metricOpts[0].key
    return {
      form: {
        metric,
        window: this.fdInitailValue.window,
        comparator: this.fdInitailValue.comparator,
        threshold: this.fdInitailValue.threshold,
        level: this.fdInitailValue.level,
        channel: this.fdInitailValue.channel,
        recipients: this.fdInitailValue.recipients,
      },
      metric,
      recipientsLoaded: false,
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
      comparatorOpts: [
        { key: '>=', label: '>=' },
        { key: '<=', label: '<=' },
      ],
      levelOpts: [
        { key: 'normal', label: LEVEL_CN.normal.label },
        { key: 'important', label: LEVEL_CN.important.label },
        { key: 'fatal', label: LEVEL_CN.fatal.label },
      ],
      channelOpts: [
        { key: 'email', label: this.$t('compute.text_743') },
      ],
      recipientOpts: [],
      thresholdRules: [],
      windowMin: 5,
      R,
    }
  },
  computed: {
    domainParams () {
      return {
        scope: this.$store.getters.scope,
      }
    },
    metricDisabled () {
      return R.is(String, this.fdInitailValue.metric) || R.is(String, this.monitorMetric)
    },
    thresholdUnit () {
      if (this.metric) {
        const metricItem = this.metricOpts.find(val => val.key === this.metric)
        if (metricItem && metricItem.unit) return metricItem.unit
      }
      return ''
    },
    recipientParams () {
      return {
        enabled: true,
        limit: 0,
        with_meta: true,
        ...this.domainParams,
      }
    },
    rules () {
      return {
        metric: [
          { required: true, message: this.$t('compute.text_742') },
        ],
        threshold: [
          { required: true, message: this.$t('compute.text_737') },
          ...this.thresholdRules,
          {
            validator: (rule, value, callback) => {
              if (R.isNil(value) || R.isEmpty(value)) return callback()
              const n = Number(value)
              if (Number.isNaN(n)) return callback(new Error(this.$t('compute.text_737')))
              return callback()
            },
          },
        ],
        recipients: [
          { required: true, message: this.$t('common.tips.select', [this.$t('compute.text_740')]), type: 'array' },
        ],
      }
    },
  },
  created () {
    this.getThresholdRules(this.metric)
    this.getWindowRules()
  },
  methods: {
    metricChange (val) {
      this.metric = val
      this.form.metric = val
      this.getThresholdRules(val)
      this.$nextTick(() => {
        this.$refs.formRef.validateField('threshold')
      })
    },
    getThresholdRules (metric) {
      let rules = []
      const metricObj = this.metricOpts.find(item => item.key === this.metric)
      if (metricObj && metricObj.rules) {
        rules = metricObj.rules
      }
      this.thresholdRules = rules
    },
    getWindowRules () {
      let min = 5
      if (this.alertType === 'host') {
        min = 10
      }
      if (this.hypervisor) {
        const platform = findPlatform(this.hypervisor, 'hypervisor')
        if (platform === 'public') {
          min = 10
        }
      }
      this.windowMin = min
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      const values = { ...this.form }
      if (!R.isNil(values.threshold) && !R.isEmpty(values.threshold)) {
        values.threshold = Number(values.threshold)
      }
      return values
    },
  },
}
</script>
