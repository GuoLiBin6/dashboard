<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('monitor.dashboard.dialog.clone')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('monitor.dashboard.title')" :count="params.data.length" :action="$t('monitor.dashboard.dialog.clone')" />
      <dialog-table :data="params.data" :columns="params.columns" />
    </div>
    <div slot="footer">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('common.name')" prop="clone_panel_name">
          <a-input v-model:value="form.clone_panel_name" :placeholder="$t('monitor.text_7')" />
        </a-form-model-item>
      </a-form-model>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CloneMonitorDashboardChart',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        clone_panel_name: '',
      },
      rules: {
        clone_panel_name: [
          { required: true, message: `${this.$t('common.placeholder')}${this.$t('common.name')}` },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 20 },
        labelCol: { span: 3 },
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await new this.$Manager('alertpanels', 'v1').performAction({
          id: this.params.data[0].id,
          action: 'clone-panel',
          data: { clone_panel_name: this.form.clone_panel_name },
        })
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>

<style scoped>

</style>
