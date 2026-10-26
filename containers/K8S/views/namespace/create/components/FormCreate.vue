<template>
  <a-form-model
    ref="formRef"
    class="mt-3"
    :model="form"
    :rules="rules">
    <a-form-model-item
      :label="$t('k8s.text_41')"
      prop="name">
      <a-input v-model:value="form.name" :placeholder="$t('k8s.text_60')" />
    </a-form-model-item>
    <a-form-model-item
      :label="$t('k8s.text_19')"
      prop="cluster">
      <cluster-select
        v-model:value="form.cluster"
        @input="setCluster"
        style="width: 140px;" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'FormCreate',
  components: {
    ClusterSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        cluster: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132') },
          { validator: this.$validate('k8sName') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.text_30') },
        ],
      },
    }
  },
  created () {
    this.resourceM = new this.$Manager('namespaces', 'v1')
  },
  unmounted () {
    this.resourceM = null
  },
  methods: {
    async doCreate () {
      await this.$refs.formRef.validate()
      await this.resourceM.create({ data: { ...this.form } })
      this.$message.success(this.$t('k8s.text_184'))
    },
  },
}
</script>
