import * as R from 'ramda'
import _ from 'lodash'
import i18n from '@/locales'

const commonColumns = [
  {
    field: 'key',
    title: 'Key',
    minWidth: 200,
    showOverflow: 'ellipsis',
  },
  {
    field: 'label',
    title: 'Label',
    width: 200,
  },
]

const taintsColumns = [
  {
    field: 'key',
    title: 'Key',
    minWidth: 200,
    showOverflow: 'ellipsis',
  },
  {
    field: 'effect',
    title: 'Effect',
    width: 200,
  },
]

export const operatingSystemColumn = () => {
  return {
    title: i18n.t('k8s.text_141'),
    field: 'operatingSystem',
    slots: {
      default: ({ row }, h) => {
        const data = row.labels ? Object.entries(row.labels).map(val => ({ key: val[0], label: val[1] })).filter(val => !val.key.toLowerCase().includes('id')) : []
        return [
          h('table-lite-grid', {
            class: 'mb-2',
            props: {
              data,
              columns: commonColumns,
            },
          }),
        ]
      },
    },
  }
}

export const annotateColumn = () => {
  return {
    title: i18n.t('k8s.text_142'),
    field: 'annotate',
    slots: {
      default: ({ row }, h) => {
        const data = row.annotations ? Object.entries(row.annotations).map(val => ({ key: val[0], label: val[1] })) : []
        return [
          h('table-lite-grid', {
            class: 'mb-2',
            props: {
              data,
              columns: commonColumns,
            },
          }),
        ]
      },
    },
  }
}

export const tagColumn = () => {
  return {
    title: i18n.t('k8s.text_82'),
    field: 'tag',
    slots: {
      default: ({ row }, h) => {
        const data = row.labels ? Object.entries(row.labels).map(val => ({ key: val[0], label: val[1] })) : []
        return [
          h('table-lite-grid', {
            class: 'mb-2',
            props: {
              data,
              columns: commonColumns,
            },
          }),
        ]
      },
    },
  }
}

export const taintColumn = () => {
  return {
    title: 'Taints',
    field: 'taints',
    slots: {
      default: ({ row }, h) => {
        const data = row.taints || []
        return [
          h('table-lite-grid', {
            class: 'mb-2',
            props: {
              data,
              columns: taintsColumns,
            },
          }),
        ]
      },
    },
  }
}

export const roleRefColumn = (path = 'roleRef') => {
  return {
    field: 'roleRef',
    title: 'roleRef',
    slots: {
      default: ({ row }, h) => {
        const roleRef = _.get(row, path)
        if (!R.is(Object, roleRef)) return '-'
        const items = Object.keys(roleRef).map(key => {
          return h('div', { class: 'd-flex' }, [
            h('div', { style: { width: '80px' } }, key + '：'),
            h('div', {}, roleRef[key]),
          ])
        })
        return items
      },
    },
  }
}

export const subjectsColumn = (path = 'subjects') => {
  return {
    field: 'subjects',
    title: 'subjects',
    slots: {
      default: ({ row }, h) => {
        const subjects = _.get(row, path)
        if (!subjects) return '-'
        const columns = Object.keys(subjects[0]).filter(key => key !== '_XID').map(key => ({ field: key, title: key }))
        return h('table-lite-grid', { props: { data: subjects, columns, size: 'mini' } })
      },
    },
  }
}
