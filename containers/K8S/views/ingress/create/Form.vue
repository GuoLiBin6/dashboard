<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.fd.namespace" :cluster="cluster" @input="onNamespaceInput" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.ingress.className')" prop="className">
        <a-input v-model:value="form.fd.className" @update:value="onClassNameInput" :placeholder="$t('k8s.ingress.className.input')" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_14')" required>
        <ingress-rule ref="ingressRuleRef" :form="form" :model="form.fd" :namespace="namespaceObj.name" :cluster="cluster" />
      </a-form-model-item>
      <div v-if="isNginxClass()">
        <a-form-model-item :label="$t('network.text_379')" prop="stickySession.enabled">
          <a-switch v-model:checked="form.fd.stickySession.enabled" @change="stickySessionChange" />
        </a-form-model-item>
        <div v-if="form.fd.stickySession.enabled">
          <a-form-model-item :label="$t('k8s.ingress.nginx.session-cookie-name')" prop="stickySession.name">
            <a-input v-model:value="form.fd.stickySession.name" />
          </a-form-model-item>
          <a-form-model-item :label="$t('k8s.ingress.nginx.session-cookie-expires')" prop="stickySession.cookieExpires">
            <a-input v-model:value="form.fd.stickySession.cookieExpires" type="number" />
          </a-form-model-item>
        </div>
      </div>
    </a-form-model>
  </div>
</template>

<script>
import * as R from 'ramda'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import k8sCreateMixin from '@K8S/mixins/create'
import IngressRule from './IngressRule'

export default {
  name: 'K8sIngressCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
    IngressRule,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      inputClassName: 'nginx',
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          namespace: this.$store.state.common.k8s.namespace,
          className: 'nginx',
          stickySession: {
            enabled: false,
            name: 'stickounet',
            cookieExpires: 1000,
          },
        },
      },
      errPanes: [], // 表单校验错误的tabs
      containerPanes: [], // 子组件同步的tabs
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
        className: [
          { required: true, message: this.$t('k8s.ingress.className.input'), trigger: 'blur' },
        ],
        'stickySession.cookieExpires': [
          {
            validator: (rule, value, callback) => {
              const n = Number(value)
              if (!Number.isInteger(n) || n < 60) {
                callback(new Error(this.$t('k8s.ingress.nginx.session-cookie-expires')))
              } else {
                callback()
              }
            },
            trigger: 'blur',
          },
        ],
      },
      namespaceObj: {},
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    onClusterInput (v) {
      this.form.fd.cluster = v
      this.setCluster(v)
    },
    onNamespaceInput (v) {
      this.form.fd.namespace = v
      this.setNamespace(v)
    },
    onClassNameInput (v) {
      this.form.fd.className = v
      this.inputClassName = v
    },
    isNginxClass () {
      return this.inputClassName === 'nginx'
    },
    stickySessionChange (val) {
      this.form.fd.stickySession.enabled = val
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      if (typeof this.$refs.portMappingRef?.validate === 'function') {
        await this.$refs.portMappingRef.validate()
      }
      if (typeof this.$refs.specContainerRef?.validate === 'function') {
        await this.$refs.specContainerRef.validate()
      }
      if (typeof this.$refs.ingressRuleRef?.validate === 'function') {
        await this.$refs.ingressRuleRef.validate()
      }
      return { ...this.form.fd }
    },
    async _doCreate (data) {
      await new this.$Manager('ingresses', 'v1').create({ data })
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        const rules = []
        R.forEachObjIndexed((value, key) => {
          const item = {
            host: value,
            paths: [],
          }
          R.forEachObjIndexed((val, k) => {
            item.paths.push({
              path: val,
              backend: {
                serviceName: values.serviceNames[key][k],
                servicePort: values.servicePorts[key][k],
              },
            })
          }, values.servicePaths[key])
          rules.push(item)
        }, values.hosts)
        const stickySession = values.stickySession ? {
          ...values.stickySession,
          cookieExpires: Number(values.stickySession.cookieExpires),
        } : values.stickySession
        const params = {
          name: values.name,
          cluster: values.cluster,
          namespace: values.namespace,
          ingressClassName: values.className,
          stickySession,
          rules,
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
