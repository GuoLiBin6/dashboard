<template>
  <div>
    <a-form-item :label="label" />
    <a-form-item label="CPU">
      <a-input-number :value="boundFd[cpuField]" :min="1" :step="1" :precision="0" @change="v => $set(boundFd, cpuField, v)" /> {{$t('compute.text_167')}}
    </a-form-item>
    <a-form-item :label="$t('compute.text_168')">
      <a-input-number :value="boundFd[memoryField]" :min="1" :step="1" :precision="0" @change="v => $set(boundFd, memoryField, v)" /> G
    </a-form-item>
    <a-form-item :label="$t('compute.text_169')">
      <a-input-number :value="boundFd[diskField]" :min="1" :step="1" :precision="0" @change="v => $set(boundFd, diskField, v)" /> G
    </a-form-item>
  </div>
</template>

<script>
import i18n from '@/locales'

export default {
  name: 'ReserveResource',
  props: {
    model: {
      type: Object,
      default: null,
    },
    cpuField: {
      type: String,
      default: 'cpu',
    },
    memoryField: {
      type: String,
      default: 'memory',
    },
    diskField: {
      type: String,
      default: 'disk',
    },
    label: {
      type: String,
      default: i18n.t('compute.text_170'),
    },
    form: {
      type: Object,
    },
  },
  computed: {
    boundFd () {
      return this.model || this.form?.fd || this.form
    },
  },
}
</script>
