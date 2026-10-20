<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item prop="file">
          <a-upload-dragger
            name="file"
            accept=".ocdb"
            :fileList="fileList"
            :multiple="false"
            :beforeUpload="handleBeforeUpload"
            @change="handleChange">
            <p class="ant-upload-drag-icon">
              <icon type="inbox" />
            </p>
            <p class="ant-upload-text">{{$t('dashboard.text_112')}}</p>
          </a-upload-dragger>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { Base64 } from 'js-base64'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { uuid } from '@/utils/utils'

export default {
  name: 'DashboardImport',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        file: null,
      },
      rules: {
        file: [
          { required: true, message: this.$t('dashboard.text_113') },
        ],
      },
      fileList: [],
    }
  },
  computed: {
    ...mapGetters(['scope']),
  },
  unmounted () {
    this.pm = null
  },
  created () {
    this.pm = new this.$Manager('parameters', 'v1')
  },
  methods: {
    readFileAsync (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    handleBeforeUpload () {
      return false
    },
    handleChange (info) {
      let fileList = [...info.fileList]
      fileList = fileList.slice(-1)
      this.fileList = fileList
      this.form.file = fileList[0] || null
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const fileData = await this.readFileAsync(this.form.file.file)
        const fileDataArr = fileData.split(',')
        const objStr = Base64.decode(Base64.decode(fileDataArr[1]))
        const data = JSON.parse(objStr)
        if (data.scope !== this.scope) {
          this.$message.warning(this.$t('dashboard.text_114', [this.$t(`policyScopeLabel.${data.scope}`), this.$t(`policyScopeLabel.${this.scope}`)]))
          this.loading = false
          return
        }
        const optionsCreated = await this.params.checkOptionsCreated()
        if (!optionsCreated) {
          await this.params.initOptions()
        }
        const options = [...this.params.options]
        const id = `dashboard-${this.scope}-panel-${uuid(16)}`
        const item = {
          name: this.params.genName(data.name),
          id,
        }
        options.push(item)
        await this.params.updateOptions(options)
        const panelData = {}
        for (let i = 0, len = data.items.length; i < len; i++) {
          panelData[`dashboard-item-${uuid(32)}`] = data.items[i]
        }
        await this.pm.create({
          data: {
            name: id,
            value: panelData,
          },
        })
        this.cancelDialog()
        this.params.selectOption(item)
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
