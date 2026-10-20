<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" v-model:clusterObj="clusterObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.fd.namespace" @input="onNamespaceInput" :cluster="cluster" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_339')" class="mb-0" prop="selector">
        <a-radio-group v-model:value="form.fd.selectorType">
          <a-radio-button value="deployments">{{$t('k8s.text_4')}}</a-radio-button>
          <a-radio-button value="statefulsets">{{$t('k8s.text_5')}}</a-radio-button>
          <a-radio-button value="daemonsets">{{$t('k8s.text_6')}}</a-radio-button>
        </a-radio-group>
        <a-form-model-item prop="selector">
          <base-select
            v-model:value="form.fd.selector"
            :resource="form.fd.selectorType"
            version="v1"
            idKey="name"
            v-model:item="selectedObj"
            :need-params="true"
            :isDefaultSelect="true"
            :params="resParams"
            :select-props="{ placeholder: $t('k8s.text_77') }" />
        </a-form-model-item>
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_13')">
        <port-mapping
          ref="portMappingRef"
          :form="form"
          :model="form.fd"
          ignore-none
          :cluster-obj="clusterObj" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import PortMapping from '@K8S/sections/PortMapping'
import k8sCreateMixin from '@K8S/mixins/create'
import { getServiceCreateParams } from '@K8S/utils'

export default {
  name: 'K8sServiceCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
    PortMapping,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      selectedObj: {},
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          namespace: this.$store.state.common.k8s.namespace,
          selectorType: 'deployments',
          selector: undefined,
        },
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
        selector: [
          { required: true, message: this.$t('k8s.text_77'), trigger: 'blur' },
        ],
      },
      clusterObj: {},
      namespaceObj: {},
    }
  },
  computed: {
    resParams () {
      const params = {}
      if (this.cluster && this.namespaceObj.name) {
        params.cluster = this.cluster
        params.limit = 0
        params.namespace = this.namespaceObj.id
        params.scope = this.$store.getters.scope
        params.details = true
      }
      return params
    },
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
      await new this.$Manager('k8s_services', 'v1').create({ data })
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        let params = {
          name: values.name,
          cluster: values.cluster,
          namespace: values.namespace,
          selector: this.selectedObj.selector,
        }
        const service = getServiceCreateParams(values)
        params = { ...params, ...service }
        await this._doCreate(params)
        this.$message.success(this.$t('k8s.text_46'))
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
