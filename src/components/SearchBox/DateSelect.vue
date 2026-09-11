<template>
  <div class="date-select">
    <a-radio-group v-model:value="fd.type" size="small" class="date-select-type">
      <a-radio-button v-for="item of typeOptions" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
    </a-radio-group>
    <div
      v-if="fd.type === 'before' || fd.type === 'range'"
      class="date-select-fields">
      <div v-if="fd.type === 'range'" class="date-select-label">{{ $t('common.text00119') }}</div>
      <a-row :gutter="8">
        <a-col :span="12">
          <a-date-picker
            v-model:value="fd.date1"
            class="w-100"
            format="YYYY-MM-DD"
            :allowClear="false"
            :placeholder="$t('common_648')"
            :getPopupContainer="popupContainer"
            :popupStyle="popupStyle"
            @change="onFieldChange"
            @openChange="onOpenChange" />
        </a-col>
        <a-col :span="12">
          <a-time-picker
            v-model:value="fd.time1"
            class="w-100"
            format="HH:mm:ss"
            :allowClear="false"
            :placeholder="$t('compute.text_856')"
            :getPopupContainer="popupContainer"
            :popupStyle="popupStyle"
            @change="onFieldChange"
            @ok="onFieldChange"
            @openChange="onOpenChange" />
        </a-col>
      </a-row>
    </div>
    <div
      v-if="fd.type === 'after' || fd.type === 'range'"
      class="date-select-fields">
      <div v-if="fd.type === 'range'" class="date-select-label">{{ $t('common.text00120') }}</div>
      <a-row :gutter="8">
        <a-col :span="12">
          <a-date-picker
            v-model:value="fd.date2"
            class="w-100"
            format="YYYY-MM-DD"
            :allowClear="false"
            :placeholder="$t('common_648')"
            :getPopupContainer="popupContainer"
            :popupStyle="popupStyle"
            @change="onFieldChange"
            @openChange="onOpenChange" />
        </a-col>
        <a-col :span="12">
          <a-time-picker
            v-model:value="fd.time2"
            class="w-100"
            format="HH:mm:ss"
            :allowClear="false"
            :placeholder="$t('compute.text_856')"
            :getPopupContainer="popupContainer"
            :popupStyle="popupStyle"
            @change="onFieldChange"
            @ok="onFieldChange"
            @openChange="onOpenChange" />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import moment from 'moment'

dayjs.extend(customParseFormat)

function toDayjsDate (val) {
  if (!val) return dayjs()
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  return dayjs(val)
}

function toDayjsTime (val) {
  if (!val) return dayjs('00:00:00', 'HH:mm:ss')
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.format === 'function') {
    return dayjs(val.format('HH:mm:ss'), 'HH:mm:ss')
  }
  if (typeof val === 'string') {
    const part = val.includes(' ') ? val.split(' ')[1] : val
    return dayjs(part.slice(0, 8), 'HH:mm:ss')
  }
  return dayjs(val)
}

export default {
  name: 'DateSelect',
  // 子树内 ant DatePicker 按 Vue3 行为跑，避免 compat 弄丢面板 onSelect
  compatConfig: { MODE: 3 },
  inheritAttrs: false,
  emits: ['change', 'date-editing-change'],
  props: {
    value: Array,
  },
  data () {
    const value = this.value || []
    let initType = 'before'
    if (value && value.length) {
      if (value[0] && value[1]) initType = 'range'
      else if (value[0]) initType = 'before'
      else if (value[1]) initType = 'after'
    }
    return {
      popupStyle: Object.freeze({ zIndex: 4000 }),
      openCount: 0,
      typeOptions: [
        { label: this.$t('common_649'), key: 'before' },
        { label: this.$t('common_650'), key: 'after' },
        { label: this.$t('common_651'), key: 'range' },
      ],
      fd: {
        type: initType,
        date1: toDayjsDate(value[0]),
        time1: value[0] ? toDayjsTime(value[0]) : dayjs('00:00:00', 'HH:mm:ss'),
        date2: toDayjsDate(value[1]),
        time2: value[1] ? toDayjsTime(value[1]) : dayjs('00:00:00', 'HH:mm:ss'),
      },
    }
  },
  watch: {
    'fd.type' () {
      this.emitChange()
    },
  },
  created () {
    this.popupContainer = () => document.body
  },
  mounted () {
    this.emitChange()
  },
  methods: {
    onOpenChange (open) {
      this.openCount = Math.max(0, this.openCount + (open ? 1 : -1))
      this.$emit('date-editing-change', this.openCount > 0)
      if (!open) {
        this.$nextTick(() => this.emitChange())
      }
    },
    onFieldChange () {
      // 时间面板打开期间也同步，否则点选看不到/落不进 fd
      this.emitChange()
    },
    emitChange () {
      const { type, date1, date2, time1, time2 } = this.fd
      if (!date1 || !time1) return
      const d1 = date1.format('YYYY-MM-DD')
      const t1 = time1.format('HH:mm:ss')
      let selectValue = []
      if (type === 'before') {
        selectValue = [[moment(`${d1} ${t1}`).utc(), null]]
      } else if (type === 'after') {
        if (!date2 || !time2) return
        selectValue = [[null, moment(`${date2.format('YYYY-MM-DD')} ${time2.format('HH:mm:ss')}`).utc()]]
      } else if (type === 'range') {
        if (!date2 || !time2) return
        selectValue = [[
          moment(`${d1} ${t1}`).utc(),
          moment(`${date2.format('YYYY-MM-DD')} ${time2.format('HH:mm:ss')}`).utc(),
        ]]
      }
      this.$emit('change', selectValue)
    },
  },
  beforeUnmount () {
    this.$emit('date-editing-change', false)
  },
}
</script>

<style lang="less" scoped>
.date-select {
  padding: 12px 12px 10px;
}
.date-select-type {
  display: flex;
  width: 100%;
  margin-bottom: 12px;
  :deep(.ant-radio-button-wrapper) {
    flex: 1;
    text-align: center;
    font-size: 12px;
    height: 28px;
    line-height: 26px;
    padding: 0 4px;
  }
}
.date-select-fields + .date-select-fields {
  margin-top: 12px;
}
.date-select-label {
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.45);
}
</style>
