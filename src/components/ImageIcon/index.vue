<template>
  <i :style="iconStyle" class="image-icon" />
</template>

<script>
import i18n from '@/locales'
import { IMAGE_MSG, CUSTOME_IMG } from './constants'
import sprites from './assets/sprites.png'
import unknow from './assets/unkonw.png'
import opensuse from './assets/suse.png'
import fedora from './assets/fedora.png'
import openeuler from './assets/openeuler.png'
import euleros from './assets/euleros.png'
import amazon from './assets/amazon.png'
import aliyun from './assets/aliyun.png'
import tencent from './assets/tencent.png'
import kylin from './assets/kylin.png'
import nfs from './assets/nfs.png'
import uos from './assets/uos.svg'
import android from './assets/android.png'
import vmware from './assets/vmware.png'
import cirros from './assets/cirros.png'
import neokylin from './assets/neokylin.png'
import rocky from './assets/rocky.png'
import anolis from './assets/anolis.png'
import opencloudos from './assets/opencloudos.png'
import almalinux from './assets/almalinux.png'

export default {
  name: 'ImageIcon',
  props: {
    image: {
      type: String,
      required: true,
      validator: val => {
        if (!val) return true
        const key = String(val).split(' ')[0].toLowerCase()
        if (Object.keys(IMAGE_MSG).includes(key) || Object.keys(CUSTOME_IMG).includes(key)) {
          return true
        }
        // 与 imageInfo 一致：esxi / vcenter 走 vmware 图标，不告警
        if (key.indexOf('esxi') > -1 || key.indexOf('vcenter') > -1) {
          return true
        }
        if (key !== 'other' && key !== 'all') {
          console.warn(i18n.t('common_16', [val]))
        }
        return true
      },
    },
  },
  data () {
    return {
      sprites,
    }
  },
  computed: {
    imageInfo () {
      const tps = this.image.split(' ')
      const image = tps[0].toLowerCase()
      if (IMAGE_MSG[image]) {
        return {
          ...IMAGE_MSG[image],
          isUnknow: false,
        }
      } else if (CUSTOME_IMG[image]) {
        return {
          ...CUSTOME_IMG[image],
          isUnknow: false,
        }
      } else if (image.indexOf('esxi') > -1 || image.indexOf('vcenter') > -1) {
        return {
          label: tps,
          url: 'vmware',
        }
      } else {
        return {
          label: this.$t('common_17'),
          position: '0px 0px',
          isUnknow: true,
        }
      }
    },
    iconStyle () {
      const { isUnknow, url } = this.imageInfo
      const style = {
        width: '16px',
        height: '16px',
        display: 'inline-block',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `url("${isUnknow ? unknow : sprites}")`,
        backgroundPosition: this.imageInfo.position,
      }
      if (url) {
        let curImg = opensuse
        switch (url) {
          case 'opensuse':
            curImg = opensuse
            break
          case 'suse':
            curImg = opensuse
            break
          case 'fedora':
            curImg = fedora
            break
          case 'openeuler':
            curImg = openeuler
            break
          case 'euleros':
            curImg = euleros
            break
          case 'amazon':
            curImg = amazon
            break
          case 'aliyun':
            curImg = aliyun
            break
          case 'tencent':
            curImg = tencent
            break
          case 'kylin':
            curImg = kylin
            break
          case 'nfs':
            curImg = nfs
            break
          case 'uos':
            curImg = uos
            break
          case 'android':
            curImg = android
            break
          case 'vmware':
            curImg = vmware
            break
          case 'cirros':
            curImg = cirros
            break
          case 'neokylin':
            curImg = neokylin
            break
          case 'rocky':
            curImg = rocky
            break
          case 'anolis':
            curImg = anolis
            break
          case 'opencloudos':
            curImg = opencloudos
            break
          case 'almalinux':
            curImg = almalinux
            break
          case 'openkylin':
            curImg = kylin
            break
          case 'uosdesktop':
            curImg = uos
            break
          case 'tencentos':
            curImg = tencent
            break
          default:
            break
        }
        style.backgroundImage = `url("${curImg}")`
      }
      return style
    },
  },
}
</script>
