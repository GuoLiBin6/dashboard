<template>
  <div class="cloudregion-vpc-wrapper">
    <a-row :gutter="8">
      <a-col :span="12">
        <a-form-item>
          <a-select label-in-value :value="cloudregionValue" :placeholder="$t('dictionary.region')" @change="regionChange">
            <a-select-option v-for="item in regionOpts" :key="item.id" :provider="item.provider">
              <span class="text-color-secondary">{{ $t('dictionary.region') }}: </span>{{ _$t(item) }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item>
          <a-select label-in-value :value="vpcValue" allow-clear :placeholder="$t('common.text00046')" @change="vpcChange">
            <a-select-option v-for="item in vpcOpts" :key="item.id">
              <span class="text-color-secondary">{{ $t('dictionary.vpc') }}: </span>
              {{ item.account ? `${ item.account }/` : '' }}{{ item.name === 'Default' ? `${$t('common_91')}` : _$t(item) }}{{ item.cidr_block ? `（${item.cidr_block}）` : '' }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import i18n from '@/locales'
import { SERVER_TYPE } from '@Compute/constants'
import { Manager } from '@/utils/manager'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'CloudregionVpc',
  props: {
    cloudregionField: {
      type: String,
      default: 'cloudregion',
    },
    vpcField: {
      type: String,
      default: 'vpc',
    },
    cloudregionParams: {
      type: Object,
      default: () => ({}),
    },
    vpcParams: {
      type: Object,
      default: () => ({}),
    },
    /** a-form-model end-state（通常 form.fd）；有 model 时不依赖 createForm */
    model: {
      type: Object,
      default: null,
    },
  },
  inject: {
    form: { default: null },
  },
  data () {
    return {
      regionOpts: [],
      vpcOpts: [],
      regionLoading: false,
      vpcLoading: false,
      provider: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
    resolvedModel () {
      return this.model || this.form?.fd
    },
    cloudregionValue () {
      return this.resolvedModel?.[this.cloudregionField]
    },
    vpcValue () {
      return this.resolvedModel?.[this.vpcField]
    },
  },
  watch: {
    cloudregionParams: {
      deep: true,
      handler (val, oldVal) {
        if (!R.equals(val, oldVal)) {
          this.fetchRegions()
        }
      },
    },
  },
  created () {
    this.cloudregionsM = new Manager('cloudregions')
    this.fetchRegions()
  },
  methods: {
    writeField (name, value) {
      if (this.resolvedModel) this.$set(this.resolvedModel, name, value)
    },
    clearFields (names) {
      if (!this.resolvedModel) return
      names.forEach((n) => {
        if (Object.prototype.hasOwnProperty.call(this.resolvedModel, n)) {
          this.$delete(this.resolvedModel, n)
        }
      })
    },
    platformType () {
      return this.resolvedModel?.platform_type || SERVER_TYPE.idc
    },
    regionChange (cloudregion, op) {
      if (op) {
        cloudregion = {
          ...cloudregion,
          provider: op.data.attrs.provider,
        }
      }
      this.fetchVpcs(cloudregion.key)
      this.provider = cloudregion.provider
      this.writeField(this.cloudregionField, cloudregion)
      this.$emit('regionChange', { key: cloudregion.key, provider: cloudregion.provider })
    },
    vpcChange (vpc) {
      this.writeField(this.vpcField, vpc)
      this.$emit('vpcChange', vpc?.key)
    },
    fetchRegions () {
      this.regionLoading = true
      const params = {
        ...this.cloudregionParams,
      }
      if (this.cloudregionParams.project_domain) {
        params.project_domain = this.cloudregionParams.project_domain
        delete params.scope
      }
      this.cloudregionsM.list({ params })
        .then(({ data: { data = [] } }) => {
          this.regionLoading = false
          this.regionOpts = data
          if (this.regionOpts.length) {
            const firstRegion = this.regionOpts[0]
            this.regionChange({ key: firstRegion.id, label: firstRegion.name, provider: firstRegion.provider })
          } else {
            this.clearFields([this.cloudregionField, this.vpcField])
            this.$emit('regionChange')
          }
        })
        .catch(() => {
          this.regionLoading = false
        })
    },
    fetchVpcs (cloudregionId) {
      this.vpcLoading = true
      const params = Object.assign({}, this.vpcParams)
      this.vpcOpts = [] // 清空可用区
      this.cloudregionsM.getSpecific({ id: cloudregionId, spec: 'vpcs', params })
        .then(({ data: { data = [] } }) => {
          this.vpcLoading = false
          this.vpcOpts = data
          if (this.vpcOpts.length) {
            const firstVpc = this.vpcOpts[0]
            this.vpcChange({ key: firstVpc.id, label: firstVpc.name })
          } else {
            this.clearFields([this.vpcField])
          }
        })
        .catch(() => {
          this.vpcLoading = false
        })
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length) ||
            (typeof value === 'object' && value && 'key' in value && !value.key)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          let settled = false
          const finish = (err) => {
            if (settled) return
            settled = true
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          }
          let ret
          try {
            ret = rule.validator(rule, value, finish)
          } catch (e) {
            finish(e)
            return
          }
          if (ret && typeof ret.then === 'function') {
            ret.then(() => finish()).catch(finish)
          }
          return
        }
        resolve()
      })
    },
    async runDecoratorRules (decoratorTuple, value) {
      const meta = resolveFieldMeta(decoratorTuple)
      if (!meta) return
      const rules = meta.rules || []
      for (const rule of rules) {
        await this.runFieldRule(rule, value)
      }
    },
    async validate () {
      const requiredRule = { required: true, message: i18n.t('k8s.text_165') }
      await this.runDecoratorRules({ name: this.cloudregionField, rules: [requiredRule] }, this.cloudregionValue)
      await this.runDecoratorRules({ name: this.vpcField, rules: [requiredRule] }, this.vpcValue)
      return true
    },
  },
}
</script>
