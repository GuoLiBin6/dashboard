<template>
  <div class="h-100 position-relative">
    <div class="dashboard-card-wrap">
      <div class="dashboard-card-header">
        <div class="dashboard-card-header-left">{{ form.fd.name || $t('dashboard.text_6') }}<icon class="ml-2" type="loading" v-if="loading" /></div>
        <div class="dashboard-card-header-right"><slot name="actions" :handle-edit="handleEdit" /></div>
      </div>
      <div class="dashboard-card-body d-flex align-items-center justify-content-center">
        <div class="number-card-value">
          <div class="number-card-number">{{ this.usage.usage }}</div>
          <div class="number-card-unit">{{ this.usage.unit }}</div>
        </div>
      </div>
    </div>
    <base-drawer class="drawer-wrapper" @update:visible="updateVisible" :visible="visible" :title="$t('dashboard.text_5')" @ok="handleSubmit" @cancel="cancel">
      <slot />
      <a-form-model ref="formRef" hideRequiredMark :model="form.fd" :rules="drawerRules">
        <a-form-model-item :label="$t('dashboard.text_6')" prop="name">
          <a-input v-model:value="form.fd.name" @change="onNameInput" />
        </a-form-model-item>
        <k8s-config :model="form.fd" :fd="form.fd" :field-map="fieldMap" :usage-label="$t('dashboard.text_20')" @update:usage_key="setDefaultName" />
        <a-form-model-item prop="usage_key" class="d-none">
          <a-input v-model:value="form.fd.usage_key" />
        </a-form-model-item>
        <a-form-model-item v-if="canShowUnitConfig" :label="$t('common_250')" prop="unit">
          <base-select
              v-model="form.fd.unit"
              isDefaultSelect
              :filterable="true"
              :options="unitOpts"
              :select-props="{ placeholder: $t('common_618') }" />
        </a-form-model-item>
      </a-form-model>
    </base-drawer>
  </div>
</template>

<script>
import _ from 'lodash'
import BaseDrawer from '@Dashboard/components/BaseDrawer'
import { K8S_USAGE_CONFIG } from '@Dashboard/constants'
import { load } from '@Dashboard/utils/cache'
import K8sConfig from '@Dashboard/sections/K8sConfig'
import { getRequestT } from '@/utils/utils'
import { rollupFormData } from '@/utils/common/ant'
import mixin from './mixin'
export default {
  name: 'NumberCardK8s',
  components: {
    BaseDrawer,
    K8sConfig,
  },
  mixins: [mixin],
  data () {
    const initialNameValue = ((this.params && this.params.type === 'k8s') && this.params.name) || this.$t('dashboard.text_21')
    const initialUsageKeyValue = ((this.params && this.params.type === 'k8s') && this.params.usage_key) || ''
    const initUnitValue = (this.params && this.params.unit) || 'auto'

    return {
      data: {},
      loading: false,
      drawerRules: {
        name: [
          { required: true, message: this.$t('dashboard.text_8') },
        ],
        usage_key: [
          { required: true, message: this.$t('dashboard.text_22') },
        ],
      },
      form: {
        fd: {
          name: initialNameValue,
          usage_key: initialUsageKeyValue,
          unit: initUnitValue,
        },
        fi: {
          nameTouched: false,
        },
      },
      fieldMap: {
        name: {
          name: 'name',
          initialValue: initialNameValue,
          rules: [
            { required: true, message: this.$t('dashboard.text_8') },
          ],
        },
        usage_key: {
          name: 'usage_key',
          initialValue: initialUsageKeyValue,
          rules: [
            { required: true, message: this.$t('dashboard.text_22') },
          ],
        },
        unit: { name: 'unit', initialValue: initUnitValue },
      },
      unitOpts: [
        { id: 'auto', name: this.$t('common_563') },
        { id: 'K', name: 'KB' },
        { id: 'M', name: 'MB' },
        { id: 'G', name: 'GB' },
        { id: 'T', name: 'TB' },
      ],
      currentUsageKey: initialUsageKeyValue,
    }
  },
  computed: {
    usage () {
      const usage = this.usageNumber
      const ret = {
        usage,
      }
      const config = K8S_USAGE_CONFIG[this.form.fd.usage_key]
      if (config && config.formatter) {
        const fVal = config.formatter(usage)
        const fValArr = fVal.split(' ')
        ret.usage = fValArr[0]
        ret.unit = fValArr[1]
      }
      if (config && config.unit) {
        ret.unit = config.unit
      }
      // 使用用户配置的单位
      if (config && config.userUnitFormatter) {
        if (this.params && this.params.unit && this.params.unit !== 'auto') {
          const fVal = config.userUnitFormatter(usage, this.params.unit)
          const fValArr = fVal.split(' ')
          ret.usage = fValArr[0]
          ret.unit = fValArr[1]
        }
      }
      return ret
    },
    usageNumber () {
      return (this.data && _.get(this.data, this.form.fd.usage_key)) || 0
    },
    canShowUnitConfig () {
      const config = K8S_USAGE_CONFIG[this.currentUsageKey]
      if (config && config.canUseUserUnit) {
        return true
      }
      return false
    },
  },
  watch: {
    'form.fd' (val) {
      this.fetchUsage()
      rollupFormData(val, this.fieldMap)
    },
  },
  created () {
    if (this.params && this.params.type === 'k8s') {
      this.form.fd = this.params
    }
    this.$bus.$on('DashboardCardRefresh', args => {
      this.fetchUsage()
    }, this)
  },
  methods: {
    onNameInput () {
      this.form.fi.nameTouched = true
    },
    refresh () {
      return this.fetchUsage()
    },
    genUsageParams () {
      const params = {
        scope: this.$store.getters.scope,
        $t: getRequestT(),
      }
      return params
    },
    async fetchUsage () {
      this.loading = true
      try {
        const params = this.genUsageParams()
        const data = await load({
          res: 'usages',
          actionArgs: {
            url: '/v2/rpc/usages/k8s-usage',
            method: 'GET',
            params,
          },
          useManager: false,
          resPath: 'data',
        })
        this.data = data
      } finally {
        this.loading = false
      }
    },
    handleEdit () {
      this.updateVisible(true)
    },
    updateVisible (val) {
      this.$emit('update:visible', val)
    },
    async handleSubmit () {
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        this.$emit('update', this.options.i, { type: 'k8s', ...values })
        this.updateVisible(false)
      } catch (error) {
        throw error
      }
    },
  },
}
</script>

<style lang="less" scoped>
.number-card-value {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
.number-card-number {
  font-size: 50px;
  line-height: 1;
  color: #000;
}
.number-card-unit {
  font-size: 14px;
  line-height: 1;
  color: #4F4B53;
  margin-left: 6px;
  padding-bottom: 4px;
}
.drawer-wrapper {
  &:deep(.ant-drawer.ant-drawer-open .ant-drawer-mask) {
    animation: none;
  }
}
</style>
