import i18n from '@/locales'
import { sizestr } from '@/utils/utils'

export const getStorageTypeColumn = () => {
  return {
    field: 'storage_type',
    title: i18n.t('storage.text_38'),
    slots: {
      default: ({ row }) => {
        if (row.storage_type === 'object') {
          return i18n.t('storage.object_storage')
        }
        return row.storage_type.toUpperCase()
      },
    },
  }
}

export const getCapacityMbColumns = () => {
  return {
    field: 'capacity_mb',
    title: i18n.t('storage.capacity'),
    slots: {
      default: ({ row }) => {
        return sizestr(row.capacity_mb, 'M', 1024) || '-'
      },
    },
  }
}

export const getProjectDomainTableColumns = () => {
  return {
    field: 'project_domain',
    title: i18n.t('common.attribution_scope'),
    slots: {
      default: ({ row }, h) => {
        const ret = []
        const domain = row.project_domain
        if (domain) {
          ret.push(
            h('list-body-cell-wrap', {
              props: { hideField: true, copy: true, field: 'domain', row: { domain } },
            }, [
              h('span', {}, domain),
            ]),
          )
        }
        return ret
      },
    },
  }
}

export const getNFSHostColumn = () => {
  return {
    field: 'nfs_host',
    title: 'NFS Host',
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              field: 'nfs_host',
              row,
            },
          }),
        ]
      },
    },
  }
}

export const getNFSSharedDirColumn = () => {
  return {
    field: 'nfs_shared_dir',
    title: 'NFS Shared Dir',
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              field: 'nfs_shared_dir',
              row,
            },
          }),
        ]
      },
    },
  }
}

export const getObjectBucketURLColumn = () => {
  return {
    field: 'object_bucket_url',
    title: 'Bucket URL',
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              field: 'object_bucket_url',
              row,
            },
          }),
        ]
      },
    },
  }
}

export const getObjectBucketURLExtColumn = () => {
  return {
    field: 'object_bucket_url_ext',
    title: 'Public Bucket URL',
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              field: 'object_bucket_url_ext',
              row,
            },
          }),
        ]
      },
    },
  }
}

export const getObjectAccessKeyColumn = () => {
  return {
    field: 'object_access_key',
    title: 'Object Access Key',
    slots: {
      default: ({ row }, h) => {
        return [
          h('list-body-cell-wrap', {
            props: {
              copy: true,
              field: 'object_access_key',
              row,
            },
          }),
        ]
      },
    },
  }
}

export const getObjectSignVerColumn = () => {
  return {
    field: 'object_sign_ver',
    title: 'Signing Version',
    slots: {
      default: ({ row }) => {
        if (row.object_sign_ver) {
          return row.object_sign_ver
        } else {
          return i18n.t('common_712')
        }
      },
    },
  }
}
