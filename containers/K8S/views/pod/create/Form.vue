<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form.fd" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.fd.cluster" @input="onClusterInput" v-model:clusterObj="clusterObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.fd.namespace" @input="onNamespaceInput" :cluster="clusterObj.id" v-model:namespaceObj="namespaceObj" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_229')" prop="replicas">
        <a-input-number v-model:value="form.fd.replicas" :min="1" :max="10" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_220')">
        <image-secret
          :form="form"
          :namespace="namespaceObj.name"
          :cluster="clusterObj.id" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_13')">
        <port-mapping
          ref="portMappingRef"
          :form="form"
          :model="form.fd"
          :cluster-obj="clusterObj"
          :is-import-cluster="isImportCluster" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_221')">
        <restart-policy-select
          :form="form"
          type="pod" />
      </a-form-model-item>
      <a-collapse :bordered="false" class="mb-3">
        <a-collapse-panel :header="$t('k8s.text_223')" key="1">
          <a-form-model-item :label="$t('k8s.text_82')">
            <labels ref="labelsRef" />
          </a-form-model-item>
          <a-form-model-item :label="$t('k8s.text_224')">
            <labels ref="annotationsRef" :title="$t('k8s.text_224')" />
          </a-form-model-item>
        </a-collapse-panel>
      </a-collapse>
      <spec-container
        ref="specContainerRef"
        :form="form"
        :model="form.fd"
        v-model:panes="containerPanes"
        :errPanes="errPanes"
        :namespace="namespaceObj.name"
        :cluster="clusterObj.id" />
    </a-form-model>
  </div>
</template>

<script>
import * as R from 'ramda'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import ImageSecret from '@K8S/sections/ImageSecret'
import PortMapping from '@K8S/sections/PortMapping'
import RestartPolicySelect from '@K8S/sections/RestartPolicySelect'
import Labels from '@K8S/sections/Labels/model'
import SpecContainer from '@K8S/sections/SpecContainer'
import { getSpecContainerParams } from '@K8S/utils'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sPodCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
    ImageSecret,
    PortMapping,
    RestartPolicySelect,
    Labels,
    SpecContainer,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        fd: {
          name: '',
          cluster: this.$store.state.common.k8s.cluster,
          namespace: this.$store.state.common.k8s.namespace,
          replicas: 1,
        },
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
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
      errPanes: [],
      containerPanes: [],
      clusterObj: {},
      namespaceObj: {},
    }
  },
  computed: {
    isImportCluster () {
      if (this.clusterObj.mode === 'import') { // 导入的集群新建外部服务时不能选择网络
        return true
      }
      return false
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
    setErrorPane (err) {
      const keys = Object.keys(err).filter(v => v.startsWith('container'))
      const containerErrValues = keys.map(k => err[k])
      const errPanes = containerErrValues.map(v => Object.keys(v)).flat()
      this.errPanes = Array.from(new Set(errPanes))
    },
    async _doCreate (data) {
      await new this.$Manager('pods', 'v1').create({ data })
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        const spec = getSpecContainerParams(values, this.containerPanes)
        const labels = this.$refs.labelsRef ? this.$refs.labelsRef.getLabelMap() : {}
        const annotations = this.$refs.annotationsRef ? this.$refs.annotationsRef.getLabelMap() : {}
        const service = {}
        if (values.serviceType !== 'none') {
          service.isExternal = (values.serviceType === 'external')
          const portMappings = Object.keys(values.ports).map(key => {
            return {
              port: +values.ports[key],
              targetPort: +values.targetPorts[key],
              protocol: values.protocols[key],
            }
          })
          service.portMappings = portMappings
          if (service.isExternal) {
            if (values.loadBalancerCluster) service.loadBalancerCluster = values.loadBalancerCluster
            if (values.loadBalancerNetwork) service.loadBalancerNetwork = values.loadBalancerNetwork
          }
        }
        const template = {
          spec: {
            volumes: spec.volumes,
            containers: spec.containers,
            imagePullSecrets: values.imagePullSecrets,
            restartPolicy: values.restartPolicy,
          },
        }
        const params = {
          name: values.name,
          cluster: values.cluster,
          namespace: values.namespace,
          replicas: values.replicas,
          labels,
          annotations,
          template,
        }
        if (!R.isEmpty(service)) params.service = service
        await this._doCreate(params)
        this.$message.success(this.$t('k8s.text_46'))
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
