import * as R from 'ramda'
import _ from 'lodash'
import i18n from '@/locales'

export const k8sStatusColumn = ({ path = 'podsInfo.warnings', statusModule = 'k8s_resource' } = {}) => {
  return {
    field: 'status',
    title: i18n.t('k8s.text_35'),
    width: 100,
    slots: {
      default: ({ row }, h) => {
        const warnings = (_.get(row, path) || []).map(v => v.message)
        let warnTooltip = null
        if (warnings && warnings.length) {
          const titleContent = h('div', {}, warnings.map(val => h('div', {}, [' ', val, ' '])))
          warnTooltip = h('a-tooltip', {
            props: { placement: 'top', title: titleContent },
          }, [
            h('div', { class: 'text-truncate' }, [
              h('icon', { props: { type: 'bulb', theme: 'twoTone', twoToneColor: '#f5222d' }, class: 'mr-2' }),
              h('span', {}, i18n.t('k8s.text_402')),
            ]),
          ])
        }
        return [
          h('div', { class: 'text-truncate' }, [
            h('status', { props: { status: row.status, statusModule } }, [warnTooltip]),
          ]),
        ]
      },
    },
  }
}

export const k8sLabelColumn = ({ field = 'labels', title = i18n.t('k8s.text_82') } = {}) => {
  return {
    field,
    title,
    minWidth: 200,
    slots: {
      default: ({ row }, h) => {
        if (!row[field] || !R.is(Object, row[field])) return '-'
        const colors = ['pink', 'orange', 'green', 'cyan', 'blue', 'purple', 'red']
        const labels = Object.entries(row[field]).map(arr => ({ key: arr[0], value: arr[1] }))
        return [
          h('div', {}, labels.map((val, i) => {
            return h('div', { class: 'mb-1' }, [
              h('a-tag', { class: 'd-block text-truncate', props: { color: colors[i % colors.length] } }, `${val.key}：${val.value}`),
            ])
          })),
        ]
      },
    },
  }
}

export const k8sImageColumn = ({ field = 'containerImages', title = i18n.t('k8s.text_42'), itemField = 'image' } = {}) => {
  return {
    field,
    title,
    minWidth: 200,
    slots: {
      default: ({ row }, h) => {
        if (!row[field] || !row[field].length) return '-'
        // vxe-cell 为 flex，子项需 min-width:0 才能按列宽截断，否则长镜像地址会溢出叠到相邻列
        return [
          h('div', { style: { minWidth: 0, width: '100%', overflow: 'hidden' } }, row[field].map(v => {
            const text = `${v.name}: ${v[itemField]}`
            return h('a-tooltip', { props: { title: text } }, [
              h('div', { class: 'text-truncate mb-1' }, [
                h('a-tag', { class: 'd-block text-truncate', style: { maxWidth: '100%' } }, text),
              ]),
            ])
          })),
        ]
      },
    },
  }
}

export const k8sEnvColumn = ({ field = 'env', title = i18n.t('k8s.text_111') } = {}) => {
  return {
    field,
    title,
    slots: {
      default: ({ row }, h) => {
        if (!row[field] || !R.is(Array, row[field])) return '-'
        return [
          h('div', {}, row[field].map((val) => {
            const text = `${val.name}：${val.value || '-'}`
            return h('a-tooltip', { props: { title: text } }, [
              h('div', { class: 'mb-1', attrs: { title: text } }, [
                h('a-tag', { class: 'd-block text-truncate' }, text),
              ]),
            ])
          })),
        ]
      },
    },
  }
}

export const federatedResClusterCountColumn = () => ({
  field: 'cluster_count',
  title: i18n.t('k8s.text_403'),
  minWidth: 100,
  formatter: ({ row }) => `${row.cluster_count}` || '-',
})

export const federatednamespaceColumn = () => ({
  field: 'federatednamespace',
  title: i18n.t('dictionary.federatednamespaces'),
  formatter: ({ row }) => row.federatednamespace || '-',
})
