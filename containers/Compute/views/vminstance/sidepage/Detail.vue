<template>
  <detail
    :on-manager="onManager"
    :data="data"
    :extra-info="extraInfo"
    :base-info="baseInfo"
    :name-rules="[{ required: true, message: $t('compute.text_210') }]"
    :columns="serverColumns"
    showStatusProgress
    auto-hidden-columns-key="server_hidden_columns"
    status-module="server"
    resource="servers" />
</template>

<script>
import 'codemirror/theme/material.css'
import * as R from 'ramda'
import { ALL_STORAGE, SERVER_TYPE } from '@Compute/constants/index'
import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import { formatCpuNumaPin } from '@Compute/views/vminstance/utils'
import { formatServerSecgroupText, getNetworkTags, renderNetworkTagNodes } from '@Compute/utils/secgroupDisplay'
import { getIsolatedDeviceDetailColumns } from '@Compute/views/gpu/utils/columns'
import {
  getUserTagColumn,
  // getExtTagColumn,
} from '@/utils/common/detailColumn'
import {
  getCopyWithContentTableColumn,
  getBrandTableColumn,
  getSwitchTableColumn,
  getOsArch,
  getOsDist,
  getIpsTableColumn,
  getServerMonitorAgentInstallStatus,
  getStatusTableColumn,
  getNameDescriptionTableColumn,
} from '@/utils/common/tableColumn'
import WindowsMixin from '@/mixins/windows'
import { findPlatform } from '@/utils/common/hypervisor'
import { BRAND_MAP, HYPERVISORS_MAP } from '@/constants'
import { sizestr, sizestrWithUnit } from '@/utils/utils'
import { hasPermission } from '@/utils/auth'
export default {
  name: 'VmInstanceDetail',
  mixins: [WindowsMixin],
  props: {
    onManager: {
      type: Function,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    serverColumns: Array,
  },
  data () {
    return {
      alertData: null,
      baseInfo: [
        getStatusTableColumn({
          field: 'power_states',
          title: this.$t('compute.power_states'),
          statusModule: 'server',
        }),
        {
          field: 'project_domain',
          hiddenField: 'tenant',
          title: this.$t('dictionary.domain'),
          formatter: ({ row }, h) => {
            if (!row.domain_id) return '-'
            return h('side-page-trigger', {
              props: {
                permission: 'domains_get',
                name: 'DomainSidePage',
                id: row.domain_id,
                vm: this,
              },
            }, row.project_domain)
          },
        },
        {
          field: 'tenant',
          title: this.$t('dictionary.project'),
          formatter: ({ row }, h) => {
            if (!row.tenant_id) return '-'
            return h('side-page-trigger', {
              props: {
                permission: 'projects_get',
                name: 'ProjectSidePage',
                id: row.tenant_id,
                vm: this,
              },
            }, row.tenant)
          },
        },
        getNameDescriptionTableColumn({
          onManager: this.onManager,
          field: 'hostname',
          hiddenField: 'name',
          title: this.$t('common_388'),
          label: this.$t('common_388'),
          showDesc: false,
          resource: 'servers',
          formRules: [{ required: true, message: this.$t('common.tips.input', [this.$t('common_388')]) }],
        }),
        getOsArch(),
        getUserTagColumn({
          onManager: this.onManager,
          resource: 'server',
          columns: () => this.serverColumns,
          tipName: this.$t('dictionary.server'),
          editCheck: (row) => row.hypervisor !== 'bingocloud',
        }),
        // getExtTagColumn({ onManager: this.onManager, resource: 'server', columns: () => this.serverColumns, tipName: this.$t('dictionary.server') }),
        getServerMonitorAgentInstallStatus(),
        {
          field: 'alert_data',
          title: (h) => {
            const create = h || this.$createElement
            return [
              create('span', { style: 'margin-right:5px' }, this.$t('compute.alert_status')),
              create('help-tooltip', { props: { name: 'alertDataTimeRange' } }),
            ]
          },
          slots: {
            default: () => {
              const state = this.alertData?.alert_state || 'init'
              return [
                this.$createElement('status', {
                  props: {
                    status: state,
                    statusModule: 'monitorresources',
                  },
                }),
              ]
            },
          },
          hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.alert_data'),
        },
        {
          field: 'keypair',
          hiddenField: 'password',
          title: this.$t('compute.text_33'),
        },
        getBrandTableColumn(),
        {
          field: 'billing_type',
          title: this.$t('table.title.bill_type'),
          showOverflow: 'ellipsis',
          slots: {
            default: ({ row }, h) => {
              const ret = []
              if (row.billing_type === 'postpaid') {
                ret.push(h('div', { style: { color: 'var(--oc-color-text-heading)' } }, this.$t('billingType.postpaid')))
              } else if (row.billing_type === 'prepaid') {
                ret.push(h('div', { style: { color: 'var(--oc-color-text-heading)' } }, `${this.$t('billingType.prepaid')}（${row.auto_renew ? this.$t('compute.text_1233') : this.$t('compute.manual_renewal')}）`))
              }
              if (row.expired_at) {
                const dateArr = this.$moment(row.expired_at).fromNow().split(' ')
                const date = dateArr.join(' ')
                const seconds = this.$moment(row.expired_at).diff(new Date()) / 1000
                const textColor = seconds / 24 / 60 / 60 < 7 ? '#DD2727' : 'var(--oc-color-text-secondary)'
                const text = seconds < 0 ? this.$t('common_296') : this.$t('common_297', [date])
                ret.push(h('div', { style: { color: textColor } }, text))
              }
              return ret
            },
          },
        },
        {
          field: 'password',
          title: this.$t('table.title.init_keypair'),
          minWidth: 50,
          slots: {
            default: ({ row }, h) => {
              // 同列表列：用组件引用，避免 Vue3 下字符串名解析失败
              return [
                h(PasswordFetcher, {
                  props: {
                    serverId: row.id,
                    resourceType: 'servers',
                  },
                }),
              ]
            },
          },
        },
      ],
      imageExist: false,
      guestIsolatedDevices: [],
      cmOptions: {
        tabSize: 2,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
        line: true,
        theme: 'material',
        mode: 'text/x-yaml',
        readOnly: true,
      },
      cmdline: '',
      showCmdline: false,
    }
  },
  computed: {
    isOpenStack () {
      const brand = this.data.brand
      return brand === BRAND_MAP.OpenStack.brand
    },
    isKvm () {
      const { brand } = this.data
      return brand === BRAND_MAP.OneCloud.brand
    },
    diskInfos () {
      const disksInfo = this.data.disks_info
      if (!disksInfo) return {}
      const dataDisk = {}
      const sysDisk = {}
      let image = '-'
      let imageId
      const sysDisks = disksInfo.filter(v => v.disk_type === 'sys')
      const dataDisks = disksInfo.filter(v => v.disk_type === 'data')
      if (sysDisks && sysDisks.length > 0) {
        const sysKey = sysDisks[0].storage_type
        image = sysDisks[0].image || '-'
        imageId = sysDisks[0].image_id
        sysDisk[sysKey] = this._dealSize(sysDisks)
        if (sysDisks[0].auto_reset) {
          sysDisk.auto_reset = true
        }
      }
      if (dataDisks && dataDisks.length > 0) {
        for (const k in ALL_STORAGE) {
          const e = ALL_STORAGE[k]
          let sameType = dataDisks.filter(v => v.storage_type === e.value)
          if (this.isOpenStack) {
            sameType = dataDisks.filter(v => v.storage_type.includes(e.value))
          }
          if (sameType && sameType.length) {
            dataDisk[k] = this._dealSize(sameType)
          }
        }
        if (dataDisks.some(v => v.auto_reset)) {
          dataDisk.auto_reset_some = true
        }
        if (dataDisks.every(v => v.auto_reset)) {
          dataDisk.auto_reset_some = false
          dataDisk.auto_reset = true
        }
      }
      if (this.data.cdrom && dataDisks.length > 0) {
        image = dataDisks[0].image
        imageId = dataDisks[0].image_id
      }

      return {
        sysDisk: this._diskStringify(sysDisk),
        dataDisk: this._diskStringify(dataDisk),
        image,
        imageId,
      }
    },
    extraInfo () {
      const backupInfo = []
      if (this.data.backup_host_name) {
        backupInfo.push({
          title: this.$t('compute.backup_setting'),
          items: [
            {
              field: 'backup_host_name',
              title: this.$t('compute.text_1163'),
              slots: {
                default: ({ row }) => {
                  if (!row.backup_host_name) return '-'
                  return [
                    h('side-page-trigger', {
                      props: {
                        permission: 'hosts_get',
                        name: 'HostSidePage',
                        id: row.backup_host_id,
                        vm: this,
                      },
                    }, row.backup_host_name),
                  ]
                },
              },
              hidden: () => this.$store.getters.isProjectMode,
            },
            getStatusTableColumn({
              field: 'backup_host_status',
              title: this.$t('compute.backup_host_status'),
              statusModule: 'host',
              hidden: () => this.$store.getters.isProjectMode,
            }),
            {
              field: 'backup_guest_status',
              title: this.$t('compute.backup_status'),
              slots: {
                default: ({ row }, h) => {
                  return [
                    h('div', { class: 'd-flex' }, [
                      h('div', { class: 'text-truncate' }, [
                        h('status', {
                          props: {
                            status: row.backup_guest_status,
                            statusModule: 'server',
                          },
                        }),
                      ]),
                      h('div', [
                        h('a-button', {
                          props: { type: 'link', disabled: row.backup_guest_status !== 'ready' },
                          style: 'height: 14px',
                          on: { click: this.startBackup },
                        }, [
                          h('icon', { props: { type: 'start' }, style: 'transform:translateX(4px)' }),
                          this.$t('compute.start_backup'),
                        ]),
                      ]),
                    ]),
                  ]
                },
              },
            },
            {
              field: 'backup_sync_status',
              title: this.$t('compute.backup_sync_status'),
              slots: {
                default: ({ row }, h) => {
                  return [
                    h('div', { class: 'd-flex' }, [
                      h('div', { class: 'text-truncate' }, [
                        h('status', {
                          props: {
                            status: row.backup_guest_sync_status,
                            statusModule: 'backup_sync',
                          },
                        }),
                      ]),
                      h('div', [
                        h('a-button', {
                          props: { type: 'link', disabled: row.backup_guest_sync_status !== 'ready' },
                          style: 'height: 14px',
                          on: { click: this.switchBackup },
                        }, [
                          h('icon', { props: { type: 'switch' }, style: 'transform:translateX(4px)' }),
                          this.$t('compute.switch_backup'),
                        ]),
                      ]),
                    ]),
                  ]
                },
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.os_arch'),
        })
      }
      const infos = [
        {
          title: this.$t('compute.text_368'),
          items: [
            getOsDist({
              title: this.$t('compute.text_267'),
              show_label: true,
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.os_type'),
            }),
            getIpsTableColumn({ field: 'ip', title: 'IP', vm: this, hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.ips') }),
            {
              field: 'sub_ips',
              title: this.$t('compute.sub_ips.title'),
              slots: {
                default: ({ row }, h) => {
                  if (!row.sub_ips) {
                    return '-'
                  }
                  const ret = []
                  for (var i = 0; i < row.sub_ips.length; i++) {
                    ret.push(h('list-body-cell-wrap', {
                      props: {
                        copy: true,
                        field: 'ip',
                        row: { ip: row.sub_ips[i] },
                      },
                    }))
                  }
                  return ret
                },
              },
              hidden: (row) => this.$isScopedPolicyMenuHidden('server_hidden_columns.ips'),
            },
            getCopyWithContentTableColumn({
              field: 'macs',
              title: 'MAC',
              hideField: true,
              slotCallback: row => {
                return row.macs || '-'
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.macs'),
            }),
            getCopyWithContentTableColumn({
              field: 'image',
              title: this.$t('compute.text_97'),
              hideField: true,
              message: this.diskInfos.image,
              customEdit: hasPermission({ key: 'server_perform_rebuild_root' }) && this.data.status === 'ready',
              customEditCallback: (row) => {
                this.createDialog('VmRebuildRootDialog', {
                  data: [row],
                  columns: this.columns,
                  onManager: this.onManager,
                })
              },
              slotCallback: (row, h) => {
                if (!this.diskInfos.image || this.diskInfos.image === '-') return '-'
                if (!this.imageExist) return this.diskInfos.image
                return [
                  h('side-page-trigger', {
                    props: {
                      permission: 'images_get',
                      name: 'SystemImageSidePage',
                      id: this.diskInfos.imageId,
                      vm: this,
                    },
                  }, this.diskInfos.image),
                ]
              },
            }),
            {
              field: 'host',
              title: this.$t('compute.text_111'),
              sortable: true,
              showOverflow: 'ellipsis',
              minWidth: 100,
              slots: {
                default: ({ row }, h) => {
                  if (findPlatform(row.hypervisor, 'hypervisor') === SERVER_TYPE.public || row.hypervisor === HYPERVISORS_MAP.hcso.hypervisor || row.hypervisor === HYPERVISORS_MAP.hcs.hypervisor) {
                    return '-'
                  }
                  const text = row.host || '-'
                  return [
                    h('list-body-cell-wrap', {
                      props: {
                        copy: true,
                        hideField: true,
                        field: 'host',
                        row,
                        message: text,
                      },
                    }, [
                      h('side-page-trigger', {
                        props: {
                          permission: 'hosts_get',
                          name: 'HostSidePage',
                          id: row.host_id,
                          vm: this,
                        },
                      }, row.host),
                    ]),
                  ]
                },
              },
              hidden: () => this.$store.getters.isProjectMode || this.$isScopedPolicyMenuHidden('server_hidden_columns.host'),
            },
            {
              field: 'secgroups',
              title: this.$t('compute.text_105'),
              slots: {
                default: ({ row }, h) => {
                  const networkTags = getNetworkTags(row)
                  if (networkTags.length) {
                    return renderNetworkTagNodes(networkTags)
                  }
                  if (!row.secgroups?.length) return '-'
                  return row.secgroups.map((item) => {
                    return h('list-body-cell-wrap', {
                      props: {
                        copy: true,
                        hideField: true,
                        field: 'name',
                        row: item,
                        message: item.name,
                      },
                    }, [
                      h('side-page-trigger', {
                        props: {
                          permission: 'secgroups_get',
                          name: 'SecGroupSidePage',
                          id: item.id,
                          vm: this,
                        },
                      }, item.name),
                    ])
                  })
                },
              },
              formatter: ({ row }) => formatServerSecgroupText(row) || '-',
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.secgroups'),
            },
            {
              field: 'network_secgroups',
              title: this.$t('compute.nic_secgroups'),
              slots: {
                default: ({ row }, h) => {
                  if (!row.network_secgroups) return '-'
                  const secgroups = []
                  row.network_secgroups.forEach((item) => {
                    item.secgroups.forEach((secgroup) => {
                      secgroups.push({ ...secgroup, network_index: item.network_index })
                    })
                  })
                  return secgroups.map((item) => {
                    return h('list-body-cell-wrap', {
                      props: {
                        copy: true,
                        hideField: true,
                        field: 'name',
                        row: item,
                        message: item.name,
                      },
                    }, [
                      this.$t('compute.text_375') + ' ' + item.network_index + ': ',
                      h('side-page-trigger', {
                        props: {
                          permission: 'secgroups_get',
                          name: 'SecGroupSidePage',
                          id: item.id,
                          vm: this,
                        },
                      }, item.name),
                    ])
                  })
                },
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.secgroups') || !this.isKvm,
            },
            getCopyWithContentTableColumn({
              field: 'vpc',
              title: 'VPC',
              hideField: true,
              slotCallback: (row, h) => {
                if (!row.vpc) return '-'
                return [
                  h('side-page-trigger', {
                    props: {
                      permission: 'vpcs_get',
                      name: 'VpcSidePage',
                      id: row.vpc_id,
                      vm: this,
                    },
                  }, row.vpc),
                ]
              },
              hidden: () => this.$store.getters.isProjectMode || this.$isScopedPolicyMenuHidden('server_hidden_columns.vpc'),
            }),
            {
              field: 'vcpu_count',
              title: 'CPU',
              formatter: ({ row }) => {
                if (row.hypervisor === HYPERVISORS_MAP.esxi.key && row.cpu_sockets) {
                  return `CPU: ${row.vcpu_count}${this.$t('compute.text_167')}（${this.$t('compute.slots_number')}：${row.cpu_sockets}）`
                }
                return row.vcpu_count + this.$t('compute.text_167')
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.vcpu_count'),
            },
            {
              field: 'vmem_size',
              title: this.$t('compute.text_369'),
              formatter: ({ row }) => {
                return (row.vmem_size / 1024) + 'GB'
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.vmem_size'),
            },
            {
              field: 'cpu_numa_pin',
              title: this.$t('compute.text_609'),
              formatter: ({ row }) => {
                return formatCpuNumaPin(row)
              },
            },
            {
              field: 'sysDisk',
              title: this.$t('compute.text_49'),
              formatter: ({ row }, h) => {
                if (!this.diskInfos.sysDisk) return '-'
                return h('a', {
                  on: {
                    click: () => this.$emit('tab-change', 'disk-list-for-vm-instance-sidepage'),
                  },
                }, this.diskInfos.sysDisk)
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.disk'),
            },
            {
              field: 'dataDisk',
              title: this.$t('compute.text_50'),
              formatter: ({ row }, h) => {
                if (!this.diskInfos.dataDisk) return '-'
                return h('a', {
                  on: {
                    click: () => this.$emit('tab-change', 'disk-list-for-vm-instance-sidepage'),
                  },
                }, this.diskInfos.dataDisk)
              },
              hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.disk'),
            },
            (() => {
              function getCdromInfo (row) {
                if (!row.cdrom) return '-'
                let cdrom = `${row.cdrom}`
                if (Array.isArray(row.cdrom) && row.cdrom.length > 0) {
                  cdrom = row.cdrom[0].detail
                }
                const idx = cdrom.indexOf('(')
                return cdrom.substring(0, idx)
              }
              return getCopyWithContentTableColumn({
                field: 'cdrom',
                title: 'ISO',
                hideField: true,
                message: getCdromInfo,
                slotCallback: (row, h) => {
                  if (!row.cdrom) return '-'
                  let cdrom = `${row.cdrom}`
                  if (Array.isArray(row.cdrom) && row.cdrom.length > 0) {
                    cdrom = row.cdrom[0].detail
                  }
                  const idx = cdrom.indexOf('(')
                  const id = cdrom.substring(idx + 1, cdrom.indexOf('/'))
                  return [
                    h('side-page-trigger', {
                      props: {
                        permission: 'images_get',
                        name: 'SystemImageSidePage',
                        id,
                        vm: this,
                      },
                    }, cdrom.substring(0, idx) || '-'),
                  ]
                },
              })
            })(),
            {
              field: 'isolated_devices',
              title: this.$t('compute.text_113'),
              formatter: ({ row }) => {
                if (!row.isolated_devices?.length && !row.gpu_count) return '-'
                const devices = this.getIsolatedDevicesForDisplay(row).filter(val => val.dev_type !== 'USB')
                if (!devices.length) {
                  if (row.gpu_count && row.gpu_model) {
                    return this.$t('compute.text_370', [row.gpu_count, row.gpu_model])
                  }
                  return '-'
                }
                return this.renderIsolatedDeviceRows(devices)
              },
            },
            {
              field: 'isolated_devices',
              title: 'USB',
              formatter: ({ row }) => {
                if (!row.isolated_devices?.length) return '-'
                const devices = this.getIsolatedDevicesForDisplay(row).filter(val => val.dev_type === 'USB')
                if (!devices.length) return '-'
                return this.renderIsolatedDeviceRows(devices)
              },
            },
            {
              field: 'is_daemon',
              title: () => {
                return [
                  this.$t('compute.text_494'),
                  this.$createElement('help-tooltip', {
                    class: 'ml-1',
                    props: {
                      text: this.$t('compute.daemon.tooltip'),
                    },
                  }),
                ]
              },
              formatter: ({ row }) => {
                if (row.is_daemon) {
                  return this.$t('table.title.on')
                } else {
                  return this.$t('table.title.off')
                }
              },
            },
            {
              field: 'bandwidth',
              title: this.$t('compute.max_bandwidth'),
              slots: {
                default: ({ row }) => {
                  return row.internet_max_bandwidth_out ? sizestrWithUnit(row.internet_max_bandwidth_out, 'M', 1024) + '/s' : '-'
                },
              },
            },
            {
              field: 'monitor_url',
              title: this.$t('compute.monitor_url.prompt'),
              formatter: ({ row }) => {
                return row.monitor_url
              },
            },
            {
              field: 'bios',
              title: this.$t('compute.bios'),
              formatter: ({ row }) => {
                return row.bios || 'BIOS'
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.os_arch'),
        },
        {
          title: this.$t('compute.title.encryption'),
          items: [
            {
              field: 'encrypt_key_id',
              title: this.$t('compute.title.encryption_key'),
              formatter: ({ callValue, row }) => {
                if (row.encrypt_key_id) {
                  if (row.encrypt_key && row.encrypt_alg) {
                    return row.encrypt_key + ' (' + row.encrypt_key_id + ')'
                  } else {
                    return row.encrypt_key_id
                  }
                } else {
                  return this.$t('compute.no_encryption')
                }
              },
            },
            {
              field: 'encrypt_alg',
              title: this.$t('compute.title.encrypt_alg'),
              formatter: ({ callValue, row }) => {
                if (row.encrypt_alg) {
                  return row.encrypt_alg.toUpperCase()
                } else {
                  return '-'
                }
              },
            },
            {
              field: 'encrypt_key_user',
              title: this.$t('compute.title.encrypt_key_user'),
              formatter: ({ callValue, row }) => {
                if (row.encrypt_key_user) {
                  return row.encrypt_key_user + ' / ' + row.encrypt_key_user_domain
                } else {
                  return '-'
                }
              },
            },
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.password'),
        },
        ...backupInfo,
        {
          title: this.$t('compute.text_371'),
          items: [
            getSwitchTableColumn({
              field: 'disable_delete',
              title: this.$t('common.text00076'),
              change: val => {
                this.onManager('update', {
                  id: this.data.id,
                  managerArgs: {
                    data: { disable_delete: val },
                  },
                })
              },
            }),
          ],
          hidden: () => this.$isScopedPolicyMenuHidden('server_hidden_columns.perform_action'),
        },
      ]
      if (this.isKvm && this.cmdline) {
        infos[infos.length - 1].items.unshift({
          field: 'metadata',
          title: this.$t('compute.qemu_cmdline'),
          slots: {
            default: ({ row }, h) => {
              return [
                h('a-button', {
                  props: { type: 'link' },
                  class: 'mb-2',
                  style: 'height: 21px;padding:0',
                  on: { click: this.viewCmdline },
                }, this.showCmdline ? this.$t('table.title.off') : this.$t('compute.text_958')),
                h('code-mirror', {
                  style: this.showCmdline ? {} : { visibility: 'hidden', height: '0px' },
                  props: {
                    value: this.cmdline,
                    viewHeight: '300px',
                    options: this.cmOptions,
                  },
                }),
              ]
            },
          },
        })
      }
      return infos
    },
  },
  watch: {
    diskInfos: {
      handler: 'checkImage',
      immediate: true,
    },
    'data.agent_status': {
      handler: function (val, oldval) {
        if (oldval === 'applying') {
          if (val === 'succeed' || val === 'failed') {
            this.baseInfo[6] = getServerMonitorAgentInstallStatus()
          }
        }
      },
      immediate: true,
      deep: true,
    },
    'data.id': {
      handler () {
        this.fetchAlertData()
        this.fetchGuestIsolatedDevices()
      },
      immediate: true,
    },
    'data.isolated_devices': {
      handler () {
        this.fetchGuestIsolatedDevices()
      },
    },
  },
  created () {
    this.initQemuInfo()
  },
  methods: {
    getIsolatedDevicesForDisplay (row) {
      if (this.guestIsolatedDevices.length) return this.guestIsolatedDevices
      return row.isolated_devices || []
    },
    renderIsolatedDeviceRows (devices) {
      const deviceList = Array.isArray(devices) ? devices.slice() : []
      return [
        this.$createElement('div', [
          this.$createElement('table-lite-grid', {
            class: 'mb-2',
            props: {
              data: deviceList,
              columns: getIsolatedDeviceDetailColumns(this, deviceList),
              resizable: true,
            },
          }),
        ]),
      ]
    },
    async fetchGuestIsolatedDevices () {
      if (!this.data?.id || !this.data.isolated_devices?.length) {
        this.guestIsolatedDevices = []
        return
      }
      try {
        const res = await new this.$Manager('guestisolateddevices').list({
          params: {
            limit: 0,
            guest_id: this.data.id,
            scope: this.$store.getters.scope,
          },
        })
        this.guestIsolatedDevices = res.data.data || []
      } catch (e) {
        this.guestIsolatedDevices = []
      }
    },
    async fetchAlertData () {
      this.alertData = null
      const id = this.data?.id
      if (!id) return
      if (this.$isScopedPolicyMenuHidden('server_hidden_columns.alert_data')) return
      try {
        const monitorManager = new this.$Manager('unifiedmonitors', 'v1')
        const res = await monitorManager.get({
          id: 'resource-metrics',
          params: {
            res_ids: [id],
            res_type: 'guest',
          },
        })
        const metrics = res.data?.resource_metrics?.[id]
        this.alertData = metrics || null
      } catch (e) {
        this.alertData = null
      }
    },
    _diskStringify (diskObj) {
      let str = ''
      const storageArr = Object.values(ALL_STORAGE)
      for (const k in diskObj) {
        if (k === 'auto_reset' || k === 'auto_reset_some') continue
        const num = diskObj[k]
        const disk = storageArr.find(v => v.value === k)
        if (disk) {
          str += `、${sizestr(num, 'M', 1024)}（${disk.label}${diskObj.auto_reset_some ? ' ' + this.$t('compute.shutdown_auto_reset_some') : (diskObj.auto_reset ? ' ' + this.$t('compute.shutdown_auto_reset') : '')}）`
        } else {
          str += `、${sizestr(num, 'M', 1024)}（${k}${diskObj.auto_reset_some ? ' ' + this.$t('compute.shutdown_auto_reset_some') : (diskObj.auto_reset ? ' ' + this.$t('compute.shutdown_auto_reset') : '')}）`
        }
      }
      return str.slice(1)
    },
    _dealSize (sameType) {
      const sameType1 = sameType.map(v => {
        const size = +v.size
        return size
      })
      return sameType1.reduce((a, b) => {
        return a + b
      })
    },
    checkImage () {
      new this.$Manager('images', 'v1')
        .list({ params: { id: this.diskInfos.imageId, scope: this.$store.getters.scope } })
        .then(({ data }) => {
          this.imageExist = !R.isEmpty(data.data)
        })
        .catch(() => {
          this.imageExist = false
        })
    },
    viewCmdline () {
      this.showCmdline = !this.showCmdline
    },
    async initQemuInfo () {
      try {
        if (this.isKvm) {
          const res = await this.onManager('getSpecific', {
            id: this.data.id,
            managerArgs: {
              spec: 'qemu-info',
            },
          })
          const { cmdline = '' } = res.data
          this.cmdline = cmdline
        }
      } catch (err) {
        console.error(err)
      }
    },
    switchBackup () {
      this.createDialog('VmSwitchBackup2Dialog', {
        data: [this.data],
        onManager: this.onManager,
        columns: this.serverColumns,
      })
    },
    startBackup () {
      this.createDialog('VmStartBackupDialog', {
        data: [this.data],
        onManager: this.onManager,
        columns: this.serverColumns,
      })
    },
  },
}
</script>
