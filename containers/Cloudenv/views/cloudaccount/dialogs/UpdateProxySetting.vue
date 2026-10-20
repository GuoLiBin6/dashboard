<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudaccount')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form.fd"
        :rules="rules">
        <proxy-setting :form="form.fd" :account="params.data[0]" />
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
import ProxySetting from '../components/ProxySetting'

export default {
  name: 'UpdateProxySettingDialog',
  components: {
    ProxySetting,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        fd: {
          proxy_setting: '',
        },
      },
      rules: {
        proxy_setting: [
          { required: true, message: this.$t('common.tips.select', [this.$t('cloudenv.text_14')]) },
        ],
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form.fd }
        values.proxy_setting = values.proxy_setting || 'DIRECT'
        const ids = this.params.data.map(item => item.id)
        if (ids.length > 1) {
          await this.params.onManager('batchUpdate', {
            ids,
            managerArgs: {
              data: values,
            },
          })
        } else {
          await this.params.onManager('update', {
            id: ids[0],
            managerArgs: {
              data: values,
            },
          })
        }
        this.cancelDialog()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
