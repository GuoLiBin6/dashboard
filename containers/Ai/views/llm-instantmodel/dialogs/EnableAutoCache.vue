<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('aice.llm_instantmodel.menu')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-form-model-item :label="$t('aice.mounted_apps.auto_cache.enable')">
          <a-switch :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" v-model:checked="form.auto_cache" />
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
  name: 'InstantAppAutoCacheDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const isAllClose = this.params.data.every((item) => { return !item.auto_cache })
    return {
      loading: false,
      action: this.$t('aice.mounted_apps.auto_cache.enable'),
      form: {
        auto_cache: !isAllClose,
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
      const showFields = ['name', 'package', 'version']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    async doSubmit () {
      const ids = this.params.data.map(item => item.id)
      const params = { auto_cache: this.form.auto_cache }
      return this.params.onManager('batchPerformAction', {
        id: ids,
        managerArgs: {
          action: 'enable-auto-cache',
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doSubmit()
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
