<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.name}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.host')" :count="params.data.length" :action="$t('compute.text_547')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_548')" prop="enable" :extra="$t('compute.text_549')">
          <a-switch v-model:checked="form.enable" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
  name: 'DowntimeMigrateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        enable: this.params.data[0].auto_migrate_on_host_down,
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
    doMigrate () {
      const data = {
        auto_migrate_on_host_down: this.form.enable ? 'enable' : 'disable',
      }
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        managerArgs: {
          action: 'auto-migrate-on-host-down',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doMigrate()
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
