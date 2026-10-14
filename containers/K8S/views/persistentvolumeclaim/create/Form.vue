<template>
  <div class="w-75">
    <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
      <a-form-model-item :label="$t('k8s.text_41')" prop="name">
        <a-input :placeholder="$t('k8s.text_60')" v-model:value="form.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_305')" prop="size">
        <a-input-number v-model:value="form.size" :min="1" :max="500" /> G
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_19')" prop="cluster">
        <cluster-select v-model:value="form.cluster" @input="onClusterChange" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_23')" prop="namespace">
        <namespace-select v-model:value="form.namespace" @input="setNamespace" :cluster="cluster" />
      </a-form-model-item>
      <a-form-model-item :label="$t('k8s.text_22')" prop="storageClass">
        <div slot="extra">{{$t('k8s.text_306')}}<help-link :href="storageClassHref">{{$t('k8s.text_307')}}</help-link>
        </div>
        <base-select
          show-sync
          v-model:value="form.storageClass"
          resource="storageclasses"
          version="v1"
          id-key="name"
          v-model:resList="storageclassOpts"
          :need-params="true"
          :params="storageclassParams"
          :select-props="{ placeholder: $t('k8s.text_308') }" />
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import * as R from 'ramda'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import NamespaceSelect from '@K8S/sections/NamespaceSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'K8sPersistentvolumeclaimCreate',
  components: {
    ClusterSelect,
    NamespaceSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      form: {
        name: '',
        size: 1,
        cluster: this.$store.state.common.k8s.cluster,
        namespace: this.$store.state.common.k8s.namespace,
        storageClass: undefined,
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
        storageClass: [
          { required: true, message: this.$t('k8s.text_308'), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        labelCol: { span: 4 },
        wrapperCol: { span: 20 },
      },
      storageclassOpts: [],
    }
  },
  computed: {
    storageClassHref () {
      return `/v2/k8s-storageclass/create?cluster=${this.form.cluster}`
    },
    storageclassParams () {
      if (this.form.cluster) {
        return {
          cluster: this.form.cluster,
          limit: 0,
        }
      }
      return {}
    },
  },
  watch: {
    storageclassOpts (val, oldV) {
      if (!R.equals(val, oldV)) {
        const defaultItem = val.find(v => v.isDefault)
        if (R.is(Object, defaultItem)) {
          this.form.storageClass = defaultItem.name
        }
      }
    },
  },
  methods: {
    onClusterChange (cluster) {
      this.setCluster(cluster)
    },
    async validateForm () {
      await this.$refs.formRef.validate()
      return this.form
    },
    async _doCreate (data) {
      await new this.$Manager('persistentvolumeclaims', 'v1').create({ data })
    },
    async doCreate () {
      try {
        const values = await this.validateForm()
        const params = {
          ...values,
          size: values.size + 'G',
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
