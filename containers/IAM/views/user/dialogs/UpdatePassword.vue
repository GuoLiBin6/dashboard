<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_276')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.user')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('system.text_221')" prop="password">
          <a-input-password :placeholder="$t('system.text_239')" v-model:value="form.password" />
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
  name: 'UserUpdatePasswordDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      minPasswordLen: null,
      form: {
        password: '',
      },
      rules: {
        password: [
          { required: true, message: this.$t('system.text_486'), trigger: 'blur' },
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
    async handleConfirm () {
      this.loading = true
      const { data, onManager } = this.params
      try {
        await this.$refs.formRef.validate()
        onManager('patch', {
          id: data[0].id,
          managerArgs: {
            data: {
              ...this.form,
              skip_password_complexity_check: true,
            },
          },
        })
        this.$message.success(this.$t('common.success'))
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
