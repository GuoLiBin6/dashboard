<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.aksk.add') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.text_327')" prop="name">
          <a-textarea
            v-model:value="form.name"
            :placeholder="$t('cloudenv.aksk.placeholder')"
            :auto-size="{ minRows: 3, maxRows: 5 }" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'AkSkCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
      },
      rules: {
        name: [
          { required: false, message: this.$t('common_367') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const manager = new this.$Manager('cloudusers')
        const res = await manager.performAction({
          id: this.params.cloudaccountId,
          action: 'create-access-key',
          data: {
            id: this.params.cloudaccountId,
            name: this.form.name,
          },
        })
        this.cancelDialog()
        this.params.callback(res.data)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
