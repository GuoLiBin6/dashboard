<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('cloudenv.read_only')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudaccount')" :count="params.data.length" :action="$t('cloudenv.read_only')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.read_only')" :extra="$t('cloudenv.read_only_extra')">
          <a-switch
            v-model:checked="form.read_only"
            :checkedChildren="$t('cloudenv.text_84')"
            :unCheckedChildren="$t('cloudenv.text_85')" />
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
  name: 'CloudaccountSetReadOnlyDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const data = this.params.data[0]
    return {
      loading: false,
      form: {
        read_only: !!data.read_only,
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const values = { ...this.form }
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
