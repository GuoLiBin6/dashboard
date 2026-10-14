<template>
  <div class="cloudregion-zone-select-wrapper">
    <a-row :gutter="8">
      <a-col :span="8">
        <a-form-item>
          <a-select label-in-value :value="cloudregionValue" :placeholder="$t('rules.region')" @change="regionChange">
            <a-select-option v-for="item in regionOpts" :key="item.id" :provider="item.provider">{{ _$t(item) }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item>
          <a-select label-in-value :value="vpcValue" allow-clear :placeholder="$t('rules.vpc')" @change="vpcChange">
            <a-select-option v-for="item in vpcOpts" :key="item.id">{{ _$t(item) }}{{ item.cidr_block ? `（${item.cidr_block}）` : '' }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="8">
        <a-form-item>
          <a-select label-in-value :value="wireValue" allow-clear :placeholder="$t('rules.wire')" v-if="show" @change="wireChange">
            <a-select-option v-for="item in wireOpts" :key="item.id">{{ _$t(item) }}</a-select-option>
          </a-select>
          <a-select label-in-value :value="zoneValue" allow-clear :placeholder="$t('rules.zone')" v-if="!show" @change="zoneChange">
            <a-select-option v-for="item in zonesOpts" :key="item.id">{{ _$t(item) }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { SERVER_TYPE } from '@Compute/constants'
import { Manager } from '@/utils/manager'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'CloudregionVpcWire',
  props: {
    /**
     * a-form-model：传入父级 form.fd，读写 cloudregion/vpc/wire|zone（labelInValue）。
     * 有 model 时只写 model（end-state）。
     */
    model: {
      type: Object,
      default: null,
    },
    fieldMap: {
      type: Object,
      default: null,
      validator: obj => !obj || (R.is(Array, obj.cloudregion) && R.is(Array, obj.vpc) && (R.is(Array, obj.wire) || R.is(Array, obj.zone))),
    },
    cloudregionParams: {
      type: Object,
      default: () => ({}),
    },
    vpcParams: {
      type: Object,
      default: () => ({}),
    },
    wireParams: {
      type: Object,
      default: () => ({}),
    },
    zoneParams: {
      type: Object,
      default: () => ({}),
    },
    vpcMapper: {
      type: Function,
    },
  },
  inject: ['form'],
  data () {
    return {
      regionOpts: [],
      vpcOpts: [],
      wireOpts: [],
      zonesOpts: [],
      regionLoading: false,
      vpcLoading: false,
      wireLoading: false,
      zoneLoading: false,
      show: true,
      provider: '',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
    cloudregionField () {
      return this.fieldMap?.cloudregion?.[0] || 'cloudregion'
    },
    vpcField () {
      return this.fieldMap?.vpc?.[0] || 'vpc'
    },
    wireField () {
      return this.fieldMap?.wire?.[0] || 'wire'
    },
    zoneField () {
      return this.fieldMap?.zone?.[0] || 'zone'
    },
    cloudregionValue () {
      return this.fieldVal(this.cloudregionField)
    },
    vpcValue () {
      return this.fieldVal(this.vpcField)
    },
    wireValue () {
      return this.wireField ? this.fieldVal(this.wireField) : undefined
    },
    zoneValue () {
      return this.zoneField ? this.fieldVal(this.zoneField) : undefined
    },
  },
  watch: {
    cloudregionParams: {
      handler (val) {
        this.$nextTick(() => {
          this.fetchRegions()
          if (this.platformType() === 'idc') {
            this.show = true
          } else {
            this.show = false
          }
        })
      },
      deep: true,
    },
  },
  created () {
    ;[this.cloudregionField, this.vpcField, this.wireField, this.zoneField].forEach((name) => {
      if (name && this.model[name] === undefined) {
        this.$set(this.model, name, undefined)
      }
    })
    this.cloudregionsM = new Manager('cloudregions')
    this.wiresM = new Manager('wires')
    this.zonesM = new Manager('zones')
    this.fetchRegions()
  },
  methods: {
    fieldVal (name) {
      if (!name) return undefined
      return this.model[name]
    },
    fieldSet (name, value) {
      if (!name) return
      this.$set(this.model, name, value)
    },
    platformType () {
      return this.model.platform_type || this.form?.fd?.platform_type || SERVER_TYPE.idc
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length) ||
            (typeof value === 'object' && !(value.key || value.id))
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
    async validate () {
      const fieldDef = this.fieldMap || {
        cloudregion: { name: this.cloudregionField },
        vpc: { name: this.vpcField },
        wire: { name: this.wireField },
        zone: { name: this.zoneField },
      }
      const fields = [
        fieldDef.cloudregion,
        fieldDef.vpc,
        fieldDef.wire,
        fieldDef.zone,
      ].filter(Boolean)
      for (const fieldDef of fields) {
        const rules = resolveFieldMeta(fieldDef)?.rules || []
        for (const rule of rules) {
          await this.runFieldRule(rule, this.fieldVal(fieldDef[0]))
        }
      }
      return true
    },
    regionChange (cloudregion, op) {
      if (op) {
        cloudregion = {
          ...cloudregion,
          provider: op.data.attrs.provider,
        }
      }
      this.fetchVpcs(cloudregion.key)
      if (this.platformType() !== 'idc') {
        if (cloudregion.provider !== 'ZStack') {
          this.fetchZones(cloudregion.key)
          this.show = false
        } else {
          this.show = true
          this.wireOpts = []
        }
      }
      this.provider = cloudregion.provider
      this.fieldSet(this.cloudregionField, cloudregion)
      this.$emit('regionChange', cloudregion.provider)
    },
    vpcChange (vpc) {
      if (this.platformType() === 'idc' || (this.platformType() !== 'idc' && this.provider === 'ZStack')) {
        this.fetchWires(vpc.key)
      }
      this.fieldSet(this.vpcField, vpc)
    },
    wireChange (wire) {
      if (this.wireField) this.fieldSet(this.wireField, wire)
    },
    zoneChange (zone) {
      if (this.zoneField) this.fieldSet(this.zoneField, zone)
    },
    fetchRegions () {
      this.regionLoading = true
      const params = {
        ...this.cloudregionParams,
      }
      if (this.isAdminMode && params.project_domain === undefined) {
        params.project_domain = this.userInfo.projectDomainId
        delete params.scope
        delete params.domain_id
      }
      this.cloudregionsM.list({ params })
        .then(({ data: { data = [] } }) => {
          this.regionLoading = false
          this.regionOpts = data
          if (this.regionOpts.length && this.model) {
            const firstRegion = this.regionOpts[0]
            this.regionChange({ key: firstRegion.id, label: firstRegion.name, provider: firstRegion.provider })
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
          this.vpcOpts = R.is(Function, this.vpcMapper) ? this.vpcMapper(data) : data
          if (this.vpcOpts.length && this.model) {
            const firstVpc = this.vpcOpts[0]
            this.vpcChange({ key: firstVpc.id, label: firstVpc.name })
          } else {
            this.fieldSet(this.vpcField, { key: '', label: '' })
          }
        })
        .catch(() => {
          this.vpcLoading = false
        })
    },
    fetchWires (vpcId) {
      this.wireLoading = true
      const params = Object.assign({}, this.wireParams, { vpc: vpcId })
      this.wireOpts = [] // 清空可用区
      this.wiresM.list({ params })
        .then(({ data: { data = [] } }) => {
          this.wireLoading = false
          this.wireOpts = data
          if (this.wireOpts.length && this.model) {
            const firstWire = this.wireOpts[0]
            this.fieldSet(this.wireField, { key: firstWire.id, label: firstWire.name })
          } else {
            this.fieldSet(this.wireField, { key: '', label: '' })
          }
        })
        .catch(() => {
          this.wireLoading = false
        })
    },
    fetchZones (cloudregionId) {
      this.zoneLoading = true
      const params = Object.assign({}, this.zoneParams)
      this.zonesOpts = [] // 清空可用区
      this.cloudregionsM.getSpecific({ id: cloudregionId, spec: 'zones', params })
        .then(({ data: { data = [] } }) => {
          this.zoneLoading = false
          this.zonesOpts = data
          if (this.zonesOpts.length && this.model) {
            const firstZone = this.zonesOpts[0]
            this.fieldSet(this.zoneField, { key: firstZone.id, label: firstZone.name })
          } else {
            this.fieldSet(this.zoneField, { key: '', label: '' })
          }
        })
        .catch(() => {
          this.zoneLoading = false
        })
    },
  },
}
</script>
