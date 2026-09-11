<template>
  <div class="d-flex">
    <monitor-header
      v-model:time="time"
      :showTimegroup="false"
      :showGroupFunc="false"
      :loading="loading"
      :timeOpts="timeOpts"
      @refresh="refresh">
      <template v-slot:radio-button-append>
        <custom-date v-model:time="time" v-model:customTime="customTime" />
      </template>
    </monitor-header>
    <a-select v-model:value="aggregate" style="width: 150px;">
      <a-select-option v-for="item in aggregateOpts" :value="item.key" :key="item.key">{{ item.label }}</a-select-option>
    </a-select>
  </div>
</template>

<script>
import MonitorHeader from '@/sections/Monitor/Header'
import CustomDate from '@/sections/CustomDate'
import { timeOpts } from '@/constants/monitor'

export default {
  name: 'LblistenerDashboardMonitorControl',
  components: {
    MonitorHeader,
    CustomDate,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      time: '1h',
      customTime: null,
      aggregate: 'mean',
      timeOpts,
      aggregateOpts: [
        { key: 'mean', label: this.$t('network.text_498') },
        { key: 'max', label: this.$t('network.text_499') },
        { key: 'min', label: this.$t('network.text_500') },
      ],
    }
  },
  watch: {
    time (v) {
      this.emitValue()
    },
    customTime () {
      this.emitValue()
    },
    aggregate () {
      this.emitValue()
    },
  },
  methods: {
    refresh () {
      this.$emit('refresh')
    },
    emitValue () {
      const value = {
        time: {
          from: `now-${this.time}`,
        },
        aggregate: this.aggregate,
      }
      if (this.customTime) {
        value.time = this.customTime
      }
      this.$emit('input', value)
    },
  },
}
</script>

<style>

</style>
