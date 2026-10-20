<template>
  <div class="k8s-deployment-create w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_373')" prop="role">
        <base-select
          resource="federatedclusterroles"
          version="v1"
          :params="params"
          need-params
          idKey="name"
          v-model:value="form.role"
          :select-props="{ placeholder: $t('common.select') }" />
      </a-form-model-item>
      <a-form-model-item label="Subject" prop="subjectType">
        <a-radio-group v-model:value="form.subjectType" @change="subjectTypeChange">
          <a-radio-button v-for="item in subjectTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
        </a-radio-group>
      </a-form-model-item>
      <a-form-model-item label="Subject Name" prop="subject">
        <base-select
          v-if="subjectOpts.length"
          v-model:value="form.subject"
          :options="subjectOpts"
          version="v1"
          idKey="name"
          :select-props="{ placeholder: $t('common.select') }" />
        <a-input v-else v-model:value="form.subject" :placeholder="$t('common.placeholder')" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import k8sCreateMixin from '@K8S/mixins/create'

const API_GROUP = 'rbac.authorization.k8s.io'

export default {
  name: 'K8sFederatedClusterRolebindingFormCreate',
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        role: undefined,
        subjectType: 'User',
        subject: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('k8s.text_60') },
          { min: 2, max: 24, message: this.$t('k8s.text_132'), trigger: 'blur' },
          { validator: this.$validate('k8sName') },
        ],
        role: [
          { required: true, message: this.$t('common.select'), trigger: 'blur' },
        ],
        subject: [
          { required: true, message: this.$t('common.select'), trigger: 'blur' },
        ],
      },
      subjectTypeOpts: [
        { key: 'User', label: 'User' },
        { key: 'Group', label: 'Group' },
      ],
      subjectOpts: [],
      params: {
        limit: 0,
        scope: this.$store.getters.scope,
      },
    }
  },
  created () {
    this.getSubjectOpts()
  },
  methods: {
    subjectTypeChange () {
      this.form.subject = undefined
      this.getSubjectOpts()
    },
    async getSubjectOpts () {
      try {
        let spec = ''
        if (this.form.subjectType === 'User') spec = 'cluster-users'
        if (this.form.subjectType === 'Group') spec = 'cluster-user-groups'
        const { data } = await new this.$Manager('federatedclusterroles', 'v1').get({ id: spec, params: { scope: this.$store.getters.scope } })
        this.subjectOpts = data
      } catch (error) {
        throw error
      }
    },
    async validateForm () {
      try {
        await this.$refs.formRef.validate()
        const subjects = [{
          kind: this.form.subjectType,
          name: this.form.subject,
          apiGroup: API_GROUP,
        }]
        return {
          name: this.form.name,
          spec: {
            template: {
              roleRef: {
                kind: 'ClusterRole',
                name: this.form.role,
                apiGroup: API_GROUP,
              },
              subjects,
            },
          },
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
