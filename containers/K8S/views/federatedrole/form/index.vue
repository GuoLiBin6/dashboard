<template>
  <div class="k8s-deployment-create w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="federatednamespace_id">
        <base-select
          resource="federatednamespaces"
          version="v1"
          v-model:value="form.federatednamespace_id"
          :params="federatednamespaceParams" />
      </a-form-model-item>
      <a-form-item :label="$t('k8s.text_386')">
        <role-rule-form-item ref="roleRuleRef" federatedResource="federatedroles" />
      </a-form-item>
    </a-form-model>
  </div>
</template>

<script>
import RoleRuleFormItem from '@K8S/sections/RoleRuleFormItem'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sFederatedRoleFormCreate',
  components: {
    RoleRuleFormItem,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        federatednamespace_id: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132'), trigger: 'blur' },
          { validator: this.$validate('k8sName') },
        ],
        federatednamespace_id: [
          { required: true, message: this.$t('k8s.text_61'), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 16 },
          xl: { span: 18 },
          xxl: { span: 20 },
        },
        labelCol: {
          md: { span: 8 },
          xl: { span: 6 },
          xxl: { span: 4 },
        },
      },
      federatednamespaceParams: {
        scope: this.$store.getters.scope,
        limit: 0,
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
