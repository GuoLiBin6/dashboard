<template>
  <div class="date-select">
    <a-radio-group v-model:value="fd.type" size="small" class="date-select-type">
      <a-radio-button v-for="item of typeOptions" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
    </a-radio-group>
    <div
      v-if="fd.type === 'before' || fd.type === 'range'"
      class="date-select-fields">
      <div v-if="fd.type === 'range'" class="date-select-label">{{ $t('common.text00119') }}</div>
      <a-date-picker
        v-model:value="fd.date1"
        class="w-100"
        picker="month"
        format="YYYY-MM"
        :allowClear="false"
        :placeholder="$t('common_648')"
        :getPopupContainer="popupContainer"
        :popupStyle="popupStyle"
        @change="onFieldChange"
        @openChange="onOpenChange" />
    </div>
    <div
      v-if="fd.type === 'after' || fd.type === 'range'"
      class="date-select-fields">
      <div v-if="fd.type === 'range'" class="date-select-label">{{ $t('common.text00120') }}</div>
      <a-date-picker
        v-model:value="fd.date2"
        class="w-100"
        picker="month"
        format="YYYY-MM"
        :allowClear="false"
        :placeholder="$t('common_648')"
        :getPopupContainer="popupContainer"
        :popupStyle="popupStyle"
        @change="onFieldChange"
        @openChange="onOpenChange" />
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import moment from 'moment'

function toDayjsMonth (val) {
  if (!val) return dayjs()
  if (dayjs.isDayjs(val)) return val
  if (val && typeof val.toDate === 'function') return dayjs(val.toDate())
  return dayjs(val)
}

export default {
  name: 'MonthSelect',
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
        date1: toDayjsMonth(value[0]),
        date2: toDayjsMonth(value[1]),
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
      if (this.openCount > 0) return
      this.emitChange()
    },
    emitChange () {
      const { type, date1, date2 } = this.fd
      if (!date1) return
      let selectValue = []
      if (type === 'before') {
        selectValue = [[moment(date1.format('YYYY-MM'), 'YYYY-MM').startOf('month').utc(), null]]
      } else if (type === 'after') {
        if (!date2) return
        selectValue = [[null, moment(date2.format('YYYY-MM'), 'YYYY-MM').startOf('month').utc()]]
      } else if (type === 'range') {
        if (!date2) return
        selectValue = [[
          moment(date1.format('YYYY-MM'), 'YYYY-MM').startOf('month').utc(),
          moment(date2.format('YYYY-MM'), 'YYYY-MM').startOf('month').utc(),
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
