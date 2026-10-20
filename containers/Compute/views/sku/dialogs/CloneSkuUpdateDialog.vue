<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_983')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.sku')" :count="params.data.length" :action="$t('compute.text_983')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form">
        <a-form-model-item :label="$t('compute.text_1051')" prop="cpu_core_count">
          <a-input-number :min="1" v-model:value="form.cpu_core_count" />{{$t('compute.text_167')}}
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1052')" prop="memory_size_mb">
          <a-input-number :min="1" v-model:value="form.memory_size_mb" /> GB
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
  name: 'CloneSkuUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cpu_core_count: this.params.data[0].cpu_core_count,
        memory_size_mb: this.params.data[0].memory_size_mb / 1024,
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
          brand: this.params.data[0].brand,
        }
        await this.doCreate(values)
        this.cancelDialog()
      } catch (error) {
        // validate / create failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
