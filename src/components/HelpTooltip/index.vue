<template>
  <a-tooltip placement="right">
    <template v-slot:title>
      <div v-html="content" class="help-tooltip-content-wrap" />
    </template>
    <span class="oc-tooltip-trigger">
      <icon type="question" />
    </span>
  </a-tooltip>
</template>

<script>
import { sanitizeHtml } from '@/utils/sanitizeHtml'

export default {
  name: 'HelpTooltip',
  props: {
    text: {
      type: String,
    },
    name: {
      type: String,
    },
  },
  computed: {
    content () {
      // text 可能来自服务端错误消息（如 SSH/RDP 登录错误回显），需消毒后渲染
      if (this.text) {
        return sanitizeHtml(this.text)
      }
      return sanitizeHtml(this.$t(`help.${this.name}`))
    },
  },
}
</script>

<style lang="less">
.help-tooltip-content-wrap {
  > h4 {
    color: #fff;
    font-size: 14px;
  }
  > p {
    font-size: 12px;
  }
}
.oc-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
</style>
