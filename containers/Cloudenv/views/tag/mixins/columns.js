import i18n from '@/locales'
export default {
  created () {
    this.columns = [
      {
        field: 'key',
        title: i18n.t('cloudenv.text_473'),
        showOverflow: 'ellipsis',
        minWidth: 100,
        slots: {
          default: ({ row }, h) => {
            let trigger
            if (this.$options.name !== 'TagList') {
              trigger = h('span', {}, row.name)
            } else {
              trigger = h('a', { on: { click: () => this.handleOpenSidepage(row) } }, row.name)
            }
            return [
              h('list-body-cell-wrap', {
                props: { copy: true, field: 'name', row, hideField: true },
              }, [trigger]),
            ]
          },
        },
      },
      {
        field: 'count',
        title: i18n.t('cloudenv.text_474'),
        minWidth: 60,
        formatter: ({ row }) => {
          return `${row.count || 0}`
        },
      },
      {
        field: 'color',
        title: i18n.t('cloudenv.text_475'),
        width: 60,
        slots: {
          default: ({ row }, h) => {
            const hFn = h || this.$createElement
            return [hFn('span', {
              style: {
                display: 'inline-block',
                backgroundColor: row.color,
                width: '10px',
                height: '10px',
              },
            })]
          },
        },
      },
    ]
  },
}
