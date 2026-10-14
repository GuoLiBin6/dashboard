<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="this.params.title" :name="$t('storage.text_112')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-form-model-item :label="key" v-for="(val, key) in TYPES" :key="key" :prop="key">
          <a-input :placeholder="val" v-model:value="form[key]" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ObjectsUpdateHttpDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const TYPES = {
      'Content-Type': '',
      'Content-Encoding': this.$t('storage.text_113'),
      'Content-Language': this.$t('storage.text_114'),
      'Content-Disposition': this.$t('storage.text_115'),
      'Cache-Control': this.$t('storage.text_116'),
    }
    const form = {}
    const { data } = this.params
    const meta = data[0].meta
    Object.keys(TYPES).forEach(item => {
      form[item] = meta && meta[item] ? meta[item].toString() : undefined
    })
    return {
      loading: false,
      formItemLayout: {
        labelCol: { span: 5 },
        wrapperCol: { span: 19 },
      },
      fileList: [],
      form,
      TYPES,
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const valies = { ...this.form }
        for (const k in valies) {
          if (!valies[k]) {
            delete valies[k]
          } else {
            valies[k] = [valies[k]]
          }
        }
        const { resId, data } = this.params
        await new this.$Manager('buckets', 'v2').performAction({
          id: resId,
          action: 'metadata',
          data: {
            key: data.map(({ key }) => key),
            metadata: valies,
          },
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
