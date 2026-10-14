<template>
  <div>
    <a-tabs v-model="activeTab" @change="tabChange">
      <a-tab-pane :tab="$t('helm.text_19')" key="form" />
      <a-tab-pane :tab="$t('helm.text_20')" key="yaml" />
    </a-tabs>
    <labels-complete
      v-if="activeTab === 'form'"
      ref="labelRef"
      :model="model"
      :title="$t('helm.text_21')"
      :keyLabel="$t('helm.text_22')"
      :localData="localData"
      :valueSearch="valueSearch"
      :keyAutoCompleteProps="keyAutoCompleteProps" />
    <a-form-model-item>
      <code-mirror v-if="activeTab === 'yaml'" :value="yamlValue" @change="onYamlChange" :options="cmOptions" />
    </a-form-model-item>
  </div>
</template>

<script>
import LabelsComplete from '@Helm/sections/LabelsComplete'
import { validateYaml } from '@/utils/validate'

export default {
  name: 'K8sChartFormYaml',
  components: {
    LabelsComplete,
  },
  props: {
    /** end-state：写 model.yaml + LabelsComplete 嵌套 keys/values（必传） */
    model: {
      type: Object,
      required: true,
    },
    localData: {
      type: Object,
      default: () => ({}),
    },
    valueSearch: {
      type: Function,
    },
  },
  data () {
    return {
      activeTab: 'form',
      yamlValue: '',
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        theme: 'material',
      },
      keyAutoCompleteProps: {
        placeholder: this.$t('helm.text_23'),
      },
    }
  },
  created () {
    if (this.model.yaml === undefined) {
      this.$set(this.model, 'yaml', '')
    }
    this.yamlValue = this.model.yaml || ''
  },
  mounted () {
    if (this.model.yaml !== undefined && this.model.yaml !== null) {
      this.yamlValue = this.model.yaml
    }
  },
  methods: {
    syncYamlToForm (v) {
      this.$set(this.model, 'yaml', v)
    },
    onYamlChange (v) {
      this.yamlValue = v
      this.syncYamlToForm(v)
    },
    tabChange (val) {
      this.$emit('update:activeTab', val)
    },
    async validate () {
      if (this.activeTab === 'form') {
        const label = this.$refs.labelRef
        if (label?.validate) await label.validate()
        return { keys: { ...this.model.keys }, values: { ...this.model.values } }
      }
      if (!this.model.yaml) {
        // eslint-disable-next-line no-throw-literal
        throw { errors: [{ message: this.$t('helm.text_43') }] }
      }
      try {
        await validateYaml(this.model.yaml)
      } catch (err) {
        // eslint-disable-next-line no-throw-literal
        throw { errors: [{ message: this.$t('helm.text_37') }] }
      }
      return { yaml: this.model.yaml }
    },
  },
}
</script>
