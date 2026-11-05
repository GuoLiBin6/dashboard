<template>
  <a-card :title="title">
    <ve-ring v-bind="ringOption" :height="height" />
  </a-card>
</template>

<script>
export default {
  props: {
    height: {
      type: String,
      default: '400px',
    },
    options: {
      type: Object,
      required: true,
      default: _ => {
        return {
          pieData: [], // eg: [{value: xx, name: xx}]
          title: '',
          total: 0,
        }
      },
    },
  },
  data () {
    return {
      ringOption: {
        title: {
          left: '5%',
          top: '5%',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: '55%',
          bottom: '20%',
          data: [
            this.$t('common_252'),
            this.$t('common_253'),
            this.$t('common_254'),
          ],
        },
        series: [
          {
            name: '',
            type: 'pie',
            center: ['26%', '50%'],
            radius: [
              '40%',
              '55%',
            ],
            avoidLabelOverlap: false,
            labelLine: {
              show: true,
            },
            data: [],
            label: {
              show: true,
              position: 'center',
              formatter: '8',
              textStyle: {
                fontSize: 16,
                color: '#333',
              },
            },
          },
        ],
      },
    }
  },
  computed: {
    title () {
      return this.options.title
    },
    // ve-ring 走 canvas 渲染，吃不到 CSS 变量，暗色下只能由 JS 改 option
    darkMode () {
      return !!(this.$store && this.$store.getters.darkMode)
    },
  },
  watch: {
    options: {
      handler: function (val) {
        this.concatOption(val)
      },
      immediate: true,
    },
    darkMode () {
      this.concatOption(this.options)
    },
  },
  methods: {
    concatOption (opData) {
      const tempOption = JSON.parse(JSON.stringify(this.ringOption))
      // tempOption.title.text = opData.title
      tempOption.legend.data = opData.pieData.map(v => v.name)
      tempOption.series[0].data = opData.pieData
      tempOption.series[0].label.formatter = opData.totalLabel
        ? `${opData.totalLabel}\n${opData.total}`
        : `${opData.total}`
      if (opData.totalLabel) {
        tempOption.series[0].label.textStyle = {
          ...tempOption.series[0].label.textStyle,
          fontSize: 14,
          lineHeight: 20,
        }
      }
      // 暗色：图例与环心文字要提亮，否则 #333 落在深底上等于看不见；
      // tooltip 是 DOM 浮层，同样需要跟着换深底，避免暗色下弹出一块白卡。
      // 亮色分支也要显式给值 —— concatOption 是基于上一次的 ringOption 深拷贝，
      // 只改暗色分支的话，切回亮色时暗色值会残留。
      if (this.darkMode) {
        tempOption.legend.textStyle = { color: 'rgba(255, 255, 255, 0.72)' }
        tempOption.series[0].label.textStyle = {
          ...tempOption.series[0].label.textStyle,
          color: 'rgba(255, 255, 255, 0.88)',
        }
        tempOption.tooltip = {
          ...tempOption.tooltip,
          backgroundColor: 'rgba(38, 41, 49, 0.94)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          textStyle: { color: 'rgba(255, 255, 255, 0.88)' },
        }
      } else {
        tempOption.legend.textStyle = { color: '#333' }
        tempOption.series[0].label.textStyle = {
          ...tempOption.series[0].label.textStyle,
          color: '#333',
        }
        tempOption.tooltip = {
          ...tempOption.tooltip,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#e8e8e8',
          textStyle: { color: '#333' },
        }
      }
      this.ringOption = tempOption
    },
  },
}
</script>

<style lang="less" scoped>
.ant-card {
  & :deep(.ant-card-body) {
    padding: 12px;
  }
}
</style>
