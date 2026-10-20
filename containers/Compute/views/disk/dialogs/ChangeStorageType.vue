<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.vminstance.change_storage_type')}}</div>
    <div slot="body">
      <div v-if="tips.length > 0">
        <a-alert v-for="(item, index) in tips" :message="tips[index]" :key="index" type="warning" class="mb-1" />
      </div>
      <dialog-selected-tips :count="params.data.length" :action="$t('compute.vminstance.change_storage_type')" :name="$t('dictionary.disk')" />
      <dialog-table :data="params.data" :columns="params.columns.filter(item => ['name', 'disk_size', 'disk_type', 'storage_type', 'billing_type'].includes(item.field))" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item
          :label="$t('compute.text_380')"
          prop="storage_type">
          <base-select
            style="width: 100%"
            v-model:value="form.storage_type"
            :options="storageOptions"
            :select-props="{ placeholder: $t('compute.text_1022', [$t('compute.text_380')]) }">
            <template #optionLabelTemplate="{ item }">
              <div class="d-flex justify-content-between">
                <span>{{ item.label }}</span>
                <span class="oc-selected-display-none">{{ getOptionLimit(item) }}</span>
              </div>
            </template>
          </base-select>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading" :disabled="confirmDisabled">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { STORAGE_TYPES } from '@Compute/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
export default {
  name: 'DiskChangeStorageTypeDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        storage_type: undefined,
      },
      rules: {
        storage_type: [
          { required: true, message: this.$t('compute.text_1022', [this.$t('compute.text_380')]), trigger: 'change' },
        ],
      },
      capabilityData: {},
    }
  },
  computed: {
    tips () {
      return STORAGE_TYPES.aliyun[this.params.data[0].storage_type] && STORAGE_TYPES.aliyun[this.params.data[0].storage_type].getChangeStorageTypeTips ? STORAGE_TYPES.aliyun[this.params.data[0].storage_type].getChangeStorageTypeTips() : []
    },
    storageOptions () {
      // 目前仅支持 阿里云
      let allSupportStorageTypes = STORAGE_TYPES.aliyun[this.params.data[0].storage_type].getChangeStorageTypeList(this.params.data[0])
      // 过滤 capabilityData
      allSupportStorageTypes = allSupportStorageTypes.filter(type => {
        const { storage_types3 } = this.capabilityData
        if (storage_types3 && storage_types3.aliyun && !Object.keys(storage_types3.aliyun).map(item => item.split('/')[0]).includes(type)) return false
        return true
      })
      return allSupportStorageTypes.map(type => {
        return {
          ...STORAGE_TYPES.aliyun[type],
          id: type,
        }
      })
    },
  },
  created () {
    this.fetchCapability()
  },
  methods: {
    getOptionLimit (item) {
      const { disk_type } = this.params.data[0]
      if (disk_type === 'data') {
        return this.$t('compute.text_137', [item.min, item.max])
      }
      if (disk_type === 'sys') {
        return this.$t('compute.text_137', [item.sysMin, item.sysMax])
      }
      return ''
    },
    async fetchCapability () {
      const params = {
        show_emulated: true,
      }
      if (this.$store.getters.isAdminMode) {
        params.project_domain = this.params.data[0].domain_id
      }
      const { data } = await new this.$Manager('zones').get({ id: `${this.params.data[0].zone_id}/capability`, params })
      this.capabilityData = data
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          managerArgs: {
            action: 'change-storage-type',
            data: this.form,
          },
        })
        this.params.refresh()
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
