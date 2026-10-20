<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ action }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.disk')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" hideRequiredMark>
        <a-form-model-item :label="$t('compute.text_99')" prop="storage">
          <list-select
            v-model:value="form.storage"
            :list-props="resourceProps"
            :formatter="v => { return formatterVal(v) }"
            :multiple="false"
            :placeholder="$t('compute.text_1351')"
            :dialog-params="{ title: $t('compute.text_99'), width: 1060 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.keep_origin_disk')" prop="keep_origin_disk">
          <a-switch v-model:checked="form.keep_origin_disk" :checkedChildren="$t('compute.text_115')" :unCheckedChildren="$t('compute.text_116')" />
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
import { STORAGE_TYPES } from '@Storage/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import ListSelect from '@/sections/ListSelect'
import StorageResourcePropsMixin from '../mixins/storageResourceProps'
export default {
  name: 'DiskChangeBlockStorageDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin, StorageResourcePropsMixin],
  data () {
    return {
      loading: false,
      form: {
        storage: this.params.data[0].storage_id,
        keep_origin_disk: false,
      },
      rules: {
        storage: [
          { required: false, message: this.$t('compute.text_1351'), trigger: 'change' },
        ],
      },
      action: this.$t('compute.vminstance.change_disk_storage'),
    }
  },
  computed: {
    selectedItems () {
      return this.params.data || []
    },
    isSingle () {
      return this.selectedItems?.length === 1
    },
    selectedItemsStorageIds () {
      return this.selectedItems.map(item => item.storage_id)
    },
    selectedItemsDiskIds () {
      return this.selectedItems.map(item => item.id)
    },
    selectedItemsGuestIds () {
      const guestIds = []
      this.selectedItems.forEach(item => {
        if (item.guests) {
          item.guests.forEach(v => {
            guestIds.push(v.id)
          })
        }
      })
      return guestIds
    },
    columns () {
      const showFields = ['name', 'storage_type', 'guest']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    formatterVal (v) {
      if (v) {
        return `${STORAGE_TYPES[v.storage_type] || v.storage_type}(${v.name})`
      }
    },
    doSingleHandle () {
      const data = {
        target_storage_id: this.form.storage,
        disk_id: this.selectedItemsDiskIds[0],
        keep_origin_disk: !this.form.keep_origin_disk,
      }
      return new this.$Manager('servers').performAction({
        id: this.selectedItemsGuestIds[0],
        action: 'change-disk-storage',
        data,
      })
    },
    doBatchHandle (ids) {
      const data = {
        target_storage_id: this.form.storage,
        disk_id: this.selectedItemsDiskIds[0],
      }
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: ['running', 'ready'],
        managerArgs: {
          action: 'change-disk-storage',
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const ids = this.params.data.map(item => item.id)
        if (this.isSingle) {
          await this.doSingleHandle()
        } else {
          await this.doBatchHandle(ids)
        }
        this.$message.success(this.$t('common.success'))
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
<style>
</style>
