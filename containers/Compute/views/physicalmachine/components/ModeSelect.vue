<template>
  <a-form-model-item :label="$t('compute.text_827')" prop="mode">
    <a-radio-group v-model:value="modeValue">
      <template v-for="(item, key) of modes" :key="key">
        <a-radio-button :value="key" v-if="!ignores.includes(key)">{{ item }}</a-radio-button>
      </template>
    </a-radio-group>
  </a-form-model-item>
</template>

<script>
import * as R from 'ramda'

export default {
  name: 'ModeSelect',
  props: {
    ignoreMode: [String, Array],
  },
  inject: {
    form: { default: undefined },
  },
  data () {
    return {
      modes: this.$t('physicalmachineAddModes'),
    }
  },
  computed: {
    modeValue: {
      get () {
        return this.form?.fd?.mode
      },
      set (val) {
        if (this.form?.fd) {
          this.$set(this.form.fd, 'mode', val)
        }
      },
    },
    ignores () {
      return R.is(String, this.ignoreMode) ? [this.ignoreMode] : (this.ignoreMode || [])
    },
  },
}
</script>
