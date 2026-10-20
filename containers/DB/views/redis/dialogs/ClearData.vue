<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('db.text_392')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="this.params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" class="mt-3">
        <a-form-model-item v-if="params.data[0].provider === 'Qcloud' && params.data[0].auth_mode === 'on'" :label="$t('db.text_195')" prop="password">
          <a-input-password v-model:value="form.password" :plcaeholder="$t('db.text_360')" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { passwordValidator } from '@/utils/validate'

export default {
  name: 'RedisClearDataDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      form: {
        password: undefined,
      },
      loading: false,
    }
  },
  computed: {
    rules () {
      if (this.params.data[0].provider === 'Qcloud' && this.params.data[0].auth_mode === 'on') {
        return {
          password: [
            { required: true, message: this.$t('db.text_360') },
            { validator: passwordValidator },
          ],
        }
      }
      return {}
    },
    needPassword () {
      return this.params.data[0].provider === 'Qcloud' && this.params.data[0].auth_mode === 'on' && this.params.data.length === 1
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        if (this.needPassword) {
          await this.$refs.formRef.validate()
        }
        const values = { ...this.form }
        if (this.params.data && this.params.data.length > 1) {
          await this.params.onManager('batchPerformAction', {
            id: this.params.data.map(({ id }) => id),
            steadyStatus: 'running',
            managerArgs: {
              action: 'flush-instance',
            },
          })
        } else {
          await this.params.onManager('performAction', {
            id: this.params.data[0].id,
            steadyStatus: 'running',
            managerArgs: {
              action: 'flush-instance',
              data: values,
            },
          })
        }
        this.cancelDialog()
        this.params.refresh()
        this.$message.success(this.$t('db.text_149'))
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
