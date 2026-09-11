import i18n from '@/locales'

export const getResourceMatchProjectTableColumn = () => {
  return {
    field: 'resource_tenant',
    title: i18n.t('cloudenv.text_356', [i18n.t('dictionary.project')]),
    minWidth: 120,
    showOverflow: 'title',
    slots: {
      default: ({ row }, h) => {
        const ret = []
        ret.push(h('list-body-cell-wrap', {
          props: {
            copy: true,
            field: 'tenant',
            row,
          },
        }))
        if (row.project_mapping) {
          let label = ''
          if (row.enable_resource_sync) {
            label = i18n.t('cloudenv.resource_project_mapping')
          } else if (row.enable_project_sync) {
            label = i18n.t('cloudenv.project_project_mapping')
          }
          ret.push(
            h('list-body-cell-wrap', {
              props: {
                copy: true,
                field: 'project_mapping',
                row,
                hideField: true,
              },
            }, [
              h('span', { class: 'text-color-secondary' }, `${label || i18n.t('cloudenv.text_580')}：${row.project_mapping}`),
            ]),
          )
        }
        return ret
      },
    },
    formatter: ({ row }) => {
      const ret = []
      ret.push(row.tenant)
      if (row.project_mapping) {
        let label = ''
        if (row.enable_resource_sync) {
          label = i18n.t('cloudenv.resource_project_mapping')
        } else if (row.enable_project_sync) {
          label = i18n.t('cloudenv.project_project_mapping')
        }
        ret.push(`${label || i18n.t('cloudenv.text_580')}：${row.project_mapping}`)
      }
      return ret
    },
  }
}
