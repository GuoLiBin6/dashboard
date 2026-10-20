<template>
  <a-form-model
    ref="formRef"
    class="mt-3"
    :model="form"
    :rules="rules">
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
      :label="$t('k8s.text_290')"
      :extra="$t('k8s.text_291')"
      prop="yaml">
      <a-upload
        name="file"
        :beforeUpload="beforeUpload"
        :fileList="files"
        @change="handleFileChange"
        accept="application/x-yaml,application/json">
        <a-button> <icon type="upload" />{{$t('k8s.text_292')}}</a-button>
      </a-upload>
    </a-form-model-item>
    <a-form-model-item :wrapper-col="{ span: 20, offset: 3 }">
      <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{$t('k8s.text_290')}}</a-button>
      <a-button @click="cancel">{{$t('k8s.text_162')}}</a-button>
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/material.css'
import ClusterSelect from '@K8S/sections/ClusterSelect'
import k8sCreateMixin from '@K8S/mixins/create'

export default {
  name: 'UpdateCreate',
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
      clusterObj: {},
      files: [],
    }
  },
  created () {
    this.uploadM = new this.$Manager('appfromfiles', 'v1')
  },
  unmounted () {
    this.uploadM = null
  },
  methods: {
    beforeUpload (file) {
      this.files = [file]
      return false
    },
    handleFileChange ({ fileList }) {
      this.files = [fileList[fileList.length - 1]]
      this.getYamlContent()
    },
    getYamlContent () {
      if (!('FileReader' in window)) {
        return null
      }
      const file = this.files[0]
      if (!file) {
        return null
      }
      const fr = new FileReader()
      fr.readAsText(file.originFileObj)
      fr.onload = (evt) => {
        this.form.yaml = evt.target.result
        this.$refs.formRef?.validateField('yaml')
      }
      fr.onerror = () => {
        this.$message.error(this.$t('k8s.text_293'))
      }
    },
    doCreate (data) {
      return this.uploadM.create({
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
