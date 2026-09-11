import { h } from 'vue'
import { mapState } from 'vuex'
import Icon from '@/components/Icon'
import { typeClouds } from '@/utils/common/hypervisor'
import setting from '@/config/setting'

// 延迟取 brandMap，避免循环依赖下模块初始化阶段访问 typeClouds 触发 TDZ
let brandMap
function getBrandMap () {
  if (!brandMap) brandMap = typeClouds.getBrand()
  return brandMap
}

export default {
  name: 'BrandIcon',
  props: {
    name: {
      type: String,
      required: true,
    },
    customStyle: {
      type: Object,
      default () {
        return {}
      },
    },
  },
  computed: {
    ...mapState('app', {
      companyInfo: state => state.companyInfo,
    }),
    cloudPodsIcon () {
      const { inner_logo_format, inner_logo } = this.companyInfo
      if (this.name === 'Cloudpods' && inner_logo_format && inner_logo) {
        return `data:${inner_logo_format};base64,${inner_logo}`
      }
      return ''
    },
  },
  methods: {
    getBrand () {
      const ret = getBrandMap()[this.name]
      if (this.name === 'Cloudpods') {
        const { inner_copyright, inner_copyright_en } = this.companyInfo
        if (setting.language === 'en' && inner_copyright_en) {
          ret.label = inner_copyright_en
        }
        if (setting.language === 'zh-CN' && inner_copyright) {
          ret.label = inner_copyright
        }
      }
      return ret
    },
  },
  render () {
    const option = this.getBrand()
    if (!option) return null
    const name = option.key.toLowerCase()
    const small = ['DStack', 'OpenStack']
    let fontSize = '20px'
    if (small.includes(this.name)) {
      fontSize = '16px'
    }
    if (name === 'extdb') {
      option.label = this.$t('dictionary.extdb')
    }
    if (name === 'uis') {
      fontSize = '28px'
    }
    const cloudPodsIcon = this.cloudPodsIcon

    const content = cloudPodsIcon
      ? h('img', {
        src: cloudPodsIcon,
        style: {
          width: fontSize,
          ...this.customStyle,
        },
      })
      : h(Icon, {
        type: name,
        // 平台品牌图标需保留 SVG 原色，不能走 currentColor 单色化
        preserveColor: true,
        style: {
          fontSize,
          ...this.customStyle,
        },
      })

    return h(
      'span',
      {
        title: option.label,
        class: 'brand-icon',
      },
      [content],
    )
  },
}
