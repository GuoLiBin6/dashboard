<template>
  <div>
    <a-popover trigger="click" v-model:open="visible" @openChange="handleVisibleChange">
      <div
        class="trigger d-flex align-items-center justify-content-center"
        :title="notifyMenuTitleUsedText ? undefined : $t('navbar.button.system_messages')"
        @mousedown.prevent>
        <span v-if="notifyMenuTitleUsedText">{{$t('navbar.button.system_messages')}}</span>
        <!-- 使用自定义 Icon 替代已移除的 a-icon mail -->
        <icon v-else type="navbar-notify" style="font-size: 20px;" />
      </div>
      <template v-slot:content>
        <div class="notify-wrap">
          <div class="notify-header d-flex align-items-center">
            <div class="flex-fill title">{{$t('navbar.button.system_messages')}}</div>
            <a v-if="showMore && $appConfig.isPrivate" @click="toMore">{{$t('common.more')}}</a>
          </div>
          <div class="loading" v-if="loading">
            <loading-block :layout="loadingLayout" />
          </div>
          <template v-else>
            <div class="no-data" v-if="noData">{{$t('common.notData')}}</div>
            <ul class="notify-list" v-else>
              <li
                v-for="item of data"
                :key="item.id"
                class="notify-item">
                <div class="item-header d-flex">
                  <div class="item-header-type">{{$t('navbar.tips.service_message')}}</div>
                  <div class="item-header-time flex-fill text-right">{{ $moment(item.created_at).format() }}</div>
                </div>
                <div class="item-content mt-2">{{ item.title }}</div>
              </li>
            </ul>
          </template>
        </div>
      </template>
    </a-popover>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'NotifyPopover',
  props: {
    notifyMenuTitleUsedText: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      visible: false,
      loading: false,
      loadingLayout: [[16, 8], [15], [16, 8], [12], [16, 8], [20], [16, 8], [14]],
      data: [],
      total: 0,
    }
  },
  computed: {
    ...mapGetters(['scope']),
    noData () {
      return this.data.length <= 0
    },
    showMore () {
      return this.total > 8
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('notifications', 'v1')
  },
  methods: {
    async fetchNotify () {
      this.loading = true
      const params = {
        limit: 8,
        contact_type: 'webconsole',
        scope: this.scope,
      }
      try {
        const { data: { data = [], total = 0 } } = await this.manager.list({
          params,
        })
        this.data = data
        this.total = total
      } finally {
        this.loading = false
      }
    },
    handleVisibleChange (val) {
      if (val) {
        this.fetchNotify()
      }
      // Popover 打开后会再次聚焦触发器，延迟 blur 清掉 antd focus-visible 蓝框
      const blurActive = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
      this.$nextTick(blurActive)
      setTimeout(blurActive, 50)
    },
    toMore () {
      this.$router.push('/notification')
      this.visible = false
    },
  },
}
</script>

<style lang="less" scoped>
.trigger {
  height: 100%;
  // padding: 0 20px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;

  &:focus,
  &:focus-visible,
  &:focus-within,
  &:active {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  :deep(*),
  :deep(*:focus),
  :deep(*:focus-visible) {
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
  }

  &:hover {
    :deep(.ant-badge) {
      color: inherit !important;
    }
    :deep(.ant-badge-count),
    :deep(.ant-scroll-number) {
      color: #fff !important;
    }
    :deep(.oc-icon) {
      color: inherit !important;
      fill: currentColor !important;
    }
  }

  :deep(.oc-icon) {
    color: inherit;
  }
}
.notify-wrap {
  width: 350px;
}
.notify-header {
  margin: 0;
  color: #606266;
  font-size: 14px;
  padding: 10px 10px;
  border-bottom: 1px solid #f5f5f5;
}
.loading {
  padding: 15px;
}
.no-data {
  padding: 15px;
  text-align: center;
  color: #999;
}
.notify-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
  .notify-item {
    padding: 10px;
    & + .notify-item {
      border-top: 1px solid whitesmoke;
    }
  }
  .item-header {
    color: #999;
  }
  .item-content {
    word-break: break-all;
  }
}
</style>
