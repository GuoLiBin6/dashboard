import {
  getNameDescriptionTableColumn,
  getStatusTableColumn,
} from '@/utils/common/tableColumn'
import {
  getImageTableColumn,
  getContainerImageTableColumn,
  getEnvTableColumn,
  getCommandTableColumn,
  getArgsTableColumn,
  getCapabilitiesTableColumn,
  getLxcfsTableColumn,
  getOverlayTableColumn,
} from '../utils/columns'

export default {
  created () {
    this.columns = [
      getNameDescriptionTableColumn({
        onManager: this.onManager,
        hideField: true,
        edit: false,
        editDesc: false,
        formRules: [
          { required: true, message: this.$t('compute.text_210') },
        ],
        statusModule: 'container',
        slotCallback: (row, h) => {
          return h('side-page-trigger', {
            on: {
              trigger: () => this.handleOpenSidepage(row),
            },
          }, row.name)
        },
      }),
      getStatusTableColumn({ statusModule: 'container' }),
      getContainerImageTableColumn({ vm: this }),
      getImageTableColumn(),
      getEnvTableColumn(),
      getCommandTableColumn(),
      getArgsTableColumn(),
      getCapabilitiesTableColumn(),
      getLxcfsTableColumn(),
      getOverlayTableColumn(),
    ]
  },
}
