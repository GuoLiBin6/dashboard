<script>
import { defineComponent, h, computed, ref } from 'vue'
import dayjs from 'dayjs'
import TimePanel from 'ant-design-vue/es/vc-picker/panels/TimePanel'
import { useProvidePanel } from 'ant-design-vue/es/vc-picker/PanelContext'
import dayjsGenerateConfig from 'ant-design-vue/es/vc-picker/generate/dayjs'

/**
 * 内联时间列（小时/分钟），供 OcDateTimePicker combined 面板右侧使用。
 */
export default defineComponent({
  name: 'OcInlineTimePanel',
  compatConfig: { MODE: 3 },
  props: {
    value: { type: [Object, String, Number, Date], default: null },
    format: { type: String, default: 'HH:mm' },
    hourStep: { type: Number, default: 1 },
    minuteStep: { type: Number, default: 1 },
    secondStep: { type: Number, default: 1 },
    disabledTime: { type: Function, default: undefined },
  },
  emits: ['change'],
  setup (props, { emit }) {
    const operationRef = ref({})
    useProvidePanel({
      hideHeader: computed(() => true),
      open: computed(() => true),
      operationRef,
    })

    const showSecond = computed(() => /ss/.test(props.format || ''))
    const panelValue = computed(() => {
      if (props.value && dayjs.isDayjs(props.value) && props.value.isValid()) return props.value
      const d = dayjs(props.value)
      return d.isValid() ? d : dayjs()
    })
    const disabledUnits = computed(() => {
      if (!props.disabledTime) return {}
      return props.disabledTime(panelValue.value) || {}
    })

    return () => {
      const disabled = disabledUnits.value
      return h('div', { class: 'oc-inline-time-panel ant-picker-panel' }, [
        h(TimePanel, {
          prefixCls: 'ant-picker',
          generateConfig: dayjsGenerateConfig,
          format: props.format,
          value: panelValue.value,
          showHour: true,
          showMinute: true,
          showSecond: showSecond.value,
          use12Hours: false,
          hourStep: props.hourStep,
          minuteStep: props.minuteStep,
          secondStep: props.secondStep,
          operationRef,
          disabledHours: disabled.disabledHours,
          disabledMinutes: disabled.disabledMinutes,
          disabledSeconds: disabled.disabledSeconds,
          disabledTime: null,
          onSelect: (date) => {
            emit('change', date)
          },
        }),
      ])
    }
  },
})
</script>

<style lang="less">
@oc-time-cell-h: 28px;
@oc-time-col-w: 56px;
@oc-time-after-h: 196px;

.oc-inline-time-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border: none;
  overflow: hidden;

  .ant-picker-time-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    border-left: none;
  }

  .ant-picker-content {
    display: flex !important;
    flex: 1 1 auto;
    width: 100%;
    height: 100% !important;
    min-height: 0;
  }

  .ant-picker-time-panel-column {
    box-sizing: border-box;
    flex: 1 1 0;
    width: auto;
    min-width: @oc-time-col-w;
    height: 100% !important;
    max-height: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;
    text-align: left;
    list-style: none;

    &::after {
      display: block;
      height: @oc-time-after-h;
      content: '';
    }

    .ant-picker-time-panel-cell-inner {
      display: block;
      width: calc(100% - 8px);
      height: @oc-time-cell-h;
      margin: 0 4px;
      padding: 0 0 0 12px;
      line-height: @oc-time-cell-h;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}
</style>
