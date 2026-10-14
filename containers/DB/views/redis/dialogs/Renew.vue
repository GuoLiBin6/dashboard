<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :name="params.name" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('db.text_54')" prop="duration">
          <a-radio-group v-model:value="form.duration">
              <a-radio-button
                :key="item.value"
                :value="item.value"
                v-for="item in BUY_DURATIONS_OPTIONS">
                {{item.label}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button :loading="loading" @click="handleConfirm" type="primary">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { CreateServerForm } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { BUY_DURATIONS_OPTIONS } from '../constants/index.js'
export default {
  name: 'RedisRenewDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const duration = (this.params.data && this.params.data.length > 0) ? (this.params.data[0].duration || '1M') : '1M'
    return {
      BUY_DURATIONS_OPTIONS,
      loading: false,
      form: {
        duration,
      },
      rules: {
        duration: [
          { required: true, message: this.$t('db.text_148') },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: CreateServerForm.wrapperCol },
        labelCol: { span: CreateServerForm.labelCol },
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: 'running',
          managerArgs: {
            data: values,
            action: 'renew',
          },
        })
        this.loading = false
        this.$message.success(this.$t('db.text_149'))
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
