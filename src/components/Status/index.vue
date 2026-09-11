<template>
  <div class="status-wrapper">
    <div class="d-flex align-items-center status-inner-row" :title="statusText">
      <div class="status-icon d-flex justify-content-center align-items-center flex-grow-0 flex-shrink-0">
        <icon v-if="!statusClass" type="sync" spin />
        <span v-else class="status-dot" :class="statusClass" />
      </div>
      <div class="status-text text-truncate flex-fill status-text-flex">
        {{ statusText }}
        <slot name="icon" />
        <span v-if="showProcess && !changedStatus">({{curProcess}}%)</span>
      </div>
      <div v-if="!isBooleanValue" class="status-copy-host flex-shrink-0">
        <copy :message="String(status)" />
      </div>
    </div>
    <div v-if="changedStatus && showProcess" style="width:100px;margin-left:5px">
      <a-progress class="custom-progress-bar" :percent="curProcess" :showInfo="false" size="small" status="active" :title="originStatusText + ': ' + curProcess + '%'" />
    </div>
    <slot />
  </div>
</template>

<script>
import * as R from 'ramda'
import expectStatusMap from '@/constants/expectStatus'
import { status as statusMap } from '@/locales/zh-CN'

export default {
  name: 'Status',
  props: {
    status: {
      type: [String, Boolean],
      required: true,
    },
    statusModule: { // 映射 expectStatusMap 里面的 key 值
      type: String,
      required: true,
    },
    dangerStatusBase: {
      type: Array,
      default: () => [new RegExp('fail')],
    },
    // 指定状态
    specifyStatus: {
      type: Object,
      default: () => {
        return {
          class: '',
          text: '',
        }
      },
    },
    process: {
      type: Number,
    },
    showStatusProgress: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      scopeStatusMap: this.$te('scopeStatus') ? this.$t('scopeStatus') : {},
    }
  },
  computed: {
    isBooleanValue () {
      return R.is(Boolean, this.status)
    },
    changedStatus () {
      if (this.statusModule === 'server' && this.status === 'block_stream') {
        return this.status
      }
      return ''
    },
    statusClass () {
      if (this.specifyStatus.class) return this.specifyStatus.class
      const currentStatusMap = expectStatusMap[this.statusModule]
      if (currentStatusMap) {
        if (this.isStatus(currentStatusMap.success) || this.isStatus(expectStatusMap.common.success)) {
          return ['status-success']
        }
        const dangerStatus = this.dangerStatusBase.concat(currentStatusMap.danger || [])
        if (this.isStatus(dangerStatus) || this.isStatus(expectStatusMap.common.danger)) {
          return ['status-danger']
        }
        if (this.isStatus(currentStatusMap.info) || this.isStatus(expectStatusMap.common.info)) {
          return ['status-info']
        }
        if (this.isStatus(currentStatusMap.warning)) {
          return ['status-warning']
        }
      }
      return ''
    },
    statusText () {
      if (this.specifyStatus.text) return this.specifyStatus.text
      const moduleStatusMap = this.scopeStatusMap[this.statusModule] || statusMap[this.statusModule]
      if (moduleStatusMap) {
        if (moduleStatusMap[this.changedStatus || this.status]) {
          return this.$te(`scopeStatus.${this.statusModule}.${this.changedStatus || this.status}`) ? this.$t(`scopeStatus.${this.statusModule}.${this.changedStatus || this.status}`) : this.$t(`status.${this.statusModule}.${this.changedStatus || this.status}`)
        }
      }
      if (statusMap.common[this.changedStatus || this.status]) {
        return this.$t(`status.common.${this.changedStatus || this.status}`)
      }
      return this.changedStatus || this.status
    },
    originStatusText () {
      if (!this.changedStatus) return ''
      if (this.specifyStatus.text) return this.specifyStatus.text
      const moduleStatusMap = statusMap[this.statusModule]
      if (moduleStatusMap) {
        if (moduleStatusMap[this.status]) {
          return this.$te(`scopeStatus.${this.statusModule}.${this.status}`) ? this.$t(`scopeStatus.${this.statusModule}.${this.status}`) : this.$t(`status.${this.statusModule}.${this.status}`)
        }
      }
      if (statusMap.common[this.status]) {
        return this.$t(`status.common.${this.status}`)
      }
      return this.status
    },
    curProcess () {
      return Math.ceil(+this.process * 100) / 100
    },
    showProcess () {
      if (!['server', 'image'].includes(this.statusModule)) return false
      if (!['block_stream', 'migrating', 'image_caching', 'saving', 'live_migrating', 'save_disk'].includes(this.status)) return false
      if (this.statusModule === 'server' && !this.showStatusProgress) return false
      return this.curProcess > 0 && this.curProcess < 100
    },
  },
  methods: {
    // 判断是否为预期状态
    isStatus (statusList) {
      if (R.is(Array, statusList)) {
        return statusList.some(status => {
          if (R.is(RegExp, status)) return status.test(this.changedStatus || this.status)
          if (R.is(String, status) || R.is(Boolean, status)) return status === (this.changedStatus || this.status)
          return false
        })
      }
      return false
    },
  },
}
</script>

<style scoped lang="less">
@import '../../styles/less/theme';

.status-wrapper {
  width: 100%;
  overflow: visible;
  position: relative;
  z-index: 0;
  .status-icon {
    width: 20px;
    .status-success.status-dot {
      background-color: @success-color;
      // &::after {
      //   position: absolute;
      //   top: 0;
      //   left: 0;
      //   width: 100%;
      //   height: 100%;
      //   border: 1px solid #1890ff;
      //   border-radius: 50%;
      //   animation: antStatusProcessing 1.2s ease-in-out infinite;
      //   content: "";
      // }
    }
    .status-danger.status-dot {
      background-color: @error-color;
    }
    .status-info.status-dot {
      background-color: @normal-color;
    }
    .status-warning.status-dot {
      background-color: @warning-color;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      position: relative;
    }
    .oc-status-process {
      width: 10px;
      height: 10px;
    }
  }
  .status-inner-row {
    width: 100%;
    min-width: 0;
  }
  .status-text-flex {
    min-width: 0;
  }
  .status-copy-host {
    margin-left: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    transition: opacity 0.12s ease;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .status-wrapper:hover .status-copy-host {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  .status-copy-host :deep(svg),
  .status-copy-host :deep(.copy-trigger) {
    cursor: pointer;
  }
}

</style>
