<template>
  <div class="k8s-deployment-create w-75">
    <a-form-model
      ref="formRef"
      :model="form"
      :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-item :label="$t('k8s.text_386')">
        <role-rule-form-item ref="roleRuleRef" federatedResource="federatedclusterroles" />
      </a-form-item>
    </a-form-model>
  </div>
</template>

<script>
import RoleRuleFormItem from '@K8S/sections/RoleRuleFormItem'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sFederatedClusterroleFormCreate',
  components: {
    RoleRuleFormItem,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132'), trigger: 'blur' },
          { validator: this.$validate('k8sName') },
        ],
      },
    }
  },
  methods: {
    async validateForm () {
      try {
        const [roleRuleData] = await Promise.all([
          this.$refs.roleRuleRef.validateForm(),
          this.$refs.formRef.validate(),
        ])
        return {
          spec: {
            template: roleRuleData,
          },
          ...this.form,
        }
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
