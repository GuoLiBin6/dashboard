<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_1257')" :help="$t('compute.text_1258')" prop="open">
          <a-switch v-model:checked="form.open" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
  name: 'VmSourceTargetCheckDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const isAllClose = this.params.data.every((item) => { return !(item.src_ip_check && item.src_mac_check) })
    return {
      loading: false,
      action: this.$t('compute.text_1124'),
      form: {
        open: !isAllClose,
      },
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
    }
  },
  computed: {
    columns () {
      const showFields = ['name', 'ip', 'brand']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    async doSubmit () {
      const ids = this.params.data.map(item => item.id)
      const open = this.form.open ? 'on' : 'off'
      const params = { src_ip_check: open, src_mac_check: open }
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: 'running',
        managerArgs: {
          action: 'modify-src-check',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doSubmit()
        this.cancelDialog()
      } catch (error) {
        // submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
