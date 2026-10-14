<template>
 <div>
   <a-form-model-item :label="$t('cloudenv.text_113')">
    <a-radio-group @change="handleTypeChange" v-model:value="type">
        <a-radio-button :value="1">{{$t('cloudenv.text_114')}}</a-radio-button>
        <a-radio-button :value="2">{{$t('cloudenv.text_115')}}</a-radio-button>
      </a-radio-group>
   </a-form-model-item>
   <a-form-model-item :label="$t('cloudenv.text_116')" v-if="type === 1" class="google-account-file">
    <a-upload-dragger
      v-bind="uploadDraggerConfig"
      :beforeUpload="handleBeforeUpload"
      @remove="hanldeRemoveFile"
      :fileList="fileList">
      <div style="padding: 10px;">
        <p class="ant-upload-drag-icon">
        <icon type="inbox" />
      </p>
        <p class="ant-upload-text">{{$t('cloudenv.text_117')}}</p>
        <p class="ant-upload-hint">{{$t('cloudenv.text_118')}}</p>
      </div>
    </a-upload-dragger>
  </a-form-model-item>
  <slot v-else />
 </div>
</template>

<script>
export default {
  name: 'ObjectsUploadFileDialog',
  props: {
    form: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      type: 1,
      fileList: [],
      loading: false,
    }
  },
  computed: {
    uploadDraggerConfig () {
      return {
        name: 'file',
        accept: '.json',
        headers: {
          Authorization: `Bearer ${this.$store.getters.userInfo.session}`,
        },
      }
    },
  },
  created () {
    this.fileList = []
  },
  methods: {
    handleTypeChange () {
      this.fileList = []
    },
    setValues (jsonStr) {
      if (!jsonStr || jsonStr === '') return false
      const json = JSON.parse(jsonStr)
      const fieldMap = {
        project_id: 'gcp_project_id',
        private_key_id: 'gcp_private_key_id',
        private_key: 'gcp_private_key',
        client_email: 'gcp_client_email',
      }
      Object.keys(fieldMap).forEach(key => {
        if (json[key] !== undefined) {
          this.form[fieldMap[key]] = json[key]
        }
      })
    },
    handleBeforeUpload (file) {
      const isJson = file.name.endsWith('.json')
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isJson) {
        this.$message.error(this.$t('cloudenv.text_120'))
        return false
      }
      if (!isLt2M) {
        this.$message.error(this.$t('cloudenv.text_121'))
        return false
      }
      file.text().then(jsonStr => {
        this.setValues(jsonStr)
      })
      this.fileList = [file]
      return false
    },
    hanldeRemoveFile () {
      this.fileList = []
      return true
    },
  },
}
</script>
<style>
.google-account-file .ant-upload-drag-container {
  display: block !important;
}
.google-account-file .ant-form-item-label {
  visibility: hidden;
}
</style>
