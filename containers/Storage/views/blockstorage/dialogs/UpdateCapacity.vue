<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="this.params.title" :name="$t('dictionary.blockstorage')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
       <a-form-model-item :label="$t('storage.text_59')" prop="capacity">
          <a-input style="width: 150px" name="capacity" v-model:value="form.capacity" @blur="handelBlur">
            <span slot="addonAfter">
              GB
            </span>
          </a-input>
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
import { formItemLayout } from '@Storage/constants/index.js'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'BlockStorageUpdateCapacityDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { data = [] } = this.params
    const initCapacity = data.length > 0 ? Math.round(parseFloat(data[0].capacity / 1024)) : 0
    return {
      loading: false,
      formItemLayout,
      form: {
        capacity: initCapacity,
      },
      initCapacity,
    }
  },
  methods: {
    handelBlur ({ target }) {
      const { value } = target
      if (!/^\d+$/.test(value)) {
        this.form.capacity = this.initCapacity
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { capacity } = this.form
        const manager = new this.$Manager('storages', 'v2')
        await manager.update({
          id: this.params.data[0].id,
          data: {
            capacity: parseFloat(capacity) * 1024,
          },
        })
        this.cancelDialog()
        this.params.refresh()
        this.loading = false
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
