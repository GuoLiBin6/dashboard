<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('monitor.edit_name')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('monitor.dashboard.title')" :count="params.data.length" :action="$t('monitor.edit_name')" />
      <dialog-table :data="params.data" :columns="params.columns" />
    </div>
    <div slot="footer">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('monitor.text_7')" />
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
  name: 'MonitorDashboardChangeName',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: this.params.data[0].name,
      },
      rules: {
        name: [
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
        await new this.$Manager('alertdashboards', 'v1').update({
          id: this.params.data[0].id,
          data: { name: this.form.name },
        })
        this.loading = false
        this.cancelDialog()
        this.params.ok(this.form.name)
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
