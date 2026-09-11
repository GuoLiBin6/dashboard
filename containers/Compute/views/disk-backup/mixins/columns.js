import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
  getTagTableColumn,
  getTimeTableColumn,
  getProjectTableColumn,
  getBrandTableColumn,
} from '@/utils/common/tableColumn'

import {
  getSizeMbTableColumn,
  getDiskTypeTableColumn,
  getDiskNameTableColumn,
  getDiskSizeTableColumn,
  getBackupStorageNameTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        addEncrypt: true,
        slotCallback: (row, h) => {
          const hFn = h || this.$createElement
          return hFn('side-page-trigger', {
            on: { trigger: () => this.handleOpenSidepage(row) },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'diskBackup', vm: this }),
      getTagTableColumn({ onManager: this.onManager, resource: 'diskbackups', columns: () => this.columns }),
      getDiskTypeTableColumn(),
      getDiskNameTableColumn(),
      getDiskSizeTableColumn(),
      getBackupStorageNameTableColumn(),
      getSizeMbTableColumn(),
      getBrandTableColumn(),
      getTimeTableColumn(),
      getProjectTableColumn(),
    ]
  },
}
