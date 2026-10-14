<template>
  <div class="k8s-deployment-create w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.cluster" @input="setCluster" v-model:clusterObj="clusterObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_373')" prop="role">
        <base-select
          resource="rbacclusterroles"
          version="v1"
          :params="clusterRoleparams"
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
      <a-form-model-item :label="$t('k8s.text_23')" v-if="form.subjectType === 'ServiceAccount'" prop="namespace">
        <namespace-select v-model:value="form.namespace" :cluster="cluster" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <a-form-model-item label="Subject Name" prop="subject">
        <base-select
          v-if="form.subjectType === 'ServiceAccount'"
          v-model:value="form.subject"
          resource="serviceaccounts"
          version="v1"
          idKey="name"
          :params="params"
          need-params
          :select-props="{ placeholder: $t('common.select') }" />
        <template v-else>
          <base-select
            v-if="subjectOpts.length"
            v-model:value="form.subject"
            :options="subjectOpts"
            version="v1"
            idKey="name"
            :select-props="{ placeholder: $t('common.select') }" />
          <a-input v-else v-model:value="form.subject" :placeholder="$t('common.placeholder')" />
        </template>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import k8sCreateMixin from '@K8S/mixins/create'

const API_GROUP = 'rbac.authorization.k8s.io'

export default {
  name: 'K8sRbacclusterrolebindingFormCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        cluster: this.$store.state.common.k8s.cluster,
        namespace: this.$store.state.common.k8s.namespace,
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
        cluster: [
          { required: true, message: this.$t('k8s.text_30'), trigger: 'blur' },
        ],
        namespace: [
          {
            validator: (rule, value, callback) => {
              if (this.form.subjectType !== 'ServiceAccount') return callback()
              if (!value) return callback(this.$t('k8s.text_61'))
              return callback()
            },
          },
        ],
        role: [
          { required: true, message: this.$t('common.select'), trigger: 'blur' },
        ],
        subject: [
          { required: true, message: this.$t('common.select'), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      clusterObj: {},
      namespaceObj: {},
      subjectTypeOpts: [
        { key: 'User', label: 'User' },
        { key: 'Group', label: 'Group' },
        { key: 'ServiceAccount', label: this.$t('k8s.text_26') },
      ],
      subjectOpts: [],
    }
  },
  computed: {
    clusterRoleparams () {
      const cluster = this.clusterObj.id
      if (!cluster) return {}
      return {
        cluster,
        limit: 0,
        scope: this.$store.getters.scope,
      }
    },
    params () {
      const cluster = this.clusterObj.id
      const namespace = this.namespaceObj.id
      if (!cluster || !namespace) return {}
      return {
        cluster,
        namespace,
        limit: 0,
        scope: this.$store.getters.scope,
      }
    },
  },
  watch: {
    clusterObj () {
      this.namespaceObj = {}
      this.getSubjectOpts()
    },
  },
  methods: {
    async getSubjectOpts () {
      try {
        const cluster = this.clusterObj.id
        let spec = ''
        if (this.form.subjectType === 'User') spec = 'cluster-users'
        if (this.form.subjectType === 'Group') spec = 'cluster-user-groups'
        if (cluster) {
          const { data } = await new this.$Manager('kubeclusters', 'v1').getSpecific({ id: cluster, spec, params: { scope: this.$store.getters.scope } })
          this.subjectOpts = data
        }
      } catch (error) {
        throw error
      }
    },
    subjectTypeChange () {
      this.form.subject = undefined
      this.getSubjectOpts()
    },
    async validateForm () {
      try {
        await this.$refs.formRef.validate()
        const subjects = [{
          kind: this.form.subjectType,
          name: this.form.subject,
        }]
        if (subjects[0].kind === 'ServiceAccount') {
          subjects[0].namespace = this.namespaceObj.name
        } else {
          subjects[0].apiGroup = API_GROUP
        }
        return {
          cluster_id: this.form.cluster,
          name: this.form.name,
          roleRef: {
            kind: 'ClusterRole',
            name: this.form.role,
            apiGroup: API_GROUP,
          },
          subjects,
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
