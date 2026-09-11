import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
  getOsArch,
} from '@/utils/common/tableColumn'

import {
  getBackupStorageNameTableColumn,
  getGuestTableColumn,
  getOsTypeTableColumn,
  getSizeMbTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addEncrypt: true,
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'instanceBackup', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'instancebackups', columns: () => this.columns }),
      getBackupStorageNameTableColumn(),
      getSizeMbTableColumn(),
      getGuestTableColumn(),
      getOsArch(),
      getOsTypeTableColumn(),
      getBrandTableColumn(),
      getTimeTableColumn(),
      getProjectTableColumn(),
    ]
  },
}
