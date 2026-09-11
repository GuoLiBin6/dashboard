<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ $t('dialog.cancel') }}</template>
    <template #body>
      <dialog-selected-tips :name="$t('table.title.task')" :count="params.data.length" :action="$t('dialog.cancel')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'TaskCancelDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
    }
  },
  methods: {
    doCancel () {
      return new this.$Manager(this.params.resource).batchPerformAction({
        ids: this.params.data.map(item => item.id),
        action: 'cancel',
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doCancel()
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
