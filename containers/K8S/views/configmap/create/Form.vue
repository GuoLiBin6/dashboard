<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.cluster" @input="setCluster" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.namespace" :cluster="cluster" @input="setNamespace" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_82')" required>
        <labels ref="labelRef" :firstCanDelete="false" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import Labels from '@K8S/sections/Labels/model'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sConfigmapCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
    Labels,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        cluster: this.$store.state.common.k8s.cluster,
        namespace: this.$store.state.common.k8s.namespace,
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132'), trigger: 'blur' },
          { validator: this.$validate('k8sName') },
        ],
        cluster: [
          { required: true, message: this.$t('k8s.text_30'), trigger: 'blur' },
        ],
        namespace: [
          { required: true, message: this.$t('k8s.text_61'), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      namespaceObj: {},
    }
  },
  mounted () {
    this.$refs.labelRef.add()
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
      const pairs = this.$refs.labelRef.getPairs()
      if (!pairs.length || pairs.some(p => !p.key || p.value === '')) {
        return Promise.reject(new Error(this.$t('k8s.text_138')))
      }
      return this.form
    },
    async _doCreate (data) {
      await new this.$Manager('configmaps', 'v1').create({ data })
    },
    async doCreate () {
      try {
        await this.validateForm()
        const labels = this.$refs.labelRef.getLabelMap()
        const params = {
          name: this.form.name,
          cluster: this.form.cluster,
          namespace: this.form.namespace,
          data: labels,
        }
        await this._doCreate(params)
        this.$message.success(this.$t('k8s.text_46'))
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
