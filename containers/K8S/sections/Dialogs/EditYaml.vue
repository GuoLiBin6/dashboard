<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('k8s.text_47')}}</template>
    <template #body>
      <div class="k8s-edit-yaml-dialog w-100" v-if="configText">
      <code-mirror v-model="configText" :options="cmOptions" />
      </div>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import jsYaml from 'js-yaml'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'K8SEditYamlDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      configText: R.is(Object, this.params.configText) ? jsYaml.safeDump(this.params.configText, { lineWidth: Infinity }) : this.params.configText,
      data: this.params.data[0],
      cmOptions: {
        tabSize: 4,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        lineWrapping: true,
        theme: 'material',
      },
    }
  },
  methods: {
    async handleConfirm () {
      const { clusterID, namespace, id } = this.data
      let qs = `${id}/rawdata?cluster=${clusterID}`
      if (namespace) qs += `&namespace=${namespace}`
      let data = null
      try {
        data = jsYaml.safeLoad(this.configText)
      } catch (error) {
        this.$message.error(this.$t('k8s.text_48'))
        throw error
      }
      await this.params.manager.update({
        id: qs,
        data,
      })
      this.$message.success(this.$t('k8s.text_46'))
      this.params.refresh()
      this.cancelDialog()
      if (R.is(Function, this.params.success)) this.params.success()
    },
  },
}
</script>

<style lang="less" scoped>
.k8s-edit-yaml-dialog {
  :deep(.CodeMirror) {
    height: 600px;
  }
}
</style>
