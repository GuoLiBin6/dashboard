<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{ $t('monitor.adjust_chart_order') }}</template>
    <template #body>
      <dialog-selected-tips :name="$t('monitor.dashboard.title')" :count="params.data.length" :action="$t('monitor.adjust_chart_order')" />
      <dialog-table :data="params.data" :columns="params.columns" />
      <!-- 不用 vuedraggable：@vue/compat 下 #item 插槽偶发无参数导致整段不渲染；排序改用 Sortable 绑定本容器 -->
      <div ref="panelsSortableRoot">
        <div
          v-for="(element, index) in panels"
          :key="element.panel_id"
          class="panel-item d-flex">
          <div class="label">{{ index + 1 }}. {{ element.panel_name }}</div>
          <icon type="dragable" class="drag-icon pr-3" @click.prevent="() => {}" />
        </div>
      </div>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import Sortable from 'sortablejs'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'MonitorDashboardAdjustOrderDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      panels: [...(this.params.dashboard.alert_panel_details || [])],
    }
  },
  mounted () {
    this.initPanelsSortable()
  },
  beforeUnmount () {
    this.destroyPanelsSortable()
  },
  methods: {
    initPanelsSortable () {
      this.destroyPanelsSortable()
      this.$nextTick(() => {
        const el = this.$refs.panelsSortableRoot
        if (!el || !this.panels.length) return
        this._panelsSortable = Sortable.create(el, {
          handle: '.drag-icon',
          animation: 150,
          ghostClass: 'chosen',
          onEnd: (evt) => {
            const { oldIndex, newIndex } = evt
            if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
            if (oldIndex < 0 || newIndex < 0 || oldIndex >= this.panels.length || newIndex >= this.panels.length) return
            const [moved] = this.panels.splice(oldIndex, 1)
            this.panels.splice(newIndex, 0, moved)
          },
        })
      })
    },
    destroyPanelsSortable () {
      if (this._panelsSortable) {
        this._panelsSortable.destroy()
        this._panelsSortable = null
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await new this.$Manager('alertdashboards', 'v1').performAction({
          id: this.params.data[0].id,
          action: 'set-panel-order',
          data: {
            order: this.panels.map((item, index) => {
              return {
                panel_id: item.panel_id,
                index: index + 1,
              }
            }),
          },
        })
        this.params.ok(this.panels)
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>

<style lang="less" scoped>
.panel-item {
  padding: 10px 5px;
  .label {
    flex: 1 1 auto;
  }
  .drag-icon {
    flex: 0 0 32px;
    font-size: 20px;
    line-height: 32px;
    text-align: center;
    cursor: move;
    color: rgba(0, 0, 0, 0.65);
  }
  &:hover {
    background: #e8eaec;
  }
}
.chosen {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
