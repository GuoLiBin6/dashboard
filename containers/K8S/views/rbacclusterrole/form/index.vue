<template>
  <div class="k8s-deployment-create">
    <a-form-model ref="formRef" :model="form" :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" class="w-75" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.cluster" @input="setCluster" v-model:clusterObj="clusterObj" class="w-75" />
      </a-form-model-item>
      <a-form-item :label="$t('k8s.text_386')">
        <role-rule-form-item ref="roleRuleRef" :clusterId="clusterObj.id" />
      </a-form-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import RoleRuleFormItem from '@K8S/sections/RoleRuleFormItem'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sRbacclusterrolebindingFormCreate',
  components: {
    ClusterSelect,
    RoleRuleFormItem,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        cluster: this.$store.state.common.k8s.cluster,
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
      },
      clusterObj: {},
    }
  },
  methods: {
    async validateForm () {
      try {
        const [roleRuleData] = await Promise.all([
          this.$refs.roleRuleRef.validateForm(),
          this.$refs.formRef.validate(),
        ])
        return { ...roleRuleData, ...this.form }
      } catch (error) {
        throw error
      }
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        this.$emit('submit', values)
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
