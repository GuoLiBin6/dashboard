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
      if (this.text) {
        return this.text
      }
      return this.$t(`help.${this.name}`)
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
