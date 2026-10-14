<template>
  <div>
    <page-header :title="$t('k8s.text_177')" />
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form"
      :rules="rules"
      v-bind="formItemLayout">
      <a-form-model-item
        :label="$t('k8s.text_412')"
        prop="project_domain_id">
        <base-select
          v-if="isAdminMode"
          v-model:value="form.project_domain_id"
          resource="domains"
          version="v1"
          :params="domainParams"
          is-default-select
          filterable />
        <div v-else>{{ userInfo.projectDomain }}</div>
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_41')"
        prop="name">
        <a-input v-model:value="form.name" :placeholder="$t('k8s.text_60')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_401')" prop="distribution">
        <icon-radio v-model:value="form.distribution" :options="clusterTypesOpt" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_181')"
        prop="kubeconfig">
        <code-mirror v-model:value="form.kubeconfig" :options="cmOptions" />
      </a-form-model-item>
      <a-form-model-item :wrapper-col="offsetWrapperCol">
        <a-button class="mr-2" type="primary" @click="doImport" :loading="loading">{{$t('k8s.text_143')}}</a-button>
        <a-button @click="cancel">{{$t('k8s.text_162')}}</a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { validateYaml } from '@/utils/validate'
import IconRadio from '@/sections/IconRadio'

export default {
  name: 'ClusterImport',
  components: {
    IconRadio,
  },
  data () {
    const validator = (rule, value, _callback) => {
      validateYaml(value)
        .then(() => {
          return _callback()
        })
        .catch(() => {
          return _callback(this.$t('k8s.text_182'))
        })
    }
    const clusterTypesOpt = [
      { key: 'k8s', label: 'K8S', icon: { type: 'k8s', preserveColor: true }, style: { color: 'rgb(50, 109, 230)' } },
      { key: 'openshift', label: 'OpenShift', icon: { type: 'openshift' }, style: { color: 'rgb(225, 38, 52)' } },
    ]
    return {
      loading: false,
      form: {
        project_domain_id: undefined,
        name: '',
        distribution: clusterTypesOpt[0].key,
        kubeconfig: '',
      },
      rules: {
        project_domain_id: [
          {
            validator: (rule, value, callback) => {
              if (!this.isAdminMode) return callback()
              if (!value) return callback(this.$t('k8s.text_413'))
              return callback()
            },
          },
        ],
        name: [
          { required: true, message: this.$t('k8s.text_60'), trigger: 'blur' },
        ],
        kubeconfig: [
          { required: true, message: this.$t('k8s.text_183') },
          { validator },
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
      offsetWrapperCol: {
        md: { span: 16, offset: 8 },
        xl: { span: 18, offset: 6 },
        xxl: { span: 20, offset: 4 },
      },
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        theme: 'material',
        autofocus: true,
      },
      clusterTypesOpt,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'scope']),
    domainParams () {
      return {
        scope: this.scope,
        limit: 0,
      }
    },
  },
  methods: {
    async doImport () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = this.form
        const data = {
          mode: 'import',
          provider: 'external',
          resource_type: 'unknown',
          name: values.name,
          project_domain_id: this.isAdminMode ? values.project_domain_id : this.userInfo.domain?.id,
          import_data: {
            kubeconfig: values.kubeconfig,
          },
        }
        if (values.distribution === 'openshift') {
          data.import_data.distribution = 'openshift'
        }
        await new this.$Manager('kubeclusters', 'v1').create({ data })
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.cancel()
      } catch (error) {
        this.loading = false
      }
    },
    cancel () {
      this.$router.push('/k8s-cluster')
    },
  },
}
</script>
