import client from 'webpack-theme-color-replacer/client'
import { generate } from '@ant-design/colors'

export default {
  getAntdSerials (color) {
    // 淡化（即less的tint）
    const lightens = new Array(9).fill().map((t, i) => {
      return client.varyColor.lighten(color, i / 10)
    })
    // colorPalette变换得到颜色值
    const colorPalettes = generate(color)
    const rgb = client.varyColor.toNum3(color.replace('#', '')).join(',')
    return lightens.concat(colorPalettes).concat(rgb)
  },
  changeColor (newColor) {
    var options = {
      newColors: this.getAntdSerials(newColor), // new colors array, one-to-one corresponde with `matchColors`
      changeUrl (cssUrl) {
        // while router is not `hash` mode, it needs absolute path
        // 兜底：避免 cssUrl 为 undefined 时发起 /undefined 请求
        if (!cssUrl) return cssUrl
        // 有些场景下 cssUrl 会变成字符串 "undefined"，会导致请求 /auth/login/undefined 或 /undefined
        if (cssUrl === 'undefined' || cssUrl.includes('/undefined')) return ''
        // 只处理 css 资源，其他情况保持原样，避免拼出奇怪的路径
        if (!/\.css($|\?)/.test(cssUrl)) return cssUrl
        if (cssUrl.startsWith('/') || cssUrl.startsWith('http://') || cssUrl.startsWith('https://')) return cssUrl
        return `/${cssUrl}`
      },
    }
    return client.changer.changeColor(options, Promise)
  },
}
