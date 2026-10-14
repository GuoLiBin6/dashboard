<template>
  <a-form-model-item :label="$t('compute.text_244')">
    <a-upload
      name="files"
      :fileList="fileList"
      :multiple="true"
      @remove="handleRemove"
      :beforeUpload="beforeUpload">
      <a-button> <icon type="upload" />{{$t('compute.text_245')}}</a-button>
    </a-upload>
    <template #extra>
      <span :class="err ? 'error-color' : 'text-color-help'">{{$t('compute.text_246')}}</span>
    </template>
  </a-form-model-item>
</template>
<script>

export default {
  name: 'AnsibleTemplateUpload',
  inject: ['form'],
  props: ['defaultFiles'],
  data () {
    return {
      fileList: [],
      files: {},
      err: false,
    }
  },
  watch: {
    files (newFiles) {
      if (this.form && typeof this.form === 'object') {
        this.form.files = newFiles
      }
    },
    fileList (newFileList) {
      this.setFiles(newFileList)
    },
    defaultFiles (fileBuffers) {
      if (fileBuffers) {
        Object.keys(fileBuffers).forEach((key, index) => {
          const buffer = new Uint8Array(fileBuffers[key]).buffer
          const blob = new Blob([buffer])
          const file = new File([blob], key)
          file.uid = index
          this.fileList.push(file)
        })
      }
    },
  },
  methods: {
    validateSize (filelist) {
      if (!filelist || filelist.length === 0) {
        return true
      }
      const MAX_KB = 64
      const filesSize = filelist.length === 1 ? filelist[0].size : filelist.reduce((x, y) => {
        return x.size + y.size
      })
      if (Math.ceil(parseFloat(filesSize) / 1024) > MAX_KB) {
        return false
      }
      return true
    },
    beforeUpload (file, filelist) {
      this.err = !this.validateSize(filelist.concat(this.fileList))
      this.fileList.push(file)
      return false
    },
    handleRemove (file) {
      const index = this.fileList.indexOf(file)
      const newFileList = this.fileList.slice()
      newFileList.splice(index, 1)
      this.fileList = newFileList
    },
    setFiles (fileList) {
      const files = {}
      const promises = fileList.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.readAsArrayBuffer(file)
          reader.onload = (e) => {
            files[file.name] = Array.from(new Uint8Array(e.target.result))
            resolve()
          }
        })
      })
      Promise.all(promises).then(() => {
        this.files = files
      })
    },
  },
}
</script>
