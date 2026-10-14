<template>
  <div>
    <a-form-model-item class="mb-0" :prop="chargeTypeField">
      <a-radio-group :value="chargetype" @change="addressTypeChange">
        <a-radio-button v-for="item in typeOpts" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="chargetype === 'bandwidth'" class="mb-0" :prop="bandwidthField">
      <a-input-number :value="bandwidth" :min="1" @change="onBandwidthChange" /> Mbps
    </a-form-model-item>
  </div>
</template>

<script>
import i18n from '@/locales'

export default {
  name: 'ChargeType',
  props: {
    chargeTypeField: {
      type: String,
      default: 'charge_type',
    },
    bandwidthField: {
      type: String,
      default: 'bandwidth',
    },
    /** a-form-model：通常为 form.fd（必传） */
    model: {
      type: Object,
      required: true,
    },
    typeOpts: {
      type: Array,
      default: () => Object.keys(i18n.t('chargeTypes')).map(key => ({
        key,
        label: i18n.t('chargeTypes')[key],
      })),
    },
  },
  data () {
    return {
      chargetype: this.model[this.chargeTypeField] ?? 'traffic',
      bandwidth: this.model[this.bandwidthField] ?? 1,
    }
  },
  created () {
    if (this.model[this.chargeTypeField] === undefined) {
      this.$set(this.model, this.chargeTypeField, this.chargetype)
    } else {
      this.chargetype = this.model[this.chargeTypeField]
    }
    if (this.model[this.bandwidthField] === undefined && this.bandwidth !== undefined) {
      this.$set(this.model, this.bandwidthField, this.bandwidth)
    } else if (this.model[this.bandwidthField] !== undefined) {
      this.bandwidth = this.model[this.bandwidthField]
    }
  },
  methods: {
    writeField (name, value) {
      this.$set(this.model, name, value)
    },
    addressTypeChange (e) {
      this.chargetype = e.target.value
      this.writeField(this.chargeTypeField, this.chargetype)
    },
    onBandwidthChange (val) {
      this.bandwidth = val
      this.writeField(this.bandwidthField, val)
    },
  },
}
</script>
