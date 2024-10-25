import i18n from '@/locales'
import { isCE } from '@/utils/utils'

export default {
  created () {
    this.singleActions = [
      {
        label: i18n.t('common_491'),
        action: (obj) => {
          this.handleOpenSidepage(obj, 'project-directly-under-user-list')
        },
        meta: (obj) => ({
          validate: obj.can_update,
        }),
      },
      {
        label: i18n.t('system.text_153'),
        actions: obj => {
          return [
            {
              label: i18n.t('system.text_172'),
              action: (obj) => {
                this.sidePageTriggerHandle(this, 'ProjectSidePage', {
                  id: obj.id,
                  resource: 'projects',
                  apiVersion: 'v1',
                }, { tab: 'quota' })
              },
              meta: (obj) => ({
                validate: true,
              }),
              hidden: () => {
                return !this.globalConfig.enable_quota_check || isCE() || this.$store.getters.isSysCE
              },
            },
            {
              label: i18n.t('iam.set_project_admin'),
              permission: 'projects_perform_set_admin',
              action: () => {
                this.createDialog('ProjectSetAdminDialog', {
                  vm: this,
                  title: i18n.t('iam.set_project_admin'),
                  name: i18n.t('system.text_9'),
                  data: [obj],
                  columns: this.columns,
                  onManager: this.onManager,
                })
              },
            },
            {
              label: i18n.t('system.text_129'),
              permission: 'projects_delete',
              action: () => {
                this.createDialog('DeleteResDialog', {
                  vm: this,
                  title: i18n.t('system.text_129'),
                  name: i18n.t('system.text_9'),
                  data: [obj],
                  columns: this.columns,
                  onManager: this.onManager,
                  refresh: this.refresh,
                  success: () => {
                    this.destroySidePages()
                  },
                })
              },
              meta: () => this.$getDeleteResult(obj),
            },
          ]
        },
      },
    ]
  },
}
