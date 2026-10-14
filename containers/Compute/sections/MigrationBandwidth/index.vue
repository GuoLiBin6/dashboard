<template>
  <div>
    <a-form-item class="mb-0">
      <a-radio-group :value="brandWidthValue" @change="brandWidthChangeHandle">
        <a-radio-button v-for="item in brandWidthOptions" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item v-if="showDuration" class="mb-0">
      <a-input-group compact>
        <a-input class="w-25" type="number" suffix="M" :value="customBrandWidthValue" @change="customBrandWidthChangeHandle" />
      </a-input-group>
    </a-form-item>
  </div>
</template>

<script>
export default {
  name: 'MigrationBandwidth',
  props: {
    model: {
      type: Object,
      default: null,
    },
    brandWidthField: {
      type: String,
      default: 'brandWidth',
    },
    customBrandWidthField: {
      type: String,
      default: 'customBrandWidth',
    },
    form: {
      type: Object,
    },
  },
  data () {
    return {
      brandWidthOptions: [
        { key: '-1', label: this.$t('compute.text_138') },
        { key: '100', label: '100M' },
        { key: '200', label: '200M' },
        { key: '300', label: '300M' },
        { key: '500', label: '500M' },
        { key: '1000', label: '1000M' },
        { key: 'custom', label: this.$t('compute.text_144') },
      ],
      showDuration: false,
    }
  },
  computed: {
    boundFd () {
      return this.model || this.form?.fd || this.form
    },
    brandWidthValue () {
      return this.boundFd?.[this.brandWidthField]
    },
    customBrandWidthValue () {
      return this.boundFd?.[this.customBrandWidthField]
    },
  },
  created () {
    const fd = this.boundFd
    if (fd && fd[this.brandWidthField] === undefined) {
      this.$set(fd, this.brandWidthField, '-1')
    }
    this.showDuration = fd?.[this.brandWidthField] === 'custom'
  },
  methods: {
    brandWidthChangeHandle (e) {
      const val = e.target.value
      this.$set(this.boundFd, this.brandWidthField, val)
      this.showDuration = val === 'custom'
    },
    customBrandWidthChangeHandle (e) {
      const brandWidth = isNaN(parseInt(e.target.value)) ? 1 : parseInt(e.target.value)
      this.$set(this.boundFd, this.customBrandWidthField, brandWidth)
    },
  },
}
</script>

<style>

</style>
