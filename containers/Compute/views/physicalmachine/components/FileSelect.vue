<template>
  <a-form-model-item :wrapper-col="offsetWrapperCol" prop="file">
    <a-alert type="warning" class="mb-2">
      <template v-slot:message>
        <div>{{$t('compute.text_814')}}</div>
        <div>{{$t('compute.text_815')}}<a-button type="link" @click="handleDownloadTemplate">{{$t('compute.text_816')}}</a-button></div>
        <div>{{$t('compute.text_817')}}</div>
      </template>
    </a-alert>
    <a-upload-dragger
      :beforeUpload="beforeUpload"
      :fileList="fileList"
      @remove="handleRemove">
      <div class="pt-3 pb-3">
        <p class="ant-upload-drag-icon"><icon type="inbox" /></p>
        <p class="ant-upload-text">{{$t('compute.text_818')}}</p>
        <p class="ant-upload-hint">{{$t('compute.text_819')}}</p>
      </div>
    </a-upload-dragger>
  </a-form-model-item>
</template>

<script>
import { download } from '@/utils/utils'

export default {
  name: 'FileSelect',
  props: {
    offsetWrapperCol: {
      type: Object,
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },
  },
  inject: ['form'],
  data () {
    return {
      fileList: [],
    }
  },
  mounted () {
    this.$bus.$on('PhysicalmachineAddFileSelectClear', this.handleClearFile, this)
  },
  methods: {
    syncFileToForm (file) {
      if (this.form?.fd) {
        // 与 submit / validateFile 约定一致：fd.file = { file: File }
        this.$set(this.form.fd, 'file', file ? { file } : undefined)
      }
    },
    beforeUpload (file) {
      this.fileList = [file]
      this.syncFileToForm(file)
      return false
    },
    handleDownloadTemplate () {
      this.$http({
        method: 'GET',
        url: this.downloadUrl,
        responseType: 'blob',
      }).then(response => {
        download(response.data, 'host_template.xlsx')
      })
    },
    handleClearFile () {
      this.fileList = []
      this.syncFileToForm(undefined)
    },
    handleRemove () {
      this.handleClearFile()
    },
  },
}
</script>
