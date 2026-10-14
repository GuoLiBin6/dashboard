<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_632')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="$t('network.text_632')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_633')" v-bind="formItemLayout" prop="name">
          <a-input v-model:value="form.name" :placeholer="$t('network.text_634')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_635')" v-bind="formItemLayout" prop="split_ip">
          <a-input v-model:value="form.split_ip" :placeholer="$t('network.text_636')" />
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
  name: 'NetworkSplitDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
        split_ip: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_637') },
        ],
        split_ip: [
          { required: true, message: this.$t('network.text_638') },
          { validator: this.$validate('IPv4') },
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
    doSplit (data) {
      return this.params.onManager('performAction', {
        id: this.params.data[0].id,
        managerArgs: {
          action: 'split',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (values.split_ip === this.params.data[0].guest_ip_start || values.split_ip === this.params.data[0].guest_ip_end) {
          this.$message.error(this.$t('network.text_639'))
          return
        }
        this.loading = true
        await this.doSplit(values)
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
