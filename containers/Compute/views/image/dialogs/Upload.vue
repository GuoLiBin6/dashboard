<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.imageType === 'appPackage' ? $t('compute.upload_app_package') : $t('compute.text_664')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_665')}}</template>
      </a-alert>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_667')" prop="uploadType">
          <a-radio-group @change="handleUploadTypeChange" v-model:value="form.uploadType">
            <a-radio-button value="file">{{$t('compute.text_668')}}</a-radio-button>
            <a-radio-button value="url">{{$t('compute.text_669')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_670')" v-if="byUpload" :help="uploadFileHelp">
          <a-upload
            @change="handleUploadChange"
            @reject="handleUploadReject"
            :fileList="fileList"
            :beforeUpload="beforeUpload">
            <a-button> <icon type="upload" />{{$t('compute.text_245')}}</a-button>
          </a-upload>
          <a-progress
            v-if="loading"
            :strokeColor="{ from: '#108ee9', to: '#87d068' }"
            :percent="imageUploadPercent"
            status="active" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_672')" v-if="!byUpload" prop="copy_from">
          <a-input :placeholder="$t('compute.text_673')" v-model:value="form.copy_from" @change="handleCopyFromChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_627')" prop="name">
          <a-input :placeholder="$t('compute.text_416')" v-model:value="form.name" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_267')" prop="os_type">
          <a-radio-group v-model:value="form.os_type">
            <a-radio-button value="Linux">
              Linux
            </a-radio-button>
            <a-radio-button value="Windows">
              Windows
            </a-radio-button>
            <a-radio-button value="other">{{$t('compute.text_674')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1365')">
          <os-arch
            :value="form.os_arch"
            @change="v => form.os_arch = v"
            :form="form" />
        </a-form-model-item>
        <a-form-model-item v-if="enableEncryption" :label="$t('compute.image.encryption')" :extra="$t('compute.image.encryption.extra')">
          <encrypt-keys :form="form" :model="form" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'
import EncryptKeys from '@Compute/sections/encryptkeys/model'
import { isRequired } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import DomainProject from '@/sections/DomainProject/model'
import OsArch from '@/sections/OsArch'
import { HOST_CPU_ARCHS } from '@/constants/compute'
export default {
  name: 'ImageUploadDialog',
  components: {
    DomainProject,
    OsArch,
    EncryptKeys,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        domain: this.$store.getters.userInfo.projectDomainId,
        project: this.$store.getters.userInfo.projectId,
        name: undefined,
        uploadType: 'file',
        copy_from: undefined,
        os_type: 'Linux',
        os_arch: HOST_CPU_ARCHS.x86.key,
        encryptEnable: '',
        encrypt_key_alg: '',
        encrypt_key_id: undefined,
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('compute.text_660') },
          { validator: this.$validate('imageName') },
          { validator: this.checkTemplateName },
        ],
        copy_from: [
          { required: true, message: this.$t('compute.text_673') },
          { validator: this.validateUrl },
        ],
      },
      byUpload: true,
      fileList: [],
      imageUploadPercent: 0,
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    headers () {
      return { Authorization: `Bearer ${this.$store.getters.userInfo.session}` }
    },
    enableEncryption () {
      return this.$appConfig.isPrivate && !this.$store.getters.isSysCE
    },
    isAppPackage () {
      return this.params.imageType === 'appPackage'
    },
    uploadFileHelp () {
      return this.isAppPackage
        ? this.$t('compute.upload_app_package_file_help')
        : this.$t('compute.text_671')
    },
  },
  unmounted () {
    this.clearTimer()
  },
  methods: {
    clearTimer () {
      clearTimeout(this.timer)
      clearTimeout(this.percentTimer)
      this.timer = null
      this.percentTimer = null
    },
    isTarGzFile (name) {
      const n = (name || '').toLowerCase()
      return n.endsWith('.tar.gz') || n.endsWith('.tgz')
    },
    beforeUpload (file) {
      if (this.isAppPackage && !this.isTarGzFile(file.name)) {
        this.$message.error(this.$t('compute.upload_app_package_format_tip'))
        return Promise.reject(new Error(this.$t('compute.upload_app_package_format_tip')))
      }
      this.fileList = [file]
      this.setImageName(file.name)
      return false
    },
    handleUploadReject () {
      if (this.isAppPackage) {
        this.$message.error(this.$t('compute.upload_app_package_format_tip'))
      }
    },
    handleUploadTypeChange (e) {
      if (e.target.value === 'url') {
        this.byUpload = false
        this.$nextTick(() => {
          this.setImageNameFromUrl(this.form.copy_from)
        })
      } else {
        this.byUpload = true
        this.setImageNameFromFileList(this.fileList)
      }
    },
    handleUploadChange ({ fileList }) {
      if (!this.isAppPackage) {
        this.fileList = fileList
        this.setImageNameFromFileList(fileList)
        return
      }
      const valid = (fileList || []).filter(f => this.isTarGzFile(f.name))
      if (valid.length < (fileList || []).length) {
        this.$message.error(this.$t('compute.upload_app_package_format_tip'))
      }
      this.fileList = valid.length ? valid.slice(-1) : []
      this.setImageNameFromFileList(this.fileList)
    },
    handleCopyFromChange (e) {
      const url = e && e.target ? e.target.value : e
      this.setImageNameFromUrl(url)
    },
    getFileNameFromUrl (url) {
      if (!url || typeof url !== 'string') return ''
      const trimmed = url.trim()
      if (!trimmed) return ''
      let pathname = trimmed
      try {
        pathname = new URL(trimmed).pathname
      } catch (e) {
        pathname = trimmed.split('?')[0].split('#')[0]
      }
      const segments = pathname.split('/').filter(Boolean)
      if (!segments.length) return ''
      let fileName = segments[segments.length - 1]
      try {
        fileName = decodeURIComponent(fileName)
      } catch (e) { /* keep raw */ }
      return fileName
    },
    setImageName (name) {
      if (!name) return
      this.form.name = name
    },
    setImageNameFromFileList (fileList) {
      const file = fileList && fileList[0]
      const fileName = file && (file.name || (file.originFileObj && file.originFileObj.name))
      this.setImageName(fileName)
    },
    setImageNameFromUrl (url) {
      this.setImageName(this.getFileNameFromUrl(url))
    },
    checkTemplateName (rule, value, callback) {
      if (!value) {
        return callback(new Error(this.$t('compute.text_660')))
      }
      return new this.$Manager('images', 'v1').list({
        params: {
          name: value,
          scope: this.$store.getters.scope,
        },
      }).then(res => {
        const data = res.data.data
        if (!R.isNil(data) && !R.isEmpty(data)) {
          callback(new Error(this.$t('compute.text_662')))
        } else {
          callback()
        }
      })
    },
    validateUrl (rule, value, callback) {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        callback(new Error(this.$t('compute.text_675')))
        return
      }
      if (this.isAppPackage) {
        let path = value
        try {
          path = new URL(value).pathname
        } catch (e) { /* use raw value */ }
        if (!this.isTarGzFile(path) && !this.isTarGzFile(value)) {
          callback(new Error(this.$t('compute.upload_app_package_format_tip')))
          return
        }
      }
      callback()
    },
    handleUpload (data) {
      return this.$http({
        url: '/v1/imageutils/upload',
        method: 'post',
        processData: false,
        data,
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          this.imageUploadPercent = percent
          if (this.imageUploadPercent >= 100) {
            setTimeout(() => {
              this.cancelDialog()
              this.params.refresh()
            }, 2000)
          }
        },
      })
    },
    doImportUrl (data) {
      const params = {
        domain_id: (data.domain && data.domain.key) || this.userInfo.projectDomainId,
        project_id: (data.project && data.project.key) || this.userInfo.projectId,
        copy_from: data.copy_from,
        name: data.name,
        os_arch: data.os_arch,
        properties: {
          os_type: data.os_type,
          os_version: '',
          os_arch: data.os_arch,
        },
      }
      if (data.encryptEnable === 'existing' && data.encrypt_key_id) {
        params.encrypt_key_id = data.encrypt_key_id
      } else if (data.encryptEnable === 'new') {
        params.encrypt_key_new = true
        params.encrypt_key_alg = data.encrypt_key_alg
        params.encrypt_key_user_id = this.userInfo.id
      }
      return this.params.onManager('create', {
        managerArgs: {
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        const { fileList } = this
        const formData = new FormData()
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        formData.append('domain_id', (values.domain && values.domain.key) || this.userInfo.projectDomainId)
        formData.append('project_id', (values.project && values.project.key) || this.userInfo.projectId)
        if (values.uploadType === 'file') {
          formData.append('name', values.name)
          formData.append('os_version', '')
          formData.append('os_arch', values.os_arch)
          formData.append('properties.os_type', values.os_type)
          if (values.encryptEnable === 'existing' && values.encrypt_key_id) {
            formData.append('encrypt_key_id', values.encrypt_key_id)
          } else if (values.encryptEnable === 'new') {
            formData.append('encrypt_key_new', true)
            formData.append('encrypt_key_alg', values.encrypt_key_alg)
            formData.append('encrypt_key_user_id', this.userInfo.id)
          }
          if (fileList.length > 0) {
            const uploadFile = fileList[0]
            const fileName = uploadFile.name || uploadFile.originFileObj?.name
            if (this.isAppPackage && !this.isTarGzFile(fileName)) {
              this.$message.error(this.$t('compute.upload_app_package_format_tip'))
              this.loading = false
              return false
            }
            formData.append('image_size', uploadFile.size)
            fileList.forEach(file => {
              formData.append('image', file.originFileObj)
            })
          } else {
            this.$message.error(this.$t('compute.text_676'))
            this.loading = false
            return false
          }
          this.handleUpload(formData)
            .then(() => {})
            .catch(() => {
              this.loading = false
              this.clearTimer()
            })
        } else {
          await this.doImportUrl(values)
          this.cancelDialog()
          this.params.refresh()
        }
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
