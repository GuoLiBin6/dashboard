<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="instanceLabel" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { parseLlmRoute } from '@Ai/utils/llmRouteContext'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'LlmBatchConfirmDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      ...(() => {
        const ctx = parseLlmRoute(this.$route.path)
        return { isApplyType: ctx.isApplyType, isDesktopType: ctx.isDesktopType }
      })(),
      loading: false,
      action: this.params.actionText,
      sync_image: false,
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    instanceLabel () {
      if (this.isDesktopType) return this.$t('aice.desktop_llm')
      if (this.isApplyType) return this.$t('aice.app_llm')
      return this.$t('aice.llm')
    },
    columns () {
      const showFields = ['name', 'llm_ip', 'status', 'llm_sku']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
  },
  methods: {
    async doShutDownSubmit () {
      const data = {}
      if (this.sync_image) {
        data.sync_image = true
      }
      const ids = this.params.data.map(item => item.id)
      return this.params.onManager('batchPerformAction', {
        id: ids,
        steadyStatus: this.params.steadyStatus,
        managerArgs: {
          action: this.params.action,
          data,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.doShutDownSubmit()
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
