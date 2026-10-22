<template>
  <div class="monitor-forms">
    <div
      v-for="(item, i) in formList"
      :key="item.key"
      class="monitor-query-group"
      :class="{ 'monitor-query-group--paired': hasChartSlot }">
      <div class="monitor-query-group__condition">
        <monitor-form
          :panel="panel"
          :query-only="queryOnly"
          :enable-chart-types="enableChartTypes"
          :defaultPanelShow="item.show"
          :showDelete="formList.length > 1"
          :timeRangeParams="timeRangeParams"
          :extraParams="extraParams"
          @nameChange="val => nameChange(val, i)"
          @mertricItemChange="val => mertricItemChange(val, i)"
          @chartTypesChange="val => chartTypesChange(val, i)"
          @resetChart="() => resetChart(i)"
          @paramsChange="(val, resVal) => paramsChange(val, resVal, i)"
          @panelShowChange="val => panelShowChange(val, i)"
          @remove="() => remove(i)" />
      </div>
      <!-- 折叠时仍保留图表列占位，避免左侧查询条件宽度被撑开 -->
      <div
        v-if="hasChartSlot"
        class="monitor-query-group__chart"
        :class="{ 'monitor-query-group__chart--collapsed': item.show === false }">
        <slot v-if="item.show !== false" name="chart" :index="i" :item="item" />
      </div>
    </div>
    <div class="monitor-forms__add d-flex align-items-center" v-if="multiQuery && showAddButton">
      <a-button type="link" class="px-0" @click="add" :disabled="addDisabled">{{ $t('monitor.monitor_add') }}</a-button>
    </div>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import MonitorForm from './form'

export default {
  name: 'MonitorForms',
  components: {
    MonitorForm,
  },
  props: {
    timeRangeParams: {
      type: Object,
      default: () => ({}),
    },
    extraParams: {
      type: Object,
      default: () => ({}),
    },
    panel: {
      type: Object,
      default: () => ({}),
    },
    queryOnly: {
      type: Boolean,
      default: true,
    },
    // 仅监控查询 / 监控面板开启图表形式（折线/热力图）配置
    enableChartTypes: {
      type: Boolean,
      default: false,
    },
    multiQuery: {
      type: Boolean,
      default: true,
    },
    showAddButton: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      formList: [{ key: uuid(), show: true }],
    }
  },
  computed: {
    addDisabled () {
      // 存在未完成填写的查询时不可继续添加
      return this.formList.some(item => !item.model)
    },
    hasChartSlot () {
      return !!this.$slots.chart
    },
  },
  watch: {
    addDisabled: {
      immediate: true,
      handler (val) {
        this.$emit('update:addDisabled', val)
      },
    },
  },
  methods: {
    add () {
      if (this.addDisabled) return
      this.formList.unshift({ key: uuid(), show: true })
      this.$emit('add')
    },
    paramsChange (params, resParams, i) {
      this.formList[i].model = params
      this.formList[i].result_reducer = resParams
      this.$emit('refresh', params, resParams, i)
    },
    remove (idx) {
      this.formList.splice(idx, 1)
      this.$emit('remove', idx)
    },
    resetChart (i) {
      this.$emit('resetChart', i)
    },
    mertricItemChange (val, i) {
      this.$emit('mertricItemChange', val, i)
    },
    chartTypesChange (val, i) {
      this.$emit('chartTypesChange', val, i)
    },
    nameChange (name, i) {
      this.$emit('nameChange', name, i)
    },
    panelShowChange (show, i) {
      this.formList[i].show = show
    },
  },
}
</script>

<style lang="less" scoped>
.monitor-forms {
  width: 100%;
}

.monitor-query-group {
  margin-bottom: 16px;

  &--paired {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: stretch;
    padding: 12px;
    background: #f5f7fa;
    border: 1px solid #e8ebf0;
    border-radius: 8px;

    &:last-of-type {
      margin-bottom: 12px;
    }
  }

  &__condition {
    flex: 1 1 700px;
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;

    :deep(.monitor-form.ant-card) {
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      margin: 0;
      border-color: #e8e8e8;
      box-shadow: none;

      > .ant-card-head {
        flex: 0 0 auto;
      }

      > .ant-card-body {
        flex: 1 1 auto;
        padding: 12px 16px;
      }
    }

    :deep(.monitor-form) {
      .ant-form > .ant-form-item {
        margin-bottom: 16px;
      }

      .ant-form > .ant-form-item:last-child {
        margin-bottom: 0;
      }

      .ant-form > .ant-form-item > .ant-form-item-row {
        align-items: flex-start;
      }

      .ant-form > .ant-form-item > .ant-form-item-row > .ant-form-item-label {
        display: flex;
        align-items: center;
        height: 32px;
        max-height: 32px;
        padding-top: 0;
      }

      .ant-form > .ant-form-item > .ant-form-item-row > .ant-form-item-label > label {
        height: 32px;
        line-height: 32px;
        margin: 0;
      }
    }
  }

  &__chart {
    flex: 10000 1 600px;
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;

    &--collapsed {
      min-height: 0;
      visibility: hidden;
      pointer-events: none;
    }

    > * {
      flex: 1 1 auto;
      width: 100%;
      min-height: 240px;
    }

    :deep(.explorer-monitor-line.ant-card) {
      flex: 1 1 auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      margin: 0;
      border-color: #e8e8e8;
      box-shadow: none;

      > .ant-card-head {
        flex: 0 0 auto;
      }

      > .ant-card-body {
        flex: 1 1 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
    }
  }
}

.monitor-forms__add {
  margin-top: 4px;
}
</style>
