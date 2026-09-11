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
          :showDelete="formList.length > 1"
          :formItemLayout="formItemLayout"
          :timeRangeParams="timeRangeParams"
          :extraParams="extraParams"
          @nameChange="val => nameChange(val, i)"
          @mertricItemChange="val => mertricItemChange(val, i)"
          @resetChart="() => resetChart(i)"
          @paramsChange="(val, resVal) => paramsChange(val, resVal, i)"
          @remove="() => remove(i)" />
      </div>
      <div v-if="hasChartSlot" class="monitor-query-group__chart">
        <slot name="chart" :index="i" :item="item" />
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
      formList: [{ key: uuid() }],
      form: {
        fc: this.$form.createForm(this),
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      decorators: {
        name: [
          'name',
          {
            rules: [
              { required: true, message: this.$t('monitor.text_7') },
            ],
          },
        ],
      },
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
      this.formList.unshift({ key: uuid() })
      this.$emit('add')
    },
    paramsChange (params, resParams, i) {
      this.$set(this.formList[i], 'model', params)
      this.$set(this.formList[i], 'result_reducer', resParams)
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
    nameChange (name, i) {
      this.$emit('nameChange', name, i)
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
    align-items: stretch; // 左右并排时条件与图表等高
    padding: 12px;
    background: #f5f7fa;
    border: 1px solid #e8ebf0;
    border-radius: 8px;

    &:last-of-type {
      margin-bottom: 12px;
    }
  }

  &__condition {
    // 并排时约 700px；图表换行后单独占满一行
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

      // label 相对「第一行」控件上下居中，而非整块多行内容
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
    // basis 600：剩余不足 600 则换行；grow 很大：并排时吃满剩余宽度
    flex: 10000 1 600px;
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;

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

  &__chart-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    min-height: 240px;
    height: 100%;
    padding: 24px;
    color: rgba(0, 0, 0, 0.45);
    background: #fff;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
  }
}

.monitor-forms__add {
  margin-top: 4px;
}

</style>
