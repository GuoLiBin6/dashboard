import _ from 'lodash'
import PasswordFetcher from '@Compute/sections/PasswordFetcher'
import {
  getRegionTableColumn,
  getStatusTableColumn,
  getBrandTableColumn,
  getEnabledTableColumn,
  getNameDescriptionTableColumn,
  getPublicScopeTableColumn,
  getProjectDomainTableColumn,
  getTagTableColumn,
  getAccountTableColumn,
  getOsArch,
  getTimeTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import { sizestr, percentstr } from '@/utils/utils'
import i18n from '@/locales'

export default {
  created () {
    const getStatusToolTip = (row) => {
      if (row.metadata) {
        const sysWarn = row.metadata.sys_warn
        const sysError = row.metadata.sys_error
        const titleCon = sysWarn || sysError
        if (titleCon) {
          // const aLink = <side-page-trigger vm={this} name='HostSidePage' id={row.id} list={this.list} tab='event-drawer'>查看日志</side-page-trigger>
          const aIcon = <a-icon type="exclamation-circle" class={ { 'ml-1 oc-pointer': true, 'warning-color': sysWarn, 'error-color': sysError } } />
          return <a-tooltip placement="right">
            <template slot="title">
              { titleCon }
            </template>
            { aIcon }
          </a-tooltip>
        }
      }
      return null
    }
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addBackup: true,
        formRules: [
          { required: true, message: i18n.t('compute.text_210') },
          // { validator: this.$validate('serverCreateName') },
        ],
        slotCallback: row => {
          return (
            <side-page-trigger onTrigger={ () => this.handleOpenSidepage(row) }>{ row.name }</side-page-trigger>
          )
        },
        cellWrapSlots: row => {
          return {
            append: () => {
              var ret = []
              if (row.is_baremetal) {
                ret.push(<a-tooltip title={i18n.t('compute.text_562')}><icon class='ml-2' type='res-host' style={{ color: '#1890ff' }} /></a-tooltip>)
              }
              if (row.isolated_device_count) {
                ret.push(<a-tooltip title={i18n.t('compute.text_113')}><icon class='ml-2' type='passthrough' /></a-tooltip>)
              }
              if (row.page_size_kb > 4) {
                ret.push(<a-tooltip title={i18n.t('compute.large_page_memory_tips')}><icon class='ml-2' type='large-page-memory' /></a-tooltip>)
              }
              return ret
            },
          }
        },
      }),
      getStatusTableColumn({
        statusModule: 'host',
        minWidth: 100,
        vm: this,
      }),
      getEnabledTableColumn(),
      getStatusTableColumn({
        field: 'host_status',
        title: i18n.t('compute.text_502'),
        statusModule: 'host_status',
        slotCallback: row => {
          return [
            <div class='d-flex align-items-center text-truncate'>
              <status status={ row.host_status } statusModule='host_status' />
              { getStatusToolTip(row) }
            </div>,
          ]
        },
      }),
      getTagTableColumn({
        onManager: this.onManager,
        resource: 'hosts',
        columns: () => this.columns,
        editCheck: (row) => (row.provider || '').toLowerCase() !== 'bingocloud',
      }),
      {
        field: 'custom_ip',
        title: 'IP',
        width: 200,
        showOverflow: 'ellipsis',
        slots: {
          default: ({ row }) => {
            const cellWrap = []
            if (row.access_ip) {
              cellWrap.push(
                <div class="d-flex">
                  <list-body-cell-wrap row={row} field="access_ip" copy><span class="text-color-help">{this.$t('compute.text_1319')}</span></list-body-cell-wrap>
                </div>,
              )
            }
            if (row.ipmi_ip) {
              cellWrap.push(
                <div class="d-flex">
                  <list-body-cell-wrap row={row} field="ipmi_ip" copy><span class="text-color-help">{this.$t('compute.text_1320')}</span></list-body-cell-wrap>
                </div>,
              )
            }
            if (row.public_ip) {
              cellWrap.push(
                <div class="d-flex">
                  <list-body-cell-wrap row={row} field="public_ip" copy><span class="text-color-help"> (EIP) </span></list-body-cell-wrap>
                </div>,
              )
            }
            return cellWrap
          },
        },
        formatter: ({ row }) => {
          const list = []
          if (row.access_ip) {
            list.push(`${row.access_ip}${this.$t('compute.text_1319')}`)
          }
          if (row.ipmi_ip) {
            list.push(`${row.ipmi_ip}${this.$t('compute.text_1320')}`)
          }
          return list.length ? list.join(',') : '-'
        },
      },
      {
        field: 'id',
        title: 'IPMI',
        width: 60,
        slots: {
          default: ({ cellValue, row }) => {
            if (!row.is_baremetal) {
              return '-'
            } else {
              return [<PasswordFetcher serverId={ row.id } resourceType='baremetals' />]
            }
          },
        },
      },
      {
        field: 'server_id',
        title: i18n.t('compute.text_566'),
        width: 70,
        slots: {
          default: ({ cellValue, row }) => {
            if (!row.is_baremetal) {
              return '-'
            } else {
              return [<PasswordFetcher serverId={ row.server_id } resourceType='servers' />]
            }
          },
        },
      },
      {
        field: 'nonsystem_guests',
        sortBy: 'order_by_server_count',
        title: '#VM',
        width: 60,
        sortable: true,
        slots: {
          default: ({ row }, h) => {
            if (this.isPreLoad && row.nonsystem_guests === undefined) return [<data-loading />]
            return `${row.nonsystem_guests}`
          },
        },
        formatter: ({ row }) => {
          return row.nonsystem_guests || '-'
        },
      },
      getOsArch({ field: 'cpu_architecture' }),
      {
        field: 'cpu_count',
        title: i18n.t('compute.text_563'),
        minWidth: 100,
        showOverflow: 'title',
        sortFields: ['cpu_count', ''],
        sortByList: ['', 'order_by_cpu_commit_rate'],
        slots: {
          default: ({ row }) => {
            if (this.isPreLoad && !row.cpu_commit_rate) return [<data-loading />]
            return row.cpu_count ? `${row.cpu_count}/${percentstr(row.cpu_commit_rate)}` : 'N/A'
          },
        },
        formatter: ({ row }) => {
          return row.cpu_count || '-'
        },
      },
      {
        field: 'mem_size',
        title: i18n.t('compute.text_564'),
        minWidth: 100,
        sortFields: ['mem_size', ''],
        sortByList: ['', 'order_by_mem_commit_rate'],
        slots: {
          default: ({ row }) => {
            if (this.isPreLoad && !row.mem_commit_rate) return [<data-loading />]
            return row.mem_size ? `${sizestr(row.mem_size, 'M', 1024)}/${percentstr(row.mem_commit_rate)}` : 'N/A'
          },
        },
        formatter: ({ row }) => {
          return row.mem_size ? sizestr(row.mem_size, 'M', 1024) : '-'
        },
      },
      {
        field: 'storage',
        title: i18n.t('compute.text_565'),
        minWidth: 80,
        sortByList: ['order_by_storage', 'order_by_storage_commit_rate'],
        slots: {
          default: ({ row }) => {
            if (this.isPreLoad && !row.storage) return [<data-loading />]
            return row.storage ? `${sizestr(row.storage, 'M', 1024)}/${percentstr(row.storage_commit_rate)}` : 'N/A'
          },
        },
        formatter: ({ row }) => {
          return row.mem_size ? sizestr(row.storage, 'M', 1024) : '-'
        },
      },
      {
        field: 'manufacture',
        title: i18n.t('compute.text_847'),
        width: 70,
        slots: {
          default: ({ row }) => {
            if (row.sys_info && row.sys_info.oem_name) {
              const oem_name = row.sys_info.oem_name.replaceAll(' ', '_')
              const icons = {
                dell: { height: '25px' },
                hp: { height: '25px' },
                hpe: { height: '30px' },
                inspur: { height: '50px' },
                lenovo: { height: '10px' },
                supermicro: { height: '30px' },
                huawei: { height: '30px' },
                red_hat: { height: '30px' },
                ieit_systems: { height: '30px' },
              }
              const arr = Object.keys(icons)
              if (!arr.includes(oem_name)) {
                return row.sys_info.oem_name
              }
              const imgSrc = require(`../../physicalmachine/assets/${oem_name}.svg`)
              return [
                <a-tooltip title={ row.sys_info.oem_name }>
                  <img src={ imgSrc } style={ icons[oem_name] } />
                </a-tooltip>,
              ]
            }
          },
        },
        formatter: ({ row }) => {
          if (row.sys_info && row.sys_info.oem_name) {
            return row.sys_info.oem_name
          }
          return '-'
        },
      },
      {
        field: 'model',
        title: this.$t('compute.text_580'),
        formatter: ({ cellValue, row }) => {
          return ((row.sys_info || {}).model) || '-'
        },
      },
      getCopyWithContentTableColumn({
        field: 'sn',
        title: this.$t('compute.text_591'),
      }),
      {
        field: 'host_type',
        title: this.$t('compute.host.host_type.title'),
        width: 80,
        formatter: ({ cellValue, row }) => {
          let ret = '-'
          if (row.host_type === 'container') {
            ret = this.$t('compute.host.host_type.container.title')
          } else if (row.host_type === 'kvm' || row.host_type === 'hypervisor') {
            ret = this.$t('compute.host.host_type.kvm.title')
          } else if (row.host_type === 'baremetal') {
            ret = this.$t('compute.host.host_type.baremetal.title')
          } else if (row.host_type) {
            ret = row.host_type
          }
          return ret
        },
      },
      {
        field: 'schedtag',
        title: i18n.t('compute.text_541'),
        width: 120,
        type: 'expand',
        slots: {
          content: ({ row }) => {
            const tags = _.sortBy(row.schedtags, ['default', 'name'])
            if (tags.length > 0) {
              return tags.map(tag => <a-tag class='mb-2' color='blue'>{tag.name}</a-tag>)
            }
            return [
              <div class='text-color-help'>{ this.$t('compute.text_1322') }</div>,
            ]
          },
        },
        formatter: ({ row }) => {
          const tags = _.sortBy(row.schedtags, ['default', 'name'])
          if (tags.length > 0) {
            return tags.map(tag => tag.name)
          }
          return this.$t('compute.text_1322')
        },
      },
      getBrandTableColumn(),
      getAccountTableColumn({ vm: this }),
      getPublicScopeTableColumn({ vm: this, resource: 'hosts' }),
      getProjectDomainTableColumn({ vm: this }),
      getRegionTableColumn({ vm: this }),
      getTimeTableColumn(),
    ]
  },
}
