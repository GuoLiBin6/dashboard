<template>
  <e-chart
    v-if="(rows && rows.length) || (options.dataset && options.dataset.length)"
    :style="chartStyles"
    :options="chartOptions"
    @chartInstance="v => $emit('chartInstance', v)"
    autoresize />
  <data-empty v-else />
</template>

<script>
import * as R from 'ramda'
import mixin from './mixin'
import { colors } from './constants'

export default {
  name: 'LineChart',
  mixins: [mixin],
  props: {
    columns: {
      type: Array,
      default: () => ([]),
    },
    rows: {
      type: Array,
      default: () => ([]),
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    chartData () {
      const { series: s, xAxis = {}, legend = {} } = this.options
      if (s && xAxis.data && legend.data) {
        return {
          series: s,
          xAxisData: xAxis.data,
          legendData: legend.data,
        }
      }
      const mapIndexed = R.addIndex(R.map)
      const series = []
      const [x, ...legendData] = this.columns
      mapIndexed((item, index) => {
        series.push(this.genSerie(item, colors[index]))
      }, legendData)
      const xAxisData = []
      R.forEach(row => {
        xAxisData.push(row[x])
        mapIndexed((legend, legendIndex) => {
          series[legendIndex].data.push(row[legend])
        }, legendData)
      }, this.rows)
      return { series, xAxisData, legendData }
    },
    darkMode () {
      return !!(this.$store && this.$store.getters.darkMode)
    },
    chartOptions () {
      // canvas 图表读不到 CSS 变量，暗色下按主题给一套配色
      const dark = this.darkMode
      const tooltipBg = dark ? 'rgba(38, 41, 49, 0.94)' : 'rgba(255,255,255,1)'
      const tooltipText = dark ? 'rgba(255, 255, 255, 0.88)' : '#7588E4'
      const axisPointerColor = dark ? 'rgba(255, 255, 255, 0.2)' : '#ddd'
      const splitLineColor = dark ? 'rgba(255, 255, 255, 0.12)' : '#D4DFF5'
      const axisLineColor = dark ? 'rgba(255, 255, 255, 0.18)' : '#999'
      const axisLabelColor = dark ? 'rgba(255, 255, 255, 0.66)' : undefined
      const options = {
        grid: {
          left: 10,
          top: 50,
          right: 10,
          bottom: 0,
          containLabel: true,
        },
        legend: {
          right: 5,
          type: 'scroll',
          data: this.chartData.legendData,
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            lineStyle: {
              color: axisPointerColor,
            },
          },
          backgroundColor: tooltipBg,
          padding: [5, 10],
          textStyle: {
            color: tooltipText,
          },
          extraCssText: 'box-shadow: 0 0 5px rgba(0,0,0,0.3)',
        },
        xAxis: {
          type: 'category',
          data: this.chartData.xAxisData,
          splitLine: {
            show: true,
            interval: 'auto',
            lineStyle: {
              color: [splitLineColor],
            },
          },
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
            },
          },
          axisLabel: {
            color: axisLabelColor,
            showMaxLabel: false,
            margin: 10,
            align: 'left',
            textStyle: {
              fontSize: 12,
            },
          },
        },
        yAxis: {
          type: 'value',
          splitLine: {
            lineStyle: {
              color: [splitLineColor],
            },
          },
          axisTick: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor,
            },
          },
          axisLabel: {
            color: axisLabelColor,
            margin: 10,
            textStyle: {
              fontSize: 12,
            },
          },
        },
        series: this.chartData.series,
      }
      const ret = this.mergeOptions(options, this.options)
      return ret
    },
  },
  methods: {
    genSerie (name, color) {
      return {
        name,
        type: 'line',
        // smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        data: [],
        itemStyle: {
          normal: {
            color,
          },
        },
        lineStyle: {
          normal: {
            width: 1,
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, .12)',
            shadowOffsetX: 4,
            shadowOffsetY: 4,
          },
        },
      }
    },
  },
}
</script>
