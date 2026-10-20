<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1054')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('compute.text_1051')" :extra="$t('compute.text_1055')" prop="cpu_core_count">
          <a-input-number :min="1" v-model:value="form.cpu_core_count" /> {{$t('compute.text_167')}}
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1052')" :extra="$t('compute.text_1056')" prop="memory_size_mb">
          <a-input-number :min="0.5" v-model:value="form.memory_size_mb" /> GB
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.system_disk_max')" prop="sys_disk_max_size_gb">
          <a-input-number :min="0" v-model:value="form.sys_disk_max_size_gb" /> GB
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
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
  name: 'CreateSkuDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cpu_core_count: 4,
        memory_size_mb: 16,
        sys_disk_max_size_gb: 2048,
        description: undefined,
      },
    }
  },
  methods: {
    doCreate (data) {
      return this.params.onManager('create', {
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
          memory_size_mb: this.form.memory_size_mb * 1024,
        }
        await this.doCreate(values)
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
