import { NETWORK_OPTIONS_MAP } from '@Compute/constants'
import { IMAGES_TYPE_MAP } from '@/constants/compute'
import { resolveInitPreferZone } from '@Compute/utils/createServer'

/**
 * 裸金属创建：工单回填辅助（非整表草稿）
 */
export function resolveDraftLoginType (initData) {
  const fromExtra = initData?.extraData?.loginType
  if (fromExtra) return fromExtra
  if (initData?.keypair) return 'keypair'
  if (initData && Object.prototype.hasOwnProperty.call(initData, 'reset_password') && !initData.reset_password) {
    return 'image'
  }
  if (initData && Object.prototype.hasOwnProperty.call(initData, 'password') && initData.password) {
    return 'password'
  }
  return 'random'
}

/** 从工单 nets / extraNets 推断网络类型与 bonding */
export function resolveBaremetalNetworkSeed (initData = {}) {
  let initNetworkType = NETWORK_OPTIONS_MAP.default.key
  let initBonding = !!(initData.extraData && initData.extraData.isBonding)
  if (initData.nets) {
    if (initData.nets[0] && initData.nets[0].hasOwnProperty('exit') && !initData.nets[0].exit) {
      if (initData.nets[0].require_teaming) {
        initBonding = true
      }
      initNetworkType = NETWORK_OPTIONS_MAP.default.key
    } else if (initData.nets[0] && initData.nets[0].hasOwnProperty('network') && initData.extraData?.extraNets && initData.extraData?.extraNets[0] && initData.extraData?.extraNets[0].hasOwnProperty('network')) {
      initNetworkType = NETWORK_OPTIONS_MAP.manual.key
      if (initData.nets[0].require_teaming) {
        initBonding = true
      }
    } else if (initData.nets.length) {
      initNetworkType = NETWORK_OPTIONS_MAP.schedtag.key
      if (initData.nets[0].schedtags && initData.nets[0].schedtags.length && initData.nets[0].schedtags[0].require_teaming) {
        initBonding = true
      }
    }
  }
  return { initNetworkType, initBonding }
}

/**
 * 裸金属创建页 data() seed（工单/query 推导，不含 form.fd）
 */
export function resolveBaremetalCreateSeed (initData = {}, { isInitForm = false } = {}) {
  const initPreferZone = resolveInitPreferZone(initData, false)
  const imageTypeInitValue = initData.extraData?.image_type || IMAGES_TYPE_MAP.standard.key
  let initImage = ''
  if (initData.disks) {
    initData.disks.forEach((item) => {
      if (item.image_id) {
        initImage = item.image_id
      }
    })
  }
  if (initData.extraData?.image) {
    initImage = initData.extraData.image
  }
  const initLoginType = isInitForm ? resolveDraftLoginType(initData) : 'random'
  const { initNetworkType, initBonding } = resolveBaremetalNetworkSeed(initData)
  let initSchedPolicyType = 'default'
  if (initData.prefer_host) {
    initSchedPolicyType = 'host'
  }
  const seedSchedtags = initData.schedtags || initData.extraData?.schedtags
  if (seedSchedtags && seedSchedtags.length) {
    initSchedPolicyType = 'schedtag'
  }
  return {
    initPreferZone,
    imageTypeInitValue,
    initImage,
    initLoginType,
    initNetworkType,
    initBonding,
    initSchedPolicyType,
  }
}
