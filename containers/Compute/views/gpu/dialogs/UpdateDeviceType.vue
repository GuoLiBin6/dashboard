<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('gpu.device_type.update') }}</div>
    <div slot="body">
      <a-alert type="warning" class="mb-2">
        <template v-slot:message>
          <div class="messages-list">
            <p>{{ $t('gpu.device_type.message_1') }}</p>
            <p>{{ $t('gpu.device_type.message_2') }}</p>
            <p>{{ $t('gpu.device_type.message_3') }}</p>
          </div>
        </template>
      </a-alert>
      <dialog-selected-tips :name="$t('compute.text_113')" :count="params.data.length" :action="$t('gpu.device_type.update')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form">
        <a-form-model-item :label="$t('gpu.device_type')" prop="type">
          <a-radio-group v-model:value="form.type">
            <a-radio-button v-for="item in gpuTypeList" :key="item.value" :value="item.value">{{ item.label }}</a-radio-button>
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
import { getDeviceGpuType, getGpuTypeSelectOptions, resolveGpuTypeBySharingMode } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'UpdateDeviceTypeDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const curItem = this.params.data[0]
    const sharingMode = this.params.data.some(item => item.sharing_mode === 'HAMI') ? 'HAMI' : curItem?.sharing_mode
    const initialType = resolveGpuTypeBySharingMode(getDeviceGpuType(curItem) || 'HPC', sharingMode)

    return {
      loading: false,
      form: {
        type: initialType,
      },
    }
  },
  computed: {
    gpuTypeList () {
      const sharingMode = this.params.data.some(item => item.sharing_mode === 'HAMI') ? 'HAMI' : this.params.data[0]?.sharing_mode
      return getGpuTypeSelectOptions(sharingMode).map(item => ({
        value: item.key,
        label: item.label,
      }))
    },
  },
  methods: {
    doSubmit () {
      const ids = this.params.data.map((item) => item.id)
      return new this.$Manager('isolated_devices').batchUpdate({
        ids,
        data: {
          gpu_type: this.form.type,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit()
        this.params.refresh()
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
<style lang="scss" scoped>
.messages-list p {
  margin-bottom: 4px;
}
</style>
