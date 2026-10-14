<template>
  <a-form-item>
    <base-select
      filterable
      :params="params"
      resource="loadbalancerclusters"
      :value="innerValue"
      @change="onChange"
      :selectProps="{ placeholder: $t('k8s.text_86') }" />
  </a-form-item>
</template>

<script>
import { LB_CLUSTER_FIELD } from './fields'

export default {
  name: 'K8SPortMappingLbCluster',
  props: {
    model: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      params: {
        limit: 0,
        scope: this.$store.getters.scope,
      },
      innerValue: undefined,
    }
  },
  computed: {
    fieldName () {
      return LB_CLUSTER_FIELD
    },
  },
  mounted () {
    if (this.model[this.fieldName] !== undefined) {
      this.innerValue = this.model[this.fieldName]
    }
    this.syncToForm(this.innerValue)
  },
  methods: {
    syncToForm (v) {
      this.$set(this.model, this.fieldName, v)
    },
    onChange (v) {
      this.innerValue = v
      this.syncToForm(v)
    },
  },
}
</script>
