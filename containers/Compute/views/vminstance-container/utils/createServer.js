import * as R from 'ramda'
import _ from 'lodash'
import ipaddr from 'ipaddr.js'
import {
  NETWORK_OPTIONS_MAP,
  SERVER_TYPE,
  EIP_TYPES_MAP,
  EIP_CHARGE_TYPES_MAP,
  BILL_TYPES_MAP,
  SCHED_POLICY_OPTIONS_MAP,
  STORAGE_AUTO,
  SECGROUP_OPTIONS_MAP,
  FORECAST_FILTERS_MAP,
  RESOURCE_TYPES_MAP,
} from '@Compute/constants'
import { IMAGES_TYPE_MAP, HOST_CPU_ARCHS } from '@/constants/compute'
import { HYPERVISORS_MAP } from '@/constants'
import store from '@/store'
import i18n from '@/locales'
import { removeHttp } from '@/utils/url'
import { diskSupportTypeMedium, getOriginDiskKey } from '@/utils/common/hypervisor'

export function getIpv6Start (ipv6) {
  try {
    const IPv6 = ipaddr.IPv6.parse(ipv6)
    return IPv6.toNormalizedString().split(':').slice(0, 4).join(':') + ':'
  } catch (err) {
    console.error('IPv6 address is error')
    return ''
  }
}

/**
 * 根据表单拼装创建参数
 *
 * @export
 * @class GenCreateData
 */
export class GenCreateData {
  // eslint-disable-next-line
  constructor(fd, fi) {
    if (R.isNil(fd)) return
    this.fd = fd
    this.fi = fi
    this.createType = this.fi.createType
    this.isIDC = this.createType === SERVER_TYPE.idc
    this.isPrepaid = this.fd.resourceType === RESOURCE_TYPES_MAP.prepaid.key
  }

  /**
   * 拼装磁盘数据
   *
   * @param { Object } item       // 磁盘数据
   * @param { String } type       // 磁盘类型 sys | data
   * @param { Number } index      // 序号
   * @returns { Object }
   * @memberof GenCreateData
   */
  genDisk (item, type, index) {
    const ret = {
      disk_type: type,
      index,
      backend: item.type === STORAGE_AUTO.key ? '' : item.type,
      size: item.size * 1024,
      format: 'raw',
      fs: 'ext4',
    }
    if (type === 'sys' && this.fd.imageType === IMAGES_TYPE_MAP.iso.key && this.isWindows()) {
      ret.driver = 'ide'
    }
    if (item.medium) {
      ret.medium = item.medium
    }
    if (item.schedtags) {
      ret.schedtags = item.schedtags
    }
    if (item.filetype) {
      ret.fs = item.filetype
      if (item.filetype !== 'swap') {
        ret.mountpoint = item.mountpoint
      }
    }
    if (item.storage_id) {
      ret.storage_id = item.storage_id
    }
    if (item.iops) {
      ret.iops = item.iops
    }
    if (item.throughput) {
      ret.throughput = item.throughput
    }
    if (item.preallocation) {
      ret.preallocation = item.preallocation
    }
    // 磁盘区分介质
    if (diskSupportTypeMedium(this.fd.hypervisor)) {
      ret.backend = getOriginDiskKey(ret.backend)
    }
    return ret
  }

  isWindows () {
    let isWindows = false
    const osType = (_.get(this.fi, 'imageMsg.info.properties.os_type') || '').toLowerCase()
    const os = (_.get(this.fd, 'os') || '').toLowerCase()
    if (~[osType, os].indexOf('windows')) {
      isWindows = true
    }
    return isWindows
  }

  _getDataDiskType (dataDiskTypes) {
    if (!R.isNil(dataDiskTypes) && !R.isEmpty(dataDiskTypes)) {
      const firstKey = Object.keys(dataDiskTypes)[0]
      if (firstKey && dataDiskTypes[firstKey]) {
        return dataDiskTypes[firstKey].key
      }
    }
  }

  _genDisksArr () {
    const dataDiskType = this._getDataDiskType(this.fd.dataDiskTypes)
    const dataDisk = []

    R.forEachObjIndexed((value, key) => {
      const diskObj = {
        size: value,
        type: dataDiskType,
      }
      if (this.fd.dataDiskFiletypes && this.fd.dataDiskFiletypes[key]) {
        diskObj.filetype = this.fd.dataDiskFiletypes[key]
      }
      if (this.fd.dataDiskMountPaths && this.fd.dataDiskMountPaths[key]) {
        diskObj.mountpoint = this.fd.dataDiskMountPaths[key]
      }
      if (this.fd.dataDiskSnapshots && this.fd.dataDiskSnapshots[key]) {
        diskObj.snapshot_id = this.fd.dataDiskSnapshots[key]
      }
      if (this.fd.dataDiskSchedtags && this.fd.dataDiskSchedtags[key]) {
        diskObj.schedtags = [
          { id: this.fd.dataDiskSchedtags[key] },
        ]
        if (this.fd.dataDiskPolicys && this.fd.dataDiskPolicys[key]) {
          diskObj.schedtags[0].strategy = this.fd.dataDiskPolicys[key]
        }
      }
      if (this.fd.dataDiskStorages && this.fd.dataDiskStorages[key]) {
        // if system disk specifies storage, the data disks should do the same
        diskObj.storage_id = this.fd.dataDiskStorages[key] || this.fd.systemDiskStorage
      }
      if (this.fd.dataDiskIops && this.fd.dataDiskIops[key]) {
        diskObj.iops = this.fd.dataDiskIops[key]
      }
      if (this.fd.dataDiskThroughputs && this.fd.dataDiskThroughputs[key]) {
        diskObj.throughput = this.fd.dataDiskThroughputs[key]
      }
      if (this.fi.dataDiskMedium) {
        diskObj.medium = this.fi.dataDiskMedium
      }
      if (this.fd.dataDiskPreallocation && this.fd.dataDiskPreallocation[key]) {
        diskObj.preallocation = this.fd.dataDiskPreallocation[key]
      }
      dataDisk.push(diskObj)
    }, this.fd.dataDiskSizes)
    const disks = { data: dataDisk }
    return disks
  }

  /**
   * 组装所有磁盘数据，数据盘
   *
   * @returns { Array }
   * @memberof GenCreateData
   */
  genDisks () {
    const disks = this._genDisksArr()
    if (this.isPublic && this.isPrepaid) {
      return this.fd.spec.disks
    }
    const ret = []
    for (let i = 0, len = disks.data.length; i < len; i++) {
      ret.push(this.genDisk(disks.data[i], 'data', i + 1))
    }
    return ret
  }

  /**
   * 组装所有网络数据
   *
   * @returns { Array }
   * @memberof GenCreateData
   */
  getPortMappingsByNetworkKey (netKey) {
    const port_mappings = []
    const ports = this.fd.networkContainerPorts && this.fd.networkContainerPorts[netKey]
    if (!ports) return port_mappings
    const hostPorts = (this.fd.networkHostPorts && this.fd.networkHostPorts[netKey]) || {}
    const protocols = (this.fd.networkPortProtocols && this.fd.networkPortProtocols[netKey]) || {}
    for (const k in ports) {
      const port = ports[k]
      if (port == null || port === '') continue
      const pm = {
        port,
        protocol: (protocols[k] || 'tcp').toLowerCase(),
      }
      if (hostPorts[k] != null && hostPorts[k] !== '') {
        pm.host_port = hostPorts[k]
      }
      port_mappings.push(pm)
    }
    return port_mappings
  }

  getPortMappings () {
    const port_mappings = []
    const portsByNet = this.fd.networkContainerPorts || {}
    Object.keys(portsByNet).forEach((netKey) => {
      port_mappings.push(...this.getPortMappingsByNetworkKey(netKey))
    })
    if (!port_mappings.length && this.fd.containerPorts) {
      for (const k in this.fd.containerPorts) {
        const port = this.fd.containerPorts[k]
        if (port == null || port === '') continue
        const pm = {
          port,
          protocol: ((this.fd.portProtocols && this.fd.portProtocols[k]) || 'tcp').toLowerCase(),
        }
        if (this.fd.hostPorts && this.fd.hostPorts[k] != null && this.fd.hostPorts[k] !== '') {
          pm.host_port = this.fd.hostPorts[k]
        }
        port_mappings.push(pm)
      }
    }
    return port_mappings
  }

  genNetworks () {
    let ret = [{ exit: false }]
    const legacyPortMappings = this.getPortMappings()
    // 指定 IP 子网
    if (this.fd.networkType === NETWORK_OPTIONS_MAP.manual.key) {
      ret = []
      R.forEachObjIndexed((value, key) => {
        const obj = {
          network: value,
        }
        if (this.fd.networkIps) {
          const address = this.fd.networkIps[key]
          if (address) {
            obj.address = address
          }
        }
        if (this.fd.networkMacs) {
          const mac = this.fd.networkMacs[key]
          if (mac) {
            obj.mac = mac
          }
        }
        if (this.fd.networkExits) {
          const exit = this.fd.networkExits[key]
          if (exit) {
            obj.exit = true
          }
        }
        if (this.fd.networkIPv6s) {
          const ipv6 = this.fd.networkIPv6s[key]
          if (ipv6) {
            obj.require_ipv6 = true
          }
        }
        const target = this.fi.networkList.filter(item => item.key === key)
        if (this.fd.networkIpsAddress6 && this.fd.networkIpsAddress6[key]) {
          const ipv6Last = this.fd.networkIpsAddress6[key]
          const ipv6First = getIpv6Start(target[0]?.network?.guest_ip6_start)
          obj.address6 = ipv6First + ipv6Last
        }
        if (obj.require_ipv6) {
          if (this.fd.networkIPv6Modes && this.fd.networkIPv6Modes[key] === 'only') {
            obj.strict_ipv6 = true
          }
        }
        if (!target[0]?.network?.guest_ip_start && !target[0]?.network?.guest_ip_end && target[0]?.network?.guest_ip6_start) {
          obj.strict_ipv6 = true
        }
        if (this.fd.networkDevices) {
          const device = this.fd.networkDevices[key]
          if (device) {
            obj.sriov_device = { model: device }
          }
        }
        const portMappings = this.getPortMappingsByNetworkKey(key)
        if (portMappings.length > 0) {
          obj.port_mappings = portMappings
        }
        ret.push(obj)
      }, this.fd.networks)
    } else if (this.fd.networkType === NETWORK_OPTIONS_MAP.schedtag.key) {
      // 指定 调度标签
      ret = []
      R.forEachObjIndexed((value, key) => {
        const obj = {
          id: value,
        }
        const strategy = this.fd.networkPolicys[key]
        if (strategy) {
          obj.strategy = strategy
        }
        if (this.fd.networkDevices) {
          const device = this.fd.networkDevices[key]
          if (device) {
            obj.sriov_device = { model: device }
          }
        }
        ret.push({
          schedtags: [obj],
        })
      }, this.fd.networkSchedtags)
    } else if (legacyPortMappings.length > 0) {
      // 自动调度：默认 nets 也要带上端口映射，否则草稿丢失
      ret[0].port_mappings = legacyPortMappings
    }
    return ret
  }

  /**
   * 获取配置的PCI数据
   *
   * @returns { Array }
   * @memberof GenCreateData
   */
  genPciDevices () {
    const ret = []
    const { pciCount, pciModel, memory_request, pciDevType, pciGpuType } = this.fd
    const pciKeys = Object.keys(this.fd.pciCount)
    pciKeys.forEach(key => {
      const pciKey = pciDevType?.[key] || this.fd[`pciDevType[${key}]`] || ''
      const idx = pciKey.indexOf('/')
      const devType = idx === -1 ? pciKey : pciKey.slice(0, idx)
      const sharingMode = idx === -1 ? '' : pciKey.slice(idx + 1)
      const gpuType = pciGpuType?.[key] || this.fd[`pciGpuType[${key}]`]
      for (let i = 0, len = pciCount[key]; i < len; i++) {
        const regexp = /vendor=(.+):(.+)/
        const matched = pciModel[key].match(regexp)
        const model = matched[2]
        const vendor = matched[1]
        const device = {
          model,
          vendor,
        }
        if (devType) {
          device.dev_type = devType
        }
        if (sharingMode) {
          device.sharing_mode = sharingMode
        }
        if (devType === 'GPU' && gpuType) {
          device.gpu_type = gpuType
        }
        if (memory_request?.[key]) {
          device.memory_request = memory_request[key]
        }
        ret.push(device)
      }
    })
    return ret
  }

  /**
   * 获取调度策略所提交的 key 与 value
   *
   * @returns
   * @memberof GenCreateData
   */
  getSchedPolicyValueKey () {
    const ret = {}
    // 调度策略选择为 指定宿主机
    if (this.fd.schedPolicyType === SCHED_POLICY_OPTIONS_MAP.host.key) {
      if (this.isPublic) {
        ret.key = 'prefer_manager'
      } else {
        ret.key = 'prefer_host'
      }
      ret.value = this.fd.schedPolicyHost
    } else if (this.showPreferManager()) { // 如果是通过云账号过滤镜像
      ret.key = 'prefer_manager'
      ret.value = this.fd.prefer_manager
    }

    // 调度策略选择为 调度标签
    if (this.fd.schedPolicyType === SCHED_POLICY_OPTIONS_MAP.schedtag.key) {
      ret.key = 'schedtags'
      ret.value = []
      R.forEachObjIndexed((value, key) => {
        const item = { id: value }
        if (this.fd.policySchedtagPolicys[key]) {
          item.strategy = this.fd.policySchedtagPolicys[key]
        }
        ret.value.push(item)
      }, this.fd.policySchedtagSchedtags)
    }
    return ret
  }

  /**
   * 获取平台
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  getHypervisor () {
    return HYPERVISORS_MAP.pod.key
  }

  /**
   * 是否是通过云账号过滤后选择的镜像
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  showPreferManager () {
    const imageMsg = IMAGES_TYPE_MAP[this.fd.imageType]
    return imageMsg && imageMsg.enable_cloudaccount
  }

  /**
   * 获取Region
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  getPreferRegion () {
    if (this.isPublic && !this.isPrepaid) {
      return this.fd.sku.cloudregion_id
    }
    return this.fd.cloudregion.key
  }

  /**
   * 获取Zone
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  getPreferZone () {
    let ret = ''
    if (R.is(Object, this.fd.zone)) {
      ret = this.fd.zone.key
    }
    if (R.is(String, this.fd.zone)) { // 字符串形式是公有云 AreaSelect 的 zone
      ret = this.fd.zone
    }
    return ret
  }

  /**
   * 获取CPU核数
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  getCpuCount () {
    let ret = this.fd.vcpu
    if (this.isPublic && this.isPrepaid) {
      ret = this.fd.spec.vcpu_count
    }
    return ret
  }

  /**
   * 获取CPU插槽数
   * @returns
   */
  getCpuSockets () {
    return this.fi.cpuSockets
  }

  /**
   * 获取内存
   *
   * @returns { String }
   * @memberof GenCreateData
   */
  getMemSize () {
    let ret = this.fd.vmem
    if (this.isPublic && this.isPrepaid) {
      ret = this.fd.spec.vmem_size * 1024
    }
    return ret
  }

  getPreferManagerId () {
    let prefer_manager_id = ''
    const hypervisor = this.getHypervisor()
    const privateHypervisors = [HYPERVISORS_MAP.hcso.key, HYPERVISORS_MAP.hcs.key]
    if (this.isPublic || privateHypervisors.includes(hypervisor)) {
      prefer_manager_id = this.fd.cloudprovider
    }
    return prefer_manager_id
  }

  generatePod (data) {
    const tabKeys = this.fi.containerPanes.map(v => v.key)
    const getEnvs = (names, values) => {
      const envs = []
      if (names) {
        for (const k in names) {
          envs.push({ key: names[k], value: values[k] })
        }
      }
      return envs
    }
    const getVolumeMounts = (names, paths) => {
      const volume_mounts = []
      if (names) {
        for (const k in names) {
          volume_mounts.push({
            type: 'disk',
            disk: {
              index: names[k],
            },
            mount_path: paths[k],
          })
        }
      }
      return volume_mounts
    }
    const containers = tabKeys.map(k => {
      const pciDevices = (this.fd.pciEnable && this.genPciDevices()) || []
      const image = this.fd.registryImages?.[k] || ''
      const credentialId = this.fd.imageCredentialIds?.[k] || ''
      const containerImageId = this.fd.containerImageIds?.[k] || ''

      const spec = {
        name: this.fd.containerNames?.[k],
        image: removeHttp(image) || this.fd.containerimages?.[k],
        command: this.fd.containerCommands?.[k]?.split(' '),
        args: this.fd.containerArgs?.[k]?.split(' '),
        privileged: this.fd.containerPrivilegeds?.[k],
        capabilities: (this.fd.containerCapAdd?.[k]?.length || this.fd.containerCapDrop?.[k]?.length) ? {
          add: this.fd.containerCapAdd?.[k] || [],
          drop: this.fd.containerCapDrop?.[k] || [],
        } : undefined,
        enable_lxcfs: this.fd.containerEnableLxcfs?.[k] || false,
        devices: pciDevices.map((item, idx) => {
          return {
            type: 'isolated_device',
            isolated_device: {
              index: idx,
            },
          }
        }),
        envs: getEnvs(this.fd.containerEnvNames?.[k], this.fd.containerEnvValues?.[k]),
        volume_mounts: getVolumeMounts(this.fd.containerVolumeMountNames?.[k], this.fd.containerVolumeMountPaths?.[k]),
      }
      if (containerImageId) {
        // region resolves image + credential from container_image_id
        spec.container_image_id = containerImageId
        delete spec.image
        delete spec.image_credential_id
      } else if (image && credentialId) {
        spec.image_credential_id = credentialId
        delete spec.container_image_id
      } else {
        delete spec.container_image_id
      }
      if (this.fd.containerEnableSysDiskOverlay?.[k]) {
        const overlayDiskSizes = this.fd.overlayDiskSizes?.[k]
        const overlayDiskTypes = this.fd.overlayDiskTypes?.[k]
        if (overlayDiskSizes) {
          const firstKey = Object.keys(overlayDiskSizes)[0]
          if (firstKey) {
            const size = overlayDiskSizes[firstKey]
            const diskTypeObj = overlayDiskTypes?.[firstKey]
            let backend = diskTypeObj?.key || ''
            let medium = ''
            if (diskSupportTypeMedium(this.fd.hypervisor)) {
              medium = getOriginDiskKey(backend, true)
              backend = getOriginDiskKey(backend)
            }
            const rootfsIndex = data.disks.length
            const overlayDisk = {
              disk_type: 'data',
              index: rootfsIndex + 1,
              backend,
              size: size * 1024,
              format: 'raw',
              fs: 'ext4',
            }
            if (medium) {
              overlayDisk.medium = medium
            }
            data.disks.push(overlayDisk)
            spec.rootfs = {
              type: 'disk',
              disk: {
                index: rootfsIndex,
                sub_directory: 'rootfs',
              },
              persistent: this.fd.containerRootfsPersistent?.[k] || false,
            }
          }
        }
      }
      return spec
    })

    return {
      containers,
      // port_mappings: getPortMappings(),
    }
  }

  /**
   * 组装所有的创建数据
   *
   * @returns { Object }
   * @memberof GenCreateData
   */
  all () {
    const { create_server_auto_start = true } = store.getters.globalSetting.value || {}
    const data = {
      auto_start: create_server_auto_start,
      // 主机模板页隐藏 name，名称在 servertemplate_name；普通创建用 name
      generate_name: (this.fd.name && this.fd.name.trim()) ||
        (this.fd.servertemplate_name && this.fd.servertemplate_name.trim()) ||
        '',
      description: this.fd.description,
      hypervisor: this.getHypervisor(),
      provider: this.createType === SERVER_TYPE.private ? 'Cloudpods' : 'OneCloud',
      __count__: this.fd.count,
      disks: this.genDisks(),
      nets: this.genNetworks(),
      prefer_region: this.getPreferRegion(),
      vcpu_count: this.getCpuCount(),
      vmem_size: this.getMemSize(),
      project_id: (this.fd.project && this.fd.project.key) || store.getters.userInfo.projectId,
      os_arch: _.get(HOST_CPU_ARCHS, `[${this.fd.os_arch}].key`),
      hostname: this.fd.hostName,
    }
    // 非预付费资源池不会添加sku
    if (!this.isPrepaid) {
      data.sku = this.fd.sku.name
    }
    // 弹性IP
    if (this.fd.eip_type === EIP_TYPES_MAP.new.key || this.fd.eip_type === EIP_TYPES_MAP.public.key) {
      if (
        this.fd.eip_charge_type === EIP_CHARGE_TYPES_MAP.traffic.key ||
        this.fd.eip_charge_type === EIP_CHARGE_TYPES_MAP.bandwidth.key
      ) {
        if (this.fd.eip_type === EIP_TYPES_MAP.public.key) {
          data.public_ip_charge_type = this.fd.eip_charge_type
          data.public_ip_bw = this.fd.eip_bw
        } else {
          data.eip_charge_type = this.fd.eip_charge_type
          data.eip_bw = this.fd.eip_bw
        }
      }
    }
    if (this.fd.eip_type === EIP_TYPES_MAP.bind.key) {
      data.eip = this.fd.eip
    }
    // 包年包月参数
    if (this.fd.billType === BILL_TYPES_MAP.package.key) {
      data.duration = this.fd.duration
      // 自动续费
      data.auto_renew = this.fd.autoRenew
    }
    // 线路类型
    if (this.fd.eip_bgp_type) {
      data.eip_bgp_type = this.fd.eip_bgp_type
    }

    // pci
    if (this.fd.pciEnable) {
      data.isolated_devices = this.genPciDevices()
    }

    // 安全组
    if (this.fd.secgroup_type && this.fd.secgroup_type === SECGROUP_OPTIONS_MAP.bind.key) {
      data.secgroups = this.fd.secgroup
    }
    // 如果设置了调度策略则拼装调度所需数据 或者 通过云账号过滤镜像
    if ((this.fd.schedPolicyType !== SCHED_POLICY_OPTIONS_MAP.default.key) || this.showPreferManager()) {
      const schedPolicyValueKey = this.getSchedPolicyValueKey()
      data[schedPolicyValueKey.key] = schedPolicyValueKey.value
    }
    // zone
    const zoneId = this.getPreferZone()
    if (zoneId) {
      data.prefer_zone = zoneId
    }
    const prefer_manager_id = this.getPreferManagerId()
    if (prefer_manager_id) {
      data.prefer_manager_id = prefer_manager_id
    }
    // 到期释放
    if (this.fd.billType !== BILL_TYPES_MAP.package.key && this.fd.durationStandard !== 'none') {
      if (this.fd.durationStandard === 'custom') {
        data.duration = this.fd.duration
      } else {
        data.duration = this.fd.durationStandard
      }
      data.billing_type = 'postpaid'
    }
    // 镜像类型为 iso 需要加参数 cdrom
    if (this.fd.imageType === IMAGES_TYPE_MAP.iso.key || this.fd.imageType === IMAGES_TYPE_MAP.private_iso.key) {
      data.cdrom = this.fd.image.key
    }
    // 主机镜像需要guest image id参数，并且把磁盘中的镜像ID回填回去
    if (this.fd.imageType === IMAGES_TYPE_MAP.host.key) {
      data.guest_image_id = this.fd.image.key
      data.disks.forEach((val, i) => {
        if (this.fi.imageMsg.data_images && i < this.fi.imageMsg.data_images.length) {
          data.disks[i] = { ...val, image_id: this.fi.imageMsg.data_images[i].id }
        }
      })
    }
    // 主机快照需要instance_snapshot_id参数
    if (this.fd.imageType === IMAGES_TYPE_MAP.snapshot.key) {
      data.instance_snapshot_id = this.fd.image.key
      delete data.disks // 主机快照不需要 disks 字段
    } else if (this.fd.imageType === IMAGES_TYPE_MAP.backup.key) {
      data.instance_backup_id = this.fd.image.key
      // delete data.disks // 主机备份可以保留 disks 字段
    }
    // 主机组
    if (this.fd.groupsEnable && this.fd.groups && this.fd.groups.length) {
      data.groups = this.fd.groups
    }
    // 标签
    if (this.fd.tag) {
      data.__meta__ = this.fd.tag
    }
    // 插槽数
    if (this.fi.showCpuSockets) {
      data.cpu_sockets = this.getCpuSockets()
    }
    // 容器
    data.pod = this.generatePod(data)
    data.extraData = {
      domain_id: this.fd.domain?.key || store.getters.userInfo.projectDomainId,
      nets: [],
    }
    const portMappings = this.getPortMappings()
    if (portMappings.length) {
      data.extraData.port_mappings = portMappings
    }
    // 指定 IP 子网时保留 UI 网络信息便于工单/草稿反填（需带 vpc，否则 NetworkConfig 无法拉子网）
    if (this.fd.networkType === NETWORK_OPTIONS_MAP.manual.key && this.fd.networks) {
      R.forEachObjIndexed((value, key) => {
        const item = {
          network: value,
          network_id: value,
        }
        if (this.fd.vpcs && this.fd.vpcs[key]) {
          item.vpc = this.fd.vpcs[key]
        }
        if (this.fd.networkIps && this.fd.networkIps[key]) {
          item.address = this.fd.networkIps[key]
        }
        if (this.fd.networkMacs && this.fd.networkMacs[key]) {
          item.mac = this.fd.networkMacs[key]
        }
        data.extraData.nets.push(item)
      }, this.fd.networks)
    }
    return data
  }

  /**
   * 获取创建预测的错误信息
   *
   * @returns { Array }
   * @memberof GenCreateData
   */
  getForecastErrors (data) {
    const errors = []
    if (data.filtered_candidates && data.filtered_candidates.length > 0) {
      for (let i = 0, len = data.filtered_candidates.length; i < len; i++) {
        const item = data.filtered_candidates[i]
        let message = `${i18n.t('dictionary.host')}【${item.name}】`
        const filterMapItem = FORECAST_FILTERS_MAP[item.filter_name]
        if (filterMapItem) {
          message += filterMapItem
        } else {
          message += i18n.t('compute.text_1325', [item.filter_name])
        }

        errors.push({
          message,
          children: item.reasons,
        })
      }
    } else {
      errors.push({
        message: i18n.t('compute.text_227'),
      })
    }
    return {
      errors,
      allow_count: data.allow_count || 0,
      req_count: data.req_count || 1,
      not_allow_reasons: data.not_allow_reasons,
    }
  }
}
