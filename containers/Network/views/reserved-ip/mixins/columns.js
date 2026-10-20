import {
  getStatusTableColumn,
  getTimeTableColumn,
  getCopyWithContentTableColumn,
} from '@/utils/common/tableColumn'
import i18n from '@/locales'

export default {
  created () {
    this.columns = [
      getCopyWithContentTableColumn({
        field: 'ip_addr',
        title: i18n.t('network.text_213'),
        // ipv4 / ipv6 任一有值即可；走 tableColumn 内部归一化 h，避免 props 嵌套丢参
        message: row => row.ip6_addr || row.ip_addr || '-',
      }),
      getStatusTableColumn({ statusModule: 'reservedip' }),
      getCopyWithContentTableColumn({
        field: 'network',
        title: i18n.t('network.text_565'),
        // 侧栏已限定子网时隐藏
        hidden: () => !!(this.data && this.data.id),
      }),
      {
        field: 'notes',
        title: i18n.t('network.text_668'),
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            return [
              // Vue3：扁平传参，勿再包 props: { ... }
              h('list-body-cell-wrap', {
                formRules: [
                  { required: true, message: i18n.t('network.text_671') },
                ],
                row,
                edit: true,
                copy: true,
                onManager: this.onManager,
                field: 'notes',
              }),
            ]
          },
        },
      },
      getTimeTableColumn({ field: 'expired_at', title: this.$t('network.reserved_ip.expire.title'), fromNow: true }),
      getTimeTableColumn(),
    ]
  },
}
