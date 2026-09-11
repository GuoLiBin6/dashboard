<template>
  <div class="position-relative w-100 dashboard-content-inner" :style="contentWrapStyle">
    <template v-for="(item, key) of data" :key="key">
      <div
        v-if="!['Quota', 'ProjectQuota'].includes(item.layout.component) || (['Quota', 'ProjectQuota'].includes(item.layout.component) && globalConfig.enable_quota_check)"
        class="item"
        :style="getItemStyles(item.layout)">
        <component
          ref="children"
          :chartId="key"
          :is="item.layout.component"
          :options="item.layout"
          :params="item.params"
          :dataRangeParams="dataRangeParams" />
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'
import getExtendsComponents from '@scope/extends'
import { clear as clearCache } from '@Dashboard/utils/cache'

const extendsComponents = R.is(Function, getExtendsComponents) ? getExtendsComponents() : getExtendsComponents
const ROW_HEIGHT = 30
// 卡片网格间距（与编辑态一致，勿改，避免影响内部组件布局）
const MARGIN_Y = 15
const MARGIN_X = 7.5
// 仅外框内容区上下留白
const OUTER_PAD_Y = 10

export default {
  name: 'DashboardContent',
  components: {
    ...extendsComponents,
  },
  props: {
    // 卡片配置
    data: {
      type: [Array, Object],
      required: true,
    },
    dataRangeParams: {
      type: Object,
    },
  },
  computed: {
    ...mapGetters(['globalConfig']),
    // 绝对定位卡片不占文档流，需显式撑高；底部仅加外框留白
    contentWrapStyle () {
      const items = R.is(Array, this.data) ? this.data : Object.values(this.data || {})
      let maxBottom = 0
      items.forEach((item) => {
        const layout = item && item.layout
        if (!layout || layout.y == null || layout.h == null) return
        if (['Quota', 'ProjectQuota'].includes(layout.component) && !this.globalConfig.enable_quota_check) return
        const top = Math.round(ROW_HEIGHT * layout.y) + layout.y * MARGIN_Y + OUTER_PAD_Y
        const height = ROW_HEIGHT * layout.h + Math.max(0, layout.h - 1) * MARGIN_Y
        maxBottom = Math.max(maxBottom, top + height)
      })
      return {
        minHeight: `${maxBottom + OUTER_PAD_Y}px`,
      }
    },
  },
  methods: {
    refresh () {
      clearCache()
      const children = this.$refs.children
      if (R.is(Array, children)) {
        for (let i = 0, len = children.length; i < len; i++) {
          children[i].refresh()
        }
      } else {
        children.refresh()
      }
    },
    setTransform (top, left, width, height) {
      const translate = `translate3d(${left}px, ${top}px, 0)`
      return {
        transform: translate,
        WebkitTransform: translate,
        MozTransform: translate,
        msTransform: translate,
        OTransform: translate,
        width: width + 'px',
        height: height + 'px',
        position: 'absolute',
      }
    },
    getItemStyles (layout) {
      const { x, y, w, h } = layout
      return {
        width: `calc(${w / 80 * 100}% - 15px)`,
        margin: `0px ${MARGIN_X}px`,
        height: `calc(${ROW_HEIGHT * h + Math.max(0, h - 1) * MARGIN_Y}px)`,
        left: `calc(${(x / 80 * 100)}%`,
        // 卡片相对间距仍用 MARGIN_Y=15；仅首行相对外框用 OUTER_PAD_Y
        top: Math.round(ROW_HEIGHT * y) + y * MARGIN_Y + OUTER_PAD_Y + 'px',
        position: 'absolute',
      }
    },
  },
}
</script>

<style lang="less" scoped>
.item {
  border-radius: 5px;
  &:hover{
    box-shadow: 0px 0px 8px 3px #a3a0a02e;
    border: 0 none;
  }
  .dashboard-card-wrap{
    border-radius: 4px;
  }
  border: 1px solid #E7E8EB;
}
</style>
