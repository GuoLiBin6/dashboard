<template>
  <div style="width:120px;height:120px" ref="liquidFill" />
</template>

<script>
import echarts from 'echarts'
import 'echarts-liquidfill'

// 水球图波峰由深到浅的四层配色（与亮色默认调色板同色相，暗色下整体提亮以适应暗底）
const LIGHT_COLORS = ['#294D99', '#156ACF', '#1598ED', '#45BDFF']
const DARK_COLORS = ['#2A5FA8', '#2C7BD0', '#35A0E8', '#63C4FA']
// 亮色外圈描边 / 暗色外圈描边
const LIGHT_BORDER = '#156ACF'
const DARK_BORDER = 'rgba(120, 170, 240, 0.35)'
// 暗色下水球内底色（默认是 #E3F7FF 浅蓝，暗色面板上会发白）
const DARK_BG = 'rgba(255, 255, 255, 0.04)'
// 数值字号：liquidFill 默认 50 在 120px 的球里过大
const LABEL_FONT_SIZE = 20

export default {
  name: 'LiquidFill',
  props: {
    value: Number,
    // 允许业务传入自定义配色，未传时按明暗模式取默认色板
    colors: {
      type: Array,
      default: null,
    },
  },
  data () {
    return {
      chart: '',
    }
  },
  computed: {
    dark () {
      return !!(this.$store && this.$store.getters.darkMode)
    },
    liquidColors () {
      if (this.colors && this.colors.length) return this.colors
      return this.dark ? DARK_COLORS : LIGHT_COLORS
    },
    borderColor () {
      return this.dark ? DARK_BORDER : LIGHT_BORDER
    },
    dataList () {
      let dataList = []
      if (this.value >= 1) {
        dataList = [this.value, 0.9, 0.8]
      } else if (this.value >= 0.8) {
        dataList = [this.value, this.value - 0.15, this.value - 0.3, this.value - 0.45]
      } else if (this.value >= 0.6) {
        dataList = [this.value, this.value - 0.1, this.value - 0.2, this.value - 0.3]
      } else if (this.value >= 0.4) {
        dataList = [this.value, this.value - 0.1, this.value - 0.2]
      } else if (this.value >= 0.2) {
        dataList = [this.value, this.value - 0.2]
      } else {
        dataList = [this.value]
      }
      return dataList
    },
  },
  watch: {
    dataList: {
      handler: function (val) {
        this.initChart()
      },
    },
    // 明暗切换：canvas 不会自己重绘，重建一次
    liquidColors () {
      this.initChart()
    },
  },
  mounted () {
    this.initChart()
  },
  beforeUnmount () {
    if (this.chart) {
      this.chart.dispose()
      this.chart = ''
    }
  },
  methods: {
    initChart () {
      setTimeout(() => {
        if (this.chart) {
          this.chart.dispose()
          this.chart = ''
        }
        if (!this.$refs.liquidFill) return
        this.chart = echarts.init(this.$refs.liquidFill)
        // 暗色下水球内底色默认是浅蓝，会点亮整个圆；改成透明淡底 + 淡蓝描边
        const darkBackground = this.dark
          ? { color: DARK_BG, borderWidth: 2, borderColor: this.borderColor }
          : {}
        this.chart.setOption({
          series: [{
            type: 'liquidFill',
            // 配色必须挂在 series 上，挂在顶层会被 liquidFill 的默认色板覆盖
            color: this.liquidColors,
            data: this.dataList,
            radius: '90%',
            outline: {
              show: false,
            },
            backgroundStyle: darkBackground,
            label: {
              // 字号必须写在 label 上，写进 label.textStyle 无效（会退回库默认 50）
              fontSize: LABEL_FONT_SIZE,
              // 只改暗色字色：水面外默认深蓝、水面内默认白
              ...(this.dark
                ? { color: 'rgba(255, 255, 255, 0.65)', insideColor: '#fff' }
                : {}),
              formatter: (row) => {
                const value = parseFloat(row.value)
                if (value > 0 && value < 0.01) {
                  return '< 1%'
                }
                if (value > 0.99 && value < 1) {
                  return '> 99%'
                }
              },
            },
          }],
        })
      }, 50)
    },
  },
}
</script>
