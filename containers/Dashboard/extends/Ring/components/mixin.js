import { getChartColors } from '@/constants'

export default {
  props: {
    options: {
      type: Object,
      required: true,
    },
    params: Object,
    visible: {
      type: Boolean,
      default: false,
    },
    type: String,
  },
  computed: {
    // 明暗两套色板索引一致，环图配色随模式切换，语义不变
    chartColors () {
      return getChartColors(this.$store && this.$store.getters.darkMode)
    },
    ringColors () {
      const colors = this.chartColors
      return [
        {
          key: 'blue',
          percent60: colors[0],
          percent80: colors[0],
          percent100: colors[0],
          label: this.$t('dashboard.color.scheme.blue'),
        },
        {
          key: 'default',
          percent60: colors[3],
          percent80: colors[1],
          percent100: colors[2],
          label: this.$t('dashboard.color.scheme.default'),
        },
        {
          key: 'reverse',
          percent60: colors[2],
          percent80: colors[1],
          percent100: colors[3],
          label: this.$t('dashboard.color.scheme.reverse'),
        },
      ]
    },
  },
  methods: {
    setDefaultName (usage) {
      const usageKey = this.type === 'k8s' ? 'k8s_usage' : 'usage'
      const touched = this.nameTouched || this.form?.fi?.nameTouched
      if (!touched && this.form?.fd) {
        this.form.fd.name = this.$t(usageKey)[usage]
      }
    },
  },
}
