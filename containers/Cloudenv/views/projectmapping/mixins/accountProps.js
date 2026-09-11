import {
  getNameDescriptionTableColumn,
  getProjectDomainTableColumn,
  getBrandTableColumn,
} from '@/utils/common/tableColumn'
import {
  getNameFilter,
  getBrandFilter,
} from '@/utils/common/tableFilter'
import { getAccessUrlTableColumn } from '../utils/columns'

export default {
  data () {
    return {}
  },
  computed: {
    accountsProps () {
      return {
        list: this.$list.createList(this, {
          resource: 'cloudaccounts',
          getParams: this.params,
          filterOptions: {
            name: getNameFilter(),
            brand: getBrandFilter(),
          },
        }),
        columns: [
          getNameDescriptionTableColumn({
            onManager: this.onManager,
            hideField: true,
            slotCallback: row => {
              const h = this.$createElement
              return h('side-page-trigger', {
                on: {
                  trigger: () => this.handleOpenSidepage(row),
                },
              }, row.name)
            },
          }),
          getAccessUrlTableColumn(),
          getBrandTableColumn(),
          getProjectDomainTableColumn(),
          {
            field: 'tenant',
            title: this.$t('scope.text_573', [this.$t('dictionary.project')]),
            minWidth: 120,
            showOverflow: 'title',
            slots: {
              default: ({ row }) => {
                const h = this.$createElement
                const ret = []
                if (row.auto_create_project) {
                  ret.push(h('span', { class: 'mr-2' }, this.$t('cloudenv.text_493')))
                  ret.push(h('help-tooltip', {
                    props: {
                      name: 'cloudaccountAutoCreateProject',
                    },
                  }))
                } else {
                  ret.push(h('list-body-cell-wrap', {
                    props: {
                      copy: true,
                      field: 'tenant',
                      row,
                    },
                  }))
                }
                if (row.project_mapping) {
                  ret.push(h('list-body-cell-wrap', {
                    props: {
                      copy: true,
                      field: 'project_mapping',
                      row,
                      hideField: true,
                    },
                  }, `${this.$t('cloudenv.text_580')}：${row.project_mapping}`))
                }
                return ret
              },
            },
          },
        ],
      }
    },
  },
}
