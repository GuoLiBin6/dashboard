<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.import_secgroup_rule', [])}}</div>
    <div slot="body">
      <a-spin :spinning="loading">
        <a-form-model
          ref="formRef"
          :model="form"
          :rules="rules">
          <a-alert type="warning" class="mb-2">
            <template v-slot:message>
              <div class="messages-list">
                <p>{{ $t('system.text_501') }}<a-button type="link" @click="handleDownloadTemplate">{{$t('system.text_502')}}</a-button></p>
              </div>
            </template>
          </a-alert>
          <div class="pt-3 pb-3">
            <a-form-model-item prop="fileList">
              <a-upload-dragger
                v-model:fileList="form.fileList"
                :beforeUpload="beforeUpload"
                :accept="accept"
                @remove="handleRemove">
                <div class="pt-3 pb-3">
                  <p class="ant-upload-drag-icon"><icon type="inbox" /></p>
                  <p class="ant-upload-text">{{$t('system.text_505')}}</p>
                  <p class="ant-upload-hint">{{$t('system.text_506')}}</p>
                </div>
              </a-upload-dragger>
            </a-form-model-item>
          </div>
        </a-form-model>
      </a-spin>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import XLSX from 'xlsx'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { download } from '@/utils/utils'

export default {
  name: 'ImportSecgroupRuleDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      accept: '.xlsx',
      rulesData: [],
      loading: false,
      form: {
        fileList: [],
      },
      rules: {
        fileList: [
          { required: true, message: this.$t('system.text_507'), type: 'array' },
        ],
      },
    }
  },
  methods: {
    beforeUpload (file) {
      this.readWorkbookFromLocalFile(file, (workbook) => {
        var first_worksheet = workbook.Sheets[workbook.SheetNames[0]]
        var sheetArr = XLSX.utils.sheet_to_json(first_worksheet, { header: 1 })
        const converVal = (v) => { return v || '' }
        const rules = []
        if (sheetArr) {
          for (let i = 1; i < sheetArr.length; i++) {
            const obj = sheetArr[i]
            rules.push({
              direction: converVal(obj[3]),
              action: converVal(obj[4]),
              protocol: converVal(obj[5]),
              ports: converVal(obj[6]),
              priority: converVal(obj[7]),
              cidr: converVal(obj[8]),
            })
          }
        }
        this.rulesData = rules
      })
      this.form.fileList = [file]
      return false
    },
    readWorkbookFromLocalFile (file, callback) {
      var reader = new FileReader()
      reader.onload = function (e) {
        var data = e.target.result
        var workbook = XLSX.read(data, { type: 'binary' })
        if (callback) callback(workbook)
      }
      reader.readAsBinaryString(file)
    },
    handleClearFile () {
      this.form.fileList = []
    },
    handleRemove () {
      this.handleClearFile()
    },
    async handleDownloadTemplate () {
      const exportDataOptions = this.params.exportDataOptions
      const items = exportDataOptions.items.map(v => {
        if (['id', 'secgroup', 'secgroup_id', 'tenant', 'user_tags'].includes(v.key)) {
          return {
            ...v,
            label: `${v.label}(${this.$t('compute.no_required')})`,
          }
        }
        return v
      })
      const params = {
        export: 'xls',
        export_keys: items.map(v => v.key).join(','),
        export_texts: items.map(v => v.label).join(','),
        export_limit: 1,
        scope: this.$store.getters.scope,
        show_fail_reason: true,
        details: true,
      }
      const response = await this.$http({
        methods: 'GET',
        url: `/v2/${exportDataOptions.resource}`,
        params,
        responseType: 'blob',
        headers: {
          'X-Export-Keys': true,
        },
      })
      const contentDisposition = response.headers['content-disposition']
      let fileName = 'unknown'
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch.length === 2) fileName = fileNameMatch[1]
      }
      download(response.data, fileName, response.headers['content-type'])
    },
    async handleConfirm () {
      try {
        this.loading = true
        await this.$refs.formRef.validate()
        await new this.$Manager('secgroups').performAction({
          id: this.params.data[0].id,
          action: 'import-rules',
          data: { rules: this.rulesData },
        })
        this.params.refresh()
        this.cancelDialog()
        this.$message.success(this.$t('compute.import_secgroup_rule', [this.$t('common_159')]))
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
  .messages-list p{
    margin-bottom: 2px;
  }
</style>
