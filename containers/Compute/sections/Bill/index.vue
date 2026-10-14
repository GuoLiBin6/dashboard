<template>
  <div>
    <a-form-model-item prop="billType">
      <a-radio-group
        v-model:value="model[billTypeField]"
        @change="change">
        <a-radio-button
          v-for="(item, key) in billTypesMap"
          :value="key"
          :disabled="disabledBillType === item.key"
          :key="key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <template v-if="showDuration">
      <a-form-model-item :extra="duration === '1W' ? $t('compute.text_118') : ''" prop="duration">
        <a-radio-group
          v-model:value="model[durationField]"
          @change="durationChange">
          <a-radio-button
            v-for="item in buyDurationOptions"
            :disabled="item.disabled"
            :value="item.key"
            :key="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
        <a-checkbox
          v-if="showAutoRenew"
          class="ml-4"
          v-model:checked="model[autoRenewField]"
          @change="markFormFieldDraftTouched">{{$t('compute.text_119')}}</a-checkbox>
      </a-form-model-item>
    </template>
  </div>
</template>

<script>
import * as R from 'ramda'
import { BILL_TYPES_MAP, BUY_DURATION_OPTIONS } from '@Compute/constants'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'VmPublicCreateBill',
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
    billTypeField: {
      type: String,
      default: 'billType',
    },
    durationField: {
      type: String,
      default: 'duration',
    },
    autoRenewField: {
      type: String,
      default: 'autoRenew',
    },
    showAutoRenew: {
      type: Boolean,
      default: true,
    },
    form: {
      type: Object,
    },
    model: {
      type: Object,
      required: true,
    },
    providerList: {
      type: Array,
    },
    disabledBillType: {
      type: String,
    },
    billTypesMaps: {
      type: Object,
      default: () => BILL_TYPES_MAP,
    },
  },
  data () {
    return {
      duration: this.model.duration || '1M',
      buyDurationOptions: BUY_DURATION_OPTIONS,
      showDuration: this.model.billType === BILL_TYPES_MAP.package.key,
    }
  },
  computed: {
    billTypesMap () {
      return this.billTypesMaps || BILL_TYPES_MAP
    },
  },
  watch: {
    providerList: {
      immediate: true,
      handler (providerList, oldV) {
        if (oldV !== undefined && R.equals(providerList, oldV)) return
        const list = (providerList || []).map(val => (val && val.name ? val.name : val)).map(n => String(n).toLowerCase())
        this.buyDurationOptions = BUY_DURATION_OPTIONS.map(item => {
          let disabled = false
          if (R.is(Array, item.includes)) {
            disabled = !item.includes.every(provider => list.includes(provider))
          }
          return {
            ...item,
            disabled,
          }
        })
        this.$nextTick(() => {
          if (!this.restoreFormFieldDraftFields()) {
            this.ensureValidPackageDuration()
          }
        })
      },
    },
  },
  created () {
    const billType = this.model[this.billTypeField]
    this.showDuration = billType === BILL_TYPES_MAP.package.key
    this.duration = this.model[this.durationField] || this.duration
  },
  methods: {
    getEnabledBuyDurations () {
      return (this.buyDurationOptions || []).filter(item => !item.disabled)
    },
    getDefaultPackageDuration () {
      if (this.isDurationEnabled('1M')) return '1M'
      return this.getEnabledBuyDurations()[0]?.key || '1M'
    },
    isDurationEnabled (key) {
      return !!key && this.getEnabledBuyDurations().some(item => item.key === key)
    },
    applyPackageDuration (duration) {
      if (!duration || !this.showDuration) return
      this.duration = duration
      this.$set(this.model, this.durationField, duration)
    },
    ensureValidPackageDuration () {
      if (!this.showDuration) return
      const current = this.model[this.durationField]
      if (this.isDurationEnabled(current)) {
        this.duration = current
        return
      }
      this.applyPackageDuration(this.getDefaultPackageDuration())
    },
    change (val) {
      this.markFormFieldDraftTouched()
      const billType = val.target.value
      this.$set(this.model, this.billTypeField, billType)
      this.showDuration = billType === BILL_TYPES_MAP.package.key
      if (this.showDuration) {
        this.$nextTick(() => this.applyPackageDuration(this.getDefaultPackageDuration()))
      }
    },
    durationChange (val) {
      this.markFormFieldDraftTouched()
      this.duration = val.target.value
      this.$set(this.model, this.durationField, val.target.value)
    },
    getCreateFormFieldDraftSnapshot () {
      const billType = this.model[this.billTypeField]
      if (billType == null) return undefined
      const snapshot = { billType }
      if (billType === BILL_TYPES_MAP.package.key) {
        snapshot.duration = this.model[this.durationField]
        if (this.showAutoRenew) {
          snapshot.autoRenew = this.model[this.autoRenewField]
        }
      }
      return snapshot
    },
    applyCreateFormFieldDraft (draft) {
      if (!draft || typeof draft !== 'object') return
      const billType = draft.billType
      if (!billType || !this.billTypesMap[billType]) return
      if (this.disabledBillType === billType) return
      this.showDuration = billType === BILL_TYPES_MAP.package.key
      this.$set(this.model, this.billTypeField, billType)
      if (this.showDuration) {
        const duration = this.isDurationEnabled(draft.duration)
          ? draft.duration
          : this.getDefaultPackageDuration()
        this.duration = duration
        this.$nextTick(() => {
          this.$set(this.model, this.durationField, duration)
          if (this.showAutoRenew && draft.autoRenew != null) {
            this.$set(this.model, this.autoRenewField, draft.autoRenew)
          }
        })
      }
    },
  },
}
</script>
