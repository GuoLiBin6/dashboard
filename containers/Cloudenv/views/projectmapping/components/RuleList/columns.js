import i18n from '@/locales'
import { getTagColor, getTagTitle } from '@/utils/common/tag'
import Actions from '@/components/PageList/Actions'

const getRuleCondition = (data) => {
  const { condition } = data
  if (condition === 'or') {
    return i18n.t('cloudenv.text_587')
  } else if (data.hasOwnProperty('project_id')) {
    return i18n.t('cloudenv.text_588')
  } else {
    return i18n.t('cloudenv.match_by_tag_key')
  }
}

const getResourceRuleTableColumn = ({
  field = 'name',
  title = i18n.t('cloudenv.text_582'),
} = {}) => {
  return {
    field,
    title,
    slots: {
      default: ({ row }, h) => {
        const hFn = h || this.$createElement
        const tags = (row.tags || []).map(item => {
          const rgb = getTagColor(item.key, item.value, 'rgb')
          const strRgb = rgb.join(',')
          return hFn('span', {
            class: 'tag mb-1 text-truncate d-inline-block',
            attrs: { title: getTagTitle(item.key, item.value) },
            key: `${item.key}${item.value}`,
            style: {
              backgroundColor: `rgba(${strRgb},.1)`,
              boxSizing: 'border-box',
              color: `rgb(${strRgb})`,
              border: `solid 1px rgb(${strRgb})`,
              padding: '0 5px',
              marginRight: '10px',
            },
          }, getTagTitle('user:' + item.key, item.value))
        })
        return [
          hFn('div', {}, getRuleCondition(row)),
          hFn('div', {}, tags),
        ]
      },
      header: ({ column }, h) => {
        const hFn = h || this.$createElement
        return [hFn('span', {}, title)]
      },
    },
  }
}
export default {
  data () {
    return {
      checkColumn: {
        type: 'checkbox',
        width: 40,
        showHeaderOverflow: false,
        resizable: false,
      },
      normalColmns: [
        getResourceRuleTableColumn(),
        {
          title: i18n.t('cloudenv.text_584'),
          field: 'accounts',
          slots: {
            default: ({ row }, h) => {
              if (row.condition === 'and' && !row.hasOwnProperty('project_id') && !row.hasOwnProperty('project')) {
                return i18n.t('cloudenv.project_same_as_tag_value')
              }
              let project = row.project
              if (project) {
                if (row.project_id) {
                  project += ` (${this.$t('cloudenv.target_project')})`
                } else {
                  project += ` (${this.$t('cloudenv.target_name')})`
                }
              }
              return [
                h('span', { class: 'text-color-secondary' }, project || '-'),
              ]
            },
          },
        },
        {
          field: '_action',
          title: this.$t('table.title._action'),
          minWidth: 120,
          resizable: false,
          slots: {
            default: ({ row }, h) => {
              return [
                this.$createElement(Actions, {
                  props: {
                    options: this.singleActions,
                    row,
                    buttonType: 'link',
                    buttonSize: 'small',
                    buttonStyle: {
                      fontSize: '14px',
                    },
                  },
                }),
              ]
            },
            header: ({ column }, h) => {
              return [
                this.$createElement('span', {
                  style: {
                    paddingLeft: '7px',
                  },
                }, this.$t('table.title._action')),
              ]
            },
          },
        },
      ],
      dragColumn: {
        width: 1,
        slots: {
          default: (params, h) => {
            const hFn = h || this.$createElement
            if (!this.canSort) return []
            return [
              hFn('span', { class: 'drag-btn' }, [
                hFn('a-icon', { props: { type: 'menu' } }),
              ]),
            ]
          },
          header: (params, h) => {
            const hFn = h || this.$createElement
            if (!this.canSort) return []
            return [
              hFn('a-tooltip', {
                props: {
                  title: i18n.t('cloudenv.text_591'),
                },
              }, [
                hFn('a-icon', {
                  props: { type: 'question-circle' },
                  on: { click: () => { this.showHelpTip2 = !this.showHelpTip2 } },
                }),
              ]),
            ]
          },
        },
      },
    }
  },
  created () {
    this.singleActions = [
      {
        label: i18n.t('cloudenv.text_593'),
        permission: 'projectmappings_update',
        action: (row) => {
          this.createDialog('ProjectMappingRuleEditDialog', {
            id: this.data.id,
            rules: this.data.rules || [],
            editType: 'edit',
            data: [row],
            columns: this.columns,
            title: i18n.t('cloudenv.text_598'),
            success: (res) => {
              this.$bus.$emit('ProjectMappingRuleUpdate', res)
            },
          })
        },
        meta: () => {
          const ret = {
            validate: true,
          }
          if (!(this.isAdminMode || this.data.domain_id === this.userInfo.projectDomainId)) {
            ret.validate = false
            ret.tooltip = this.$t('cloudenv.text_597')
          }
          return ret
        },
      },
      {
        label: i18n.t('cloudenv.text_108'),
        permission: 'projectmappings_delete',
        action: (row) => {
          this.createDialog('DeleteResDialog', {
            name: this.$t('cloudenv.text_582'),
            vm: this,
            data: [row],
            columns: [this.normalColmns[0], this.normalColmns[1]],
            title: this.$t('table.action.delete'),
            ok: () => {
              this.checkedRecords = [row]
              this.deleteProjectMappingRules()
            },
          })
        },
        meta: (row) => {
          const ret = {
            validate: true,
          }
          if (!(this.isAdminMode || this.data.domain_id === this.userInfo.projectDomainId)) {
            ret.validate = false
            ret.tooltip = this.$t('cloudenv.text_597')
          }
          if (this.data && this.data.rules.length <= 1) {
            ret.validate = false
          }
          return ret
        },
      },
    ]
  },
  computed: {
    columns: function () {
      if (this.canSort) {
        this.dragColumn.width = 60
      } else {
        this.dragColumn.width = 1
      }
      return [this.checkColumn, this.dragColumn, ...this.normalColmns]
    },
  },
  methods: {
    getRuleCondition (data) {
      const { condition } = data
      if (condition === 'or') {
        return i18n.t('cloudenv.text_587')
      } else if (data.hasOwnProperty('project_id')) {
        return i18n.t('cloudenv.text_588')
      } else {
        return i18n.t('cloudenv.match_by_tag_key')
      }
    },
  },
}
