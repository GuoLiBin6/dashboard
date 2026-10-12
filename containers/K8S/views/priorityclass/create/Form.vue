<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name" :extra="$t('k8s.vc_priorityclass_name_hint')">
        <a-input v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster" :extra="$t('k8s.vc_priorityclass_cluster_hint')">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_priority_value')" prop="value" :extra="$t('k8s.vc_priority_value_hint')">
        <a-input-number v-model:value="form.fd.value" style="width: 200px" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_global_default')" prop="globalDefault" :extra="$t('k8s.vc_global_default_hint')">
        <a-switch v-model:checked="form.fd.globalDefault" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.vc_description')" prop="description" :extra="$t('k8s.vc_description_hint')">
        <a-input v-model:value="form.fd.description" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sPriorityclassForm',
  components: {
    ClusterSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          value: 100,
          globalDefault: false,
          description: '',
        },
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.vc_required') },
        ],
        value: [
          { required: true, message: this.$t('k8s.vc_priority_value_invalid') },
        ],
      },
    }
  },
  methods: {
    onClusterInput (v) {
      this.form.fd.cluster = v
      this.setCluster(v)
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form.fd
    },
    async doCreate () {
      const values = await this.validateForm()
      const value = Number(values.value)
      const name = (values.name || '').trim()
      if (!Number.isInteger(value)) {
        this.$message.error(this.$t('k8s.vc_priority_value_invalid'))
        throw new Error('value')
      }
      if (name === 'system-cluster-critical' || name === 'system-node-critical') {
        this.$message.error(this.$t('k8s.vc_system_priority_class'))
        throw new Error('reserved')
      }
      await new this.$Manager('priorityclasses', 'v1').create({
        data: {
          name,
          cluster: values.cluster,
          value,
          globalDefault: values.globalDefault === true,
          description: (values.description || '').trim(),
        },
      })
      this.$message.success(this.$t('k8s.text_46'))
    },
  },
}
</script>
