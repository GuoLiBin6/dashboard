<template>
  <div>
    <a-tooltip v-if="isGpuEmpty" :title="$t('compute.text_146')">
      <span><a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :value="gpuEnable" :disabled="true" /></span>
    </a-tooltip>
    <a-form-item class="mb-0" v-else>
      <a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :checked="gpuEnable" @change="change" />
    </a-form-item>
    <template v-if="gpuEnable">
      <a-row>
        <a-col :span="3" class="mr-2">
          <a-form-item>
            <base-select :value="boundFd.gpuType" :options="gpuTypeOptions" @change="onChangeGpuType" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item>
            <base-select :value="boundFd.gpu" :options="realGpuOptions" v-model:item="curGpuItem"
              :selectProps="{ placeholder: $t('compute.text_147') }" @change="v => $set(boundFd, 'gpu', v)" />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item class="mb-0">
        <a-radio-group :value="boundFd.gpuCount" @change="e => $set(boundFd, 'gpuCount', e.target.value)">
          <a-radio-button
            v-for="item in gpuCountOptions"
            :value="item.key"
            :key="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-form-item>
    </template>
  </div>
</template>

<script>
import {
  GPU_COUNT_OPTIONS,
  GPU_TYPE_OPTION_MAP,
  matchPciDevice,
  getGpuTypeSelectOptions,
  resolveGpuTypeBySharingMode,
} from '@Compute/constants'

export default {
  name: 'GPU',
  props: {
    model: {
      type: Object,
      default: null,
    },
    gpuOptions: {
      type: Array,
      default: () => [],
    },
    form: {
      type: Object,
    },
  },
  data () {
    return {
      gpuEnable: false,
      gpuCountOptions: GPU_COUNT_OPTIONS,
      curGpuItem: {},
      curGpuType: GPU_TYPE_OPTION_MAP.HPC.value,
    }
  },
  computed: {
    boundFd () {
      return this.model || this.form?.fd || this.form
    },
    isGpuEmpty () {
      return this.gpuOptions && this.gpuOptions.length === 0
    },
    realGpuOptions () {
      return this.gpuOptions.filter(item => matchPciDevice(item, 'GPU'))
    },
    gpuTypeOptions () {
      return getGpuTypeSelectOptions(this.curGpuItem?.sharing_mode)
    },
  },
  watch: {
    curGpuItem (val) {
      const nextGpuType = resolveGpuTypeBySharingMode(this.curGpuType, val?.sharing_mode)
      if (nextGpuType !== this.curGpuType) {
        this.curGpuType = nextGpuType
        this.$set(this.boundFd, 'gpuType', nextGpuType)
        this.$emit('change-gpu-type', nextGpuType)
      }
    },
  },
  created () {
    const fd = this.boundFd
    if (fd && fd.gpuEnable === undefined) {
      this.$set(fd, 'gpuEnable', false)
    }
    if (fd && fd.gpuCount === undefined) {
      this.$set(fd, 'gpuCount', 1)
    }
    if (fd && fd.gpuType === undefined) {
      this.$set(fd, 'gpuType', GPU_TYPE_OPTION_MAP.HPC.value)
    }
    this.gpuEnable = !!fd?.gpuEnable
    this.curGpuType = fd?.gpuType || GPU_TYPE_OPTION_MAP.HPC.value
  },
  methods: {
    change (val) {
      this.gpuEnable = val
      this.$set(this.boundFd, 'gpuEnable', val)
      this.$emit('change', val)
    },
    onChangeGpuType (val) {
      this.curGpuType = val
      this.$set(this.boundFd, 'gpuType', val)
    },
  },
}
</script>
