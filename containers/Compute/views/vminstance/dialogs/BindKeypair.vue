<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_361')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_361')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_1182')" v-bind="formItemLayout" prop="keypair">
          <base-select
            v-model:value="form.keypair"
            resource="keypairs"
            :select-props="{ allowClear: true, placeholder: $t('compute.text_1183') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_494')" v-bind="formItemLayout" :extra="$t('compute.text_1184')" prop="auto_start">
          <a-switch v-model:checked="form.auto_start" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" :disabled="isSomeRunning" />
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
  name: 'VmBindKeypairDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const autoStart = this.params.data.some(val => val.status === 'running')
    return {
      loading: false,
      form: {
        keypair: undefined,
        auto_start: autoStart,
      },
      rules: {
        keypair: [
          { required: true, message: this.$t('compute.text_203'), trigger: 'blur' },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 21 },
        labelCol: { span: 3 },
      },
    }
  },
  computed: {
    isSomeRunning () {
      return this.params.data.some(val => val.status === 'running')
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        await this.params.onManager('batchPerformAction', {
          id: ids,
          steadyStatus: ['running', 'ready'],
          managerArgs: {
            action: 'deploy',
            data: {
              keypair: this.form.keypair,
              auto_start: this.form.auto_start,
            },
          },
        })
        this.$bus.$emit('VMInstanceListSingleUpdate', [this.params.data[0].id])
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
