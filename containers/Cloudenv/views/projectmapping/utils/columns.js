import i18n from '@/locales'

export const getAccessUrlTableColumn = () => {
  return {
    field: 'access_url',
    title: i18n.t('cloudenv.text_96'),
    minWidth: 100,
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, h) => {
        if (!row.access_url) return '-'
        let txt
        Object.keys(i18n.t('cloudAccountAccessType')).forEach(k => {
          if (row.access_url.indexOf(k) > -1) {
            let _k = k
            if (row.brand !== 'Aliyun' && k === 'InternationalCloud') {
              _k = 'Internation'
            }
            txt = i18n.t('cloudAccountAccessType')[_k]
          }
        })
        return txt ||
        [
          h('a', { class: 'link-color', attrs: { target: '_blank', href: row.access_url } }, row.access_url),
        ]
      },
    },
  }
}

export const getAccountTableColumn = () => {
  return {
    field: 'account',
    title: i18n.t('cloudenv.text_353'),
    showOverflow: 'ellipsis',
    minWidth: 160,
    slots: {
      default: ({ row }, h) => {
        const subscribeIds = (row.account && row.account.split('/')) || []
        const text = subscribeIds.length > 1 ? subscribeIds[1] : subscribeIds[0]
        return [
          h('list-body-cell-wrap', {
            props: {
              message: text,
              copy: true,
              hideField: true,
            },
          }, [
            h('span', text),
          ]),
        ]
      },
    },
  }
}
