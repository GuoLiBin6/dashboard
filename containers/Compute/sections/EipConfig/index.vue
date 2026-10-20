<template>
  <div>
    <a-form-model-item :label="label" prop="eip_type">
      <a-row>
        <a-radio-group v-model:value="model.eip_type" @change="handleTypeChange">
          <a-radio-button
            v-for="item of types"
            :key="item.key"
            :value="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-row>
      <a-row class="mt-4" v-if="isBind">
        <base-select
          remote
          v-model:value="model.eip"
          resource="eips"
          :params="params"
          :showSync="true"
          :select-props="{ allowClear: true, placeholder: $t('compute.text_145') }" />
      </a-row>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_1359')" prop="eip_bgp_type" v-if="isNew && showBgpTypes">
      <a-select v-model:value="model.eip_bgp_type">
        <a-select-option v-for="item in bgpTypeOptions" :value="item" :key="item">{{ item === '' ? $t('compute.text_1352') : BGP_TYPES_MAP[item] ? BGP_TYPES_MAP[item].label : item }}</a-select-option>
      </a-select>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.text_1360')" prop="eip_charge_type" v-if="isNew">
      <a-radio-group v-model:value="model.eip_charge_type" @change="handleChargeTypeChange">
        <a-radio-button
          v-for="item of chargeTypes"
          :key="item.key"
          :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item :label="$t('compute.bandwidth.title')" prop="eip_bw" v-if="isNew">
      <div class="d-flex">
        <a-tooltip placement="top" :title="$t('compute.text_1324', [maxBindWidth])">
          <a-input-number
            :min="1"
            :max="maxBindWidth"
            :step="1"
            :formatter="format"
            :parse="format"
            v-model:value="model.eip_bw" />
            Mbps
          </a-tooltip>
      </div>
    </a-form-model-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import { EIP_TYPES_MAP as types } from '@Compute/constants'
import { typeClouds } from '@/utils/common/hypervisor'
import { HYPERVISORS_MAP } from '@/constants'
import i18n from '@/locales'
import { BGP_TYPES, BGP_TYPES_MAP } from '@/constants/network'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

const chargeTypes = {
  traffic: {
    key: 'traffic',
    label: i18n.t('compute.text_20'),
  },
  bandwidth: {
    key: 'bandwidth',
    label: i18n.t('compute.text_21'),
  },
}

export default {
  name: 'EipConfig',
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    eipParams: Object,
    hypervisor: String,
    hiddenNoneType: Boolean,
    cloudEnv: String,
    form: {
      type: Object,
    },
    model: {
      type: Object,
      required: true,
    },
    showBind: {
      type: Boolean,
      default: true,
    },
    showNew: {
      type: Boolean,
      default: true,
    },
    hasPublicIp: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      BGP_TYPES_MAP,
      type: this.model.eip_type,
      chargeType: this.model.eip_charge_type,
      bgpTypeOptions: [],
    }
  },
  computed: {
    ...mapGetters(['scope']),
    isOnpremise () {
      return this.cloudEnv === 'onpremise'
    },
    isAliyun () {
      return this.hypervisor === HYPERVISORS_MAP.aliyun.hypervisor
    },
    isPrivateEnv () {
      const privateHyper = []
      for (const key in typeClouds.hypervisorMap) {
        if (typeClouds.hypervisorMap[key].env === 'private') {
          privateHyper.push(typeClouds.hypervisorMap[key].hypervisor)
        }
      }
      return privateHyper.includes(this.hypervisor)
    },
    showBgpTypes () {
      if (!this.bgpTypeOptions || this.bgpTypeOptions.length === 0) {
        return false
      }
      if (this.bgpTypeOptions.length === 1 && this.bgpTypeOptions[0] === '') {
        return false
      }
      return this.cloudEnv == null || this.cloudEnv === 'idc' || this.isOnpremise || this.isAliyun
    },
    types () {
      const ret = { ...types }
      if (!this.showBind) {
        delete ret.bind
      }
      if (!this.showNew) {
        delete ret.new
      }
      if (this.isPrivateEnv) {
        delete ret.new
      }
      if (this.hiddenNoneType) {
        delete ret.none
      }
      if (!this.hasPublicIp) {
        delete ret.public
      }
      return ret
    },
    chargeTypes () {
      const ret = { ...chargeTypes }
      if ([
        typeClouds.hypervisorMap.azure.key,
        typeClouds.hypervisorMap.aws.key,
        typeClouds.hypervisorMap.google.key,
      ].includes(this.hypervisor)) {
        delete ret.bandwidth
      }
      if (this.hypervisor == null || this.hypervisor === 'kvm') {
        delete ret.traffic
      }
      return ret
    },
    isNew () {
      return this.type === 'new' || this.type === 'public'
    },
    isBind () {
      return this.type === 'bind'
    },
    maxBindWidth () {
      const trafficMax = {
        huawei: {
          max: 300,
        },
      }
      const brandWidthMax = {
        huawei: {
          max: 2000,
        },
        aliyun: {
          max: 500,
        },
      }
      if (this.chargeType === 'bandwidth') {
        return (
          brandWidthMax[this.hypervisor] &&
          brandWidthMax[this.hypervisor].max
        ) || (this.hypervisor === 'kvm' ? 10000 : 200)
      }
      return (
        trafficMax[this.hypervisor] &&
        trafficMax[this.hypervisor].max
      ) || (this.hypervisor === 'kvm' ? 10000 : 200)
    },
    params () {
      if (!this.eipParams || R.isEmpty(this.eipParams)) return {}
      return {
        ...{
          usable: true,
          scope: this.scope,
          limit: 20,
        },
        ...this.eipParams,
      }
    },
    label () {
      if (this.hasPublicIp) return this.$t('compute.text_1374')
      return this.$t('compute.text_107')
    },
  },
  watch: {
    types: {
      immediate: true,
      handler () {
        this.$nextTick(() => {
          this.ensureValidEipType()
          this.ensureValidChargeType()
        })
      },
    },
    chargeTypes () {
      this.$nextTick(() => this.ensureValidChargeType())
    },
    'form.fd.eip_type' (newValue) {
      if (newValue === 'new') {
        if (this.isAliyun) {
          this.bgpTypeOptions = BGP_TYPES.map(item => item.value)
        } else {
          this.fetchBgpType()
        }
      } else {
        this.bgpTypeOptions = []
      }
    },
  },
  created () {
    if (this.model.eip_bw === undefined) {
      this.$set(this.model, 'eip_bw', 30)
    }
    this.fetchBgpType()
  },
  methods: {
    writeFields (vals) {
      if (!vals || typeof vals !== 'object') return
      Object.keys(vals).forEach((key) => {
        this.$set(this.model, key, vals[key])
      })
    },
    getDefaultChargeType () {
      if (R.has('traffic', this.chargeTypes)) return 'traffic'
      return 'bandwidth'
    },
    ensureValidEipType () {
      const keys = Object.keys(this.types || {})
      if (!keys.length) return
      const current = this.model.eip_type || this.type
      if (current && this.types[current]) {
        this.type = current
        return
      }
      const first = keys[0]
      this.type = first
      this.writeFields({ eip_type: first })
      if (first === 'new' || first === 'public') {
        this.$nextTick(() => this.applyDefaultChargeType())
      }
    },
    ensureValidChargeType () {
      if (!this.isNew) return
      const current = this.model.eip_charge_type || this.chargeType
      if (current && this.chargeTypes[current]) {
        this.chargeType = current
        return
      }
      this.applyDefaultChargeType()
    },
    applyDefaultChargeType () {
      const charge = this.getDefaultChargeType()
      this.chargeType = charge
      this.writeFields({ eip_charge_type: charge })
    },
    getCreateFormFieldDraftSnapshot () {
      return undefined
    },
    applyCreateFormFieldDraft () {},
    initData (data) {
      this.$nextTick(() => {
        setTimeout(() => {
          if (data.eip_charge_type) {
            this.writeFields({ eip_type: 'new' })
            this.applyEipTypeChange('new')
            if (this.form?.fd) this.form.fd.eip_type = 'new'
          } else if (data.public_ip_charge_type) {
            this.writeFields({ eip_type: 'public' })
            this.applyEipTypeChange('public')
            if (this.form?.fd) this.form.fd.eip_type = 'public'
          }
          setTimeout(() => {
            if (data.eip_charge_type) {
              this.writeFields({
                eip_charge_type: data.eip_charge_type,
                eip_bw: data.eip_bw,
                eip_bgp_type: data.eip_bgp_type,
              })
            } else if (data.public_ip_charge_type) {
              this.writeFields({
                eip_charge_type: data.public_ip_charge_type,
                eip_bw: data.public_ip_bw,
                eip_bgp_type: data.public_ip_bgp_type,
              })
            }
          }, 1000)
        }, 1000)
      })
    },
    fetchBgpType () {
      if (this.isAliyun) return
      new this.$Manager('networks/distinct-field').list({
        params: {
          usable: true,
          limit: 0,
          field: 'bgp_type',
          scope: this.$store.getters.scope,
          server_type: 'eip',
        },
      }).then(({ data }) => {
        this.bgpTypeOptions = data.bgp_type
      })
    },
    handleTypeChange (e) {
      this.applyEipTypeChange(e.target.value)
    },
    applyEipTypeChange (type) {
      this.type = type
      if (this.type === 'new' || this.type === 'public') {
        if (this.isAliyun) {
          this.bgpTypeOptions = BGP_TYPES.map(item => item.value)
        } else {
          this.fetchBgpType()
        }
        this.$nextTick(() => this.applyDefaultChargeType())
      } else {
        this.bgpTypeOptions = []
      }
    },
    handleChargeTypeChange (e) {
      this.chargeType = e.target.value
    },
    format (val) {
      return +val || 1
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
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
      if (this.isBind) {
        await this.runFieldRule(
          { required: true, message: i18n.t('compute.text_145') },
          this.model.eip,
        )
      }
      return true
    },
  },
}
</script>
