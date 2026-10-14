<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1117')}}</div>
    <div slot="body">
      <a-alert class="mb-2" type="warning">
        <template #message>{{$t('compute.text_1389')}}</template>
      </a-alert>
      <dialog-selected-tips :name="$t('dictionary.server')" :count="params.data.length" :action="$t('compute.text_1117')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('compute.text_1230')" prop="buyDuration">
          <a-radio-group v-model:value="form.buyDuration">
            <a-radio-button
              v-for="i in options.buyDurations"
              :key="i.value"
              :value="i.value">
              {{ i.label }}
            </a-radio-button>
          </a-radio-group>
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
import { BUY_DURATIONS_OPTIONS as buyDurations } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'VmResourceFeeDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        buyDuration: '1M',
      },
      rules: {
        buyDuration: [
          { required: true, message: this.$t('compute.text_1231'), trigger: 'change' },
        ],
      },
      options: {
        buyDurations,
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
    doResourceFeeSubmit () {
      const selectedIds = this.params.data.map(item => item.id)
      return new this.$Manager('servers').batchPerformAction({
        ids: selectedIds,
        action: 'renew',
        data: {
          duration: this.form.buyDuration,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doResourceFeeSubmit()
        this.cancelDialog()
      } catch (error) {
        // validate / submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
