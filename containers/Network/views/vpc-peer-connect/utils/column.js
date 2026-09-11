import i18n from '@/locales'

export const getVpcTableColumn = (vm) => {
  return {
    field: 'vpc',
    title: i18n.t('network.local_vpc'),
    minWidth: 120,
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, h) => {
        return [
          h('side-page-trigger', { props: { name: 'VpcSidePage', id: row.vpc_id, vm } }, row.vpc),
        ]
      },
    },
  }
}

export const getPeerVpcTableColumn = () => {
  return {
    field: 'peer_vpc_name',
    title: i18n.t('network.peer_vpc'),
    minWidth: 120,
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }) => {
        return row.peer_vpc_name || row.peer_vpc_id || row.ext_peer_vpc_id
      },
    },
  }
}

export const getExtPeerAccountTableColumn = () => {
  return {
    field: 'ext_peer_account_id',
    title: i18n.t('network.peer_account'),
    minWidth: 120,
    showOverflow: 'title',
    slots: {
      default: ({ row }, h) => {
        const text = !row.peer_vpc_name ? `${row.peer_account_id || row.ext_peer_account_id}(${i18n.t('network.cross_account')})` : i18n.t('network.same_account')
        return [
          h('list-body-cell-wrap', {
            props: { copy: true, field: 'ext_peer_account_id', row, hideField: 'true', message: text },
          }, text),
        ]
      },
    },
  }
}
