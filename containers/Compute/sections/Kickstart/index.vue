<template>
  <div>
    <a-form-item>
      <a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :checked="kickstartEnabled" :disabled="enableDisabled" @change="onKickstartEnabledChange" />
    </a-form-item>
    <a-form-item v-if="kickstartEnabled" :extra="$t('compute.kickstart_placeholder')">
      <code-mirror v-if="kickstartEnabled" :value="kickstartConfigValue" @input="onKickstartConfigInput" :options="cmOptions" />
    </a-form-item>
  </div>
</template>

<script>
import 'codemirror/theme/material.css'
import 'codemirror/addon/edit/matchbrackets'

export default {
  name: 'Kickstart',
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        theme: 'material',
        mode: 'application/json',
        lint: true,
        matchBrackets: true,
      },
    }
  },
  computed: {
    enableDisabled () {
      const { os_distribution = '' } = this.form.fi?.imageMsg?.properties || this.form.fi?.imageMsg?.info?.properties || {}
      return !['centos', 'rhel', 'openeuler', 'ubuntu'].some(item => os_distribution.toLowerCase().includes(item))
    },
    kickstartEnabled () {
      return !!this.form.fd?.kickstart_enabled
    },
    kickstartConfigValue () {
      return this.form.fd?.kickstart_config
    },
  },
  watch: {
    enableDisabled: {
      handler (val) {
        if (val && this.form?.fd) {
          this.form.fd.kickstart_enabled = false
        }
      },
    },
    kickstartEnabled (val) {
      if (!val && this.form?.fd) {
        this.$delete(this.form.fd, 'kickstart_config')
      }
    },
  },
  created () {
    const fd = this.form?.fd
    if (!fd) return
    if (fd.kickstart_enabled === undefined) {
      this.$set(fd, 'kickstart_enabled', false)
    }
    if (fd.kickstart_config === undefined) {
      this.$set(fd, 'kickstart_config', '')
    }
  },
  methods: {
    onKickstartEnabledChange (val) {
      if (this.form?.fd) this.form.fd.kickstart_enabled = val
    },
    onKickstartConfigInput (val) {
      if (this.form?.fd) this.form.fd.kickstart_config = val
    },
  },
}
</script>

<style scoped>

</style>
