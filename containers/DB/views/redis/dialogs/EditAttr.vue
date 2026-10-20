<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('db.text_290')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="params.title" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        class="mt-3"
        :model="form">
        <a-form-model-item :label="$t('common.text00076')" prop="disable_delete">
          <a-radio-group v-model:value="form.disable_delete">
            <a-radio :value="true">{{$t('db.text_146')}}</a-radio>
            <a-radio :value="false">{{$t('db.text_147')}}</a-radio>
          </a-radio-group>
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

export default {
  name: 'RedisEditAttrDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { data } = this.params
    let initialValueDisableDelete = true
    if (data && data.length === 1) {
      initialValueDisableDelete = data[0].disable_delete
    }
    return {
      loading: false,
      form: {
        disable_delete: initialValueDisableDelete,
      },
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        const ids = this.params.data.map(({ id }) => id)
        await this.params.onManager('batchUpdate', {
          id: ids,
          steadyStatus: 'running',
          managerArgs: {
            data: {
              disable_delete: this.form.disable_delete,
            },
          },
        })
        this.cancelDialog()
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
