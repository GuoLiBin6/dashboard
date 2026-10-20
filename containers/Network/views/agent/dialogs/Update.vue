<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_74')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.eip')" :count="params.data.length" :action="$t('network.text_74')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-model-item :label="$t('network.text_75')" prop="hb_timeout">
          <a-input-number v-model:value="form.hb_timeout" :min="600" :max="3600" :addonAfter="$t('network.text_76')" />
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
  name: 'AgentUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        hb_timeout: this.params.data[0].hb_timeout,
      },
      rules: {
        hb_timeout: [
          { type: 'integer', min: 600, max: 3600, message: this.$t('network.text_77'), trigger: 'blur' },
        ],
      },
    }
  },
  methods: {
    doUpdate (data) {
      return this.params.onManager('update', {
        id: data.id,
        managerArgs: {
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          ...this.form,
          hb_timeout: Number(this.form.hb_timeout),
          id: this.params.data[0].id,
        }
        await this.doUpdate(values)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
