import i18n from '@/locales'
// 报警级别
export const LEVEL_CN = {
  normal: {
    label: i18n.t('compute.text_750'),
    color: 'cyan',
  },
  important: {
    label: i18n.t('compute.text_751'),
    color: 'orange',
  },
  fatal: {
    label: i18n.t('compute.text_752'),
    color: 'red',
  },
}

export const metricItems = {
  // 虚拟机
  'vm_cpu.usage_active': { key: 'vm_cpu.usage_active', label: i18n.t('compute.text_753'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'vm_cpu.usage_iowait': { key: 'vm_cpu.usage_iowait', label: i18n.t('monitor.text_128'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'vm_cpu.reads': { key: 'vm_cpu.reads', label: i18n.t('monitor.text_129'), unit: 'count' },
  'vm_cpu.writes': { key: 'vm_cpu.writes', label: i18n.t('monitor.text_130'), unit: 'count' },
  'vm_mem.used_percent': { key: 'vm_mem.used_percent', label: i18n.t('compute.text_755'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'vm_disk.used_percent': { key: 'vm_disk.used_percent', label: i18n.t('compute.text_533'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'vm_mem.used': { key: 'vm_mem.used', label: i18n.t('monitor.text_127'), unit: 'G' },
  'vm_netio.bps_recv': { key: 'vm_netio.bps_recv', label: i18n.t('compute.text_756'), unit: 'bps' },
  'vm_netio.bps_sent': { key: 'vm_netio.bps_sent', label: i18n.t('compute.text_757'), unit: 'bps' },
  'vm_netio.pps_recv': { key: 'vm_netio.pps_recv', label: i18n.t('compute.netio.pps_recv'), unit: 'pps' },
  'vm_netio.pps_sent': { key: 'vm_netio.pps_sent', label: i18n.t('compute.netio.pps_sent'), unit: 'pps' },
  'vm_diskio.read_bps': { key: 'vm_diskio.read_bps', label: i18n.t('compute.text_758'), unit: 'bps' },
  'vm_diskio.write_bps': { key: 'vm_diskio.write_bps', label: i18n.t('compute.text_759'), unit: 'bps' },
  'vm_diskio.read_iops': { key: 'vm_diskio.read_iops', label: i18n.t('compute.text_758'), unit: 'iops' },
  'vm_diskio.write_iops': { key: 'vm_diskio.write_iops', label: i18n.t('compute.text_759'), unit: 'iops' },
  // KVM宿主机
  'usage_active,usage_idle,usage_user,usage_system,usage_iowait': { key: 'usage_active,usage_idle,usage_user,usage_system,usage_iowait', label: i18n.t('compute.text_760'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'load1,load5,load15,load1_pcore,load5_pcore,load15_pcore': { key: 'load1,load5,load15,load1_pcore,load5_pcore,load15_pcore', label: i18n.t('compute.text_761'), unit: '%' },
  used_percent: { key: 'used_percent', label: i18n.t('compute.text_755'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'used,free,total': { key: 'used,free,total', label: i18n.t('compute.text_762'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  // 'used_percent': { key: 'used_percent', label: '磁盘使用率(used_percent)', unit: '%', rules: [{ max: 100, type: 'integer', message: '请输入100以内的数值' }] },
  // 'used,free,total': { key: 'used,free,total', label: '磁盘使用情况(used,free,total)', unit: '%', rules: [{ max: 100, type: 'integer', message: '请输入100以内的数值' }] },
  ioutil: { key: 'ioutil', label: i18n.t('compute.text_763'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'read_iops,write_iops': { key: 'read_iops,write_iops', label: i18n.t('compute.text_764'), unit: '%' },
  bps_recv: { key: 'bps_recv', label: i18n.t('compute.text_756'), unit: '%' },
  bps_sent: { key: 'bps_sent', label: i18n.t('compute.text_757'), unit: '%' },
  // VMWARE宿主机
  usage_active: { key: 'usage_active', label: i18n.t('compute.text_753'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  // 'used_percent': { key: 'used_percent', label: '内存使用率(used_percent)', unit: '%', rules: [{ max: 100, type: 'integer', message: '请输入100以内的数值' }] },
  read_bps: { key: 'read_bps', label: i18n.t('compute.text_765'), unit: '%' },
  write_bps: { key: 'write_bps', label: i18n.t('compute.text_766'), unit: '%' },
  // 'bps_recv': { key: 'bps_recv', label: '网络入流量(bps_recv)', unit: '%' },
  // 'bps_sent': { key: 'bps_sent', label: '网络出流量(bps_sent)', unit: '%' },
  // ModelArts
  'modelarts_pool_cpu.usage_percent': { key: 'modelarts_pool_cpu.usage_percent', label: i18n.t('compute.text_753'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_cpu_mem.usage_percent': { key: 'modelarts_pool_cpu_mem.usage_percent', label: i18n.t('compute.text_755'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_gpu.usage_percent': { key: 'modelarts_pool_gpu.usage_percent', label: i18n.t('compute.modelarts.monitor.gpu.usage_percent'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_gpu_mem.usage_percent': { key: 'modelarts_pool_gpu_mem.usage_percent', label: i18n.t('compute.modelarts.monitor.gpu_mem.usage_percent'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_npu.usage_percent': { key: 'modelarts_pool_npu.usage_percent', label: i18n.t('compute.modelarts.monitor.npu.usage_percent'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_npu_mem.usage_percent': { key: 'modelarts_pool_npu_mem.usage_percent', label: i18n.t('compute.modelarts.monitor.npu_mem.usage_percent'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  'modelarts_pool_disk.available_capacity': { key: 'modelarts_pool_disk.available_capacity', label: i18n.t('compute.modelarts.monitor.disk.available_capacity'), unit: 'G' },
  'modelarts_pool_disk.capacity': { key: 'modelarts_pool_disk.available_capacity', label: i18n.t('compute.modelarts.monitor.disk.capacity'), unit: 'G' },
  'modelarts_pool_disk.usage_percent': { key: 'modelarts_pool_disk.usage_percent', label: i18n.t('compute.text_533'), unit: '%', rules: [{ max: 100, type: 'integer', message: i18n.t('compute.text_754') }] },
  // 容器主机
  'pod_cpu.usage_rate': { key: 'pod_cpu.usage_rate', label: i18n.t('compute.text_523'), unit: '%' },
  'pod_mem.usage_rate': { key: 'pod_mem.usage_rate', label: i18n.t('compute.text_518'), unit: '%' },
  'pod_mem.working_set_bytes': { key: 'pod_mem.working_set_bytes', label: i18n.t('compute.container.monitor.pod_mem_used'), unit: 'B' },
  'container_cpu.usage_rate': { key: 'container_cpu.usage_rate', label: i18n.t('compute.text_523'), unit: '%' },
  'container_mem.usage_rate': { key: 'container_mem.usage_rate', label: i18n.t('compute.text_518'), unit: '%' },
  'container_mem.working_set_bytes': { key: 'container_mem.working_set_bytes', label: i18n.t('compute.container.monitor.pod_mem_used'), unit: 'B' },
  'pod_volume.total': { key: 'pod_volume.total', label: i18n.t('compute.container.monitor.pod_volume_total'), unit: 'B' },
  'pod_volume.used': { key: 'pod_volume.used', label: i18n.t('compute.container.monitor.pod_volume_used'), unit: 'B' },
  'pod_volume.used_percent': { key: 'pod_volume.used_percent', label: i18n.t('compute.container.monitor.pod_volume_used_percent'), unit: '%' },
  'pod_volume.inodes_used_percent': { key: 'pod_volume.inodes_used_percent', label: i18n.t('compute.container.monitor.pod_volume_inodes_used_percent'), unit: '%' },
  'pod_netio.bps_recv': { key: 'pod_netio.bps_recv', label: i18n.t('compute.container.monitor.pod_netio_bps_recv'), unit: 'bps' },
  'pod_netio.bps_sent': { key: 'pod_netio.bps_sent', label: i18n.t('compute.container.monitor.pod_netio_bps_sent'), unit: 'bps' },
  'pod_netio.pps_recv': { key: 'pod_netio.pps_recv', label: i18n.t('compute.container.monitor.pod_netio_pps_recv'), unit: 'pps' },
  'pod_netio.pps_sent': { key: 'pod_netio.pps_sent', label: i18n.t('compute.container.monitor.pod_netio_pps_sent'), unit: 'pps' },
  'pod_diskio.read_Bps': { key: 'pod_diskio.read_Bps', label: i18n.t('compute.container.monitor.pod_diskio_read_Bps'), unit: 'Bps' },
  'pod_diskio.write_Bps': { key: 'pod_diskio.write_Bps', label: i18n.t('compute.container.monitor.pod_diskio_write_Bps'), unit: 'Bps' },
  'pod_process.process_count': { key: 'pod_process.process_count', label: i18n.t('compute.container.monitor.pod_process_process_count'), unit: 'count' },
  'pod_process.fd_count': { key: 'pod_process.fd_count', label: i18n.t('compute.container.monitor.pod_process_fd_count'), unit: 'count' },
  'pod_gpu.mem_util': { key: 'pod_gpu.mem_util', label: i18n.t('compute.container.monitor.pod_gpu_mem_util'), unit: '%' },
}

export const TIME_CN = {
  s: i18n.t('compute.text_767'),
  m: i18n.t('compute.text_734'),
  h: i18n.t('compute.text_172'),
}

export const channelMap = {
  email: i18n.t('compute.text_743'),
  moblie: i18n.t('compute.text_768'),
  dingtalk: i18n.t('compute.text_769'),
}
