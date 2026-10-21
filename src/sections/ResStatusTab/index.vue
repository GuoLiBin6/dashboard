<template>
  <div class="d-flex flex-row-reverse mb-3 res-status-tab">
    <ul class="res-status-list d-flex">
      <a-tooltip v-for="(obj, idx) in statusOpts" :key="idx" placement="bottom">
        <template #title v-if="obj.list && obj.list.length > 0">
          <div class="status-list">
            <div v-for="(item, idxs) in obj.list" class="status-item" :key="idxs" @click="statusClickHandle(item)">
              <span>{{ item.title }}</span>: <span>{{ item.num }}</span>
            </div>
          </div>
        </template>
        <li
          class="res-status-item"
          :class="obj.class || obj.type"
          @click="statusClickHandle(obj)">
          <i class="res-status-bar" aria-hidden="true" />
          <span :title="obj.title" class="title">{{ obj.title }}</span>
          <data-loading v-if="loading" />
          <span v-if="!loading" class="num">{{ obj.num }}</span>
        </li>
      </a-tooltip>
    </ul>
  </div>
</template>

<script>
import debounce from 'lodash/debounce'

export default {
  name: 'ResStatusTab',
  props: {
    statusOpts: {
      type: Array,
      default () {
        return []
      },
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    statusClickHandle: debounce(function (obj) {
      this.$emit('click', obj)
    }, 500),
  },
}
</script>

<style lang="less" scoped>
.res-status-tab {
  height: 40px;

  .res-status-list {
    list-style: none;
    margin: 0;
    padding: 0;
    align-items: center;
    gap: 12px;

    :deep(> .ant-tooltip),
    :deep(> span) {
      flex: 0 0 auto;
      width: max-content;
    }
  }
}

.res-status-item {
  --accent: #d9d9d9;
  --bar-h: 22px;
  --radius: 6px;
  --dur-bar: 0.28s;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: max-content;
  padding: 2px 12px 2px 12px;
  border-radius: var(--radius);
  box-sizing: border-box;
  cursor: pointer;
  background-color: transparent;
  overflow: hidden;
  transition: background-color 0.15s ease;

  &.total {
    --accent: #409eff;
  }
  &.running,
  &.available,
  &.online,
  &.active,
  &.enabled,
  &.success {
    --accent: #52c41a;
  }
  &.ready,
  &.offline,
  &.disabled,
  &.info {
    --accent: #d9d9d9;
  }
  &.error {
    --accent: #f5222d;
  }
  &.other {
    --accent: rgb(150, 152, 155);
  }

  &:hover {
    background-color: #f5f5f5;

    .res-status-bar {
      top: 0;
      height: 100%;
      transform: none;
      border-radius: var(--radius) 0 0 var(--radius);
    }
  }

  .res-status-bar {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    display: block;
    width: 3px;
    height: var(--bar-h);
    background-color: var(--accent);
    border-radius: 1.5px;
    pointer-events: none;
    transition:
      height var(--dur-bar) var(--ease),
      top var(--dur-bar) var(--ease),
      transform var(--dur-bar) var(--ease),
      border-radius var(--dur-bar) var(--ease);
  }

  .title {
    font-size: 12px;
    line-height: 14px;
    color: #606266;
    white-space: nowrap;
  }

  .num {
    font-size: 15px;
    line-height: 20px;
    color: #181a1d;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.status-list {
  .status-item {
    cursor: pointer;

    &:hover {
      color: var(--ant-color-primary, var(--antd-wave-shadow-color, #1890ff));
    }
  }
}
</style>
