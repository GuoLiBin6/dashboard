<template>
  <div class="top-wrapper">
    <div class="title d-flex justify-content-between mb-2">
      <span class="title-text">{{ topMsg.title }}</span>
      <span class="top-text">Top5</span>
    </div>
    <div class="progress-item" v-for="(item, i) in topList" :key="i">
      <div class="item d-flex justify-content-between align-items-center">
        <span class="label" :title="item.name">{{ item.name }}</span>
        <span class="value">{{ item.value }}</span>
      </div>
      <a-progress :show-info="false" :percent="item.percent" status="normal" size="small" :stroke-width="4" />
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import numerify from 'numerify'
import { sizestr } from '@/utils/utils'

export default {
  name: 'Top5',
  props: {
    // { title: 'wp-test', data: [{ value: 231, name: 'wp1' }, { value: 526, name: 'wp2' }, ...] }
    topMsg: {
      type: Object,
      required: true,
      validator: val => val.title && R.is(Array, val.data),
    },
    topNum: {
      type: Number,
      default: 5,
    },
  },
  computed: {
    topList () {
      let list = [] // e.g. [{ percent: 85, value: 783Mbps, name: 'wp-test' }, xxx]
      const topMsgData = this.topMsg.data.slice(0) // 深拷贝
      const sortList = topMsgData.sort((a, b) => b.value - a.value).slice(0, this.topNum) // 取 top5
      if (!sortList.length) return []
      if (this.topMsg.unit === 'bps' || this.topMsg.unit === 'B') {
        const maxData = sortList[0].value || 1 // 百分比都相对于最大数比较
        list = sortList.map(val => {
          return {
            percent: (val.value / maxData) * 100,
            value: sizestr(val.value, 'B', 1024),
            name: val.name,
          }
        })
      } else {
        list = sortList.map(val => {
          return {
            percent: val.value,
            value: `${numerify(val.value, '0.00')}%`,
            name: val.name,
          }
        })
      }
      return list
    },
  },
}
</script>

<style lang="less" scoped>
.top-wrapper {
  .title {
    font-size: 14px;
    font-weight: 500;
    .title-text {
      color: #333;
    }
    .top-text {
      color: red;
    }
  }
  .progress-item {
    margin-bottom: 8px;
    .item {
      font-size: 12px;
      line-height: 18px;
      margin-bottom: 2px;
    }
    .label {
      flex: 1;
      min-width: 0;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .value {
      flex-shrink: 0;
      margin-left: 8px;
    }
  }
}
</style>
