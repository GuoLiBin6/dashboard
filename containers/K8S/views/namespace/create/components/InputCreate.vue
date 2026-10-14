<template>
  <div>
    <a-alert :message="$t('k8s.text_286')" banner />
    <a-form-model
      ref="formRef"
      class="mt-3"
      :model="form"
      :rules="rules"
      v-bind="formItemLayout">
      <a-form-model-item
        :label="$t('k8s.text_19')"
        prop="cluster">
        <cluster-select
          v-model:value="form.cluster"
          @input="setCluster"
          v-model:clusterObj="clusterObj"
          style="width: 140px;" />
      </a-form-model-item>
      <a-form-model-item
        :label="$t('k8s.text_287')"
        prop="yaml">
        <code-mirror v-model:value="form.yaml" :options="cmOptions" />
      </a-form-model-item>
      <a-form-model-item :wrapper-col="{ span: 20, offset: 3 }">
        <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{$t('k8s.text_288')}}</a-button>
        <a-button @click="cancel">{{$t('k8s.text_162')}}</a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script>
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/material.css'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'InputCreate',
  components: {
    ClusterSelect,
  },
  mixins: [k8sCreateMixin],
  data () {
    return {
      loading: false,
      form: {
        cluster: undefined,
        yaml: '',
      },
      rules: {
        cluster: [
          { required: true, message: this.$t('k8s.text_30') },
        ],
        yaml: [
          { required: true, message: this.$t('k8s.text_289') },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 20 },
        labelCol: { span: 3 },
      },
      clusterObj: {},
      cmOptions: {
        tabSize: 4,
        styleActiveLine: true,
        lineNumbers: true,
        line: true,
        mode: 'text/x-yaml',
        lineWrapping: true,
        theme: 'material',
      },
    }
  },
  created () {
    this.inputM = new this.$Manager('appfromfiles', 'v1')
  },
  unmounted () {
    this.inputM = null
  },
  methods: {
    doCreate (data) {
      return this.inputM.create({
        data: {
          content: data.yaml,
          cluster: data.cluster,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        this.$message.success(this.$t('k8s.text_184'))
        this.$router.push('/k8s-namespace')
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    cancel () {
      this.$router.push('/k8s-namespace')
    },
  },
}
</script>
