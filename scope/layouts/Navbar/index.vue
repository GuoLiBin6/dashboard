<template>
  <div class="navbar-wrap d-flex align-items-center" @click.stop.prevent="handleCloseSidebar">
    <div class="navbar-left d-flex align-items-center flex-fill">
      <template v-if="authInfoLoaded">
        <a-tooltip :title="$t('navbar.button.menu')" placement="bottom">
          <div class="navbar-icon-btn global-map-btn" @click.stop.prevent="handleToggleSidebar">
            <icon type="menu" />
          </div>
        </a-tooltip>
      </template>
      <template v-else>
        <div class="navbar-icon-btn is-disabled">
          <icon type="menu" />
        </div>
      </template>

      <div class="navbar-brand d-flex align-items-center">
        <div class="header-logo">
          <img class="logo" :src="logo" />
        </div>
        <h1 class="header-title">{{ $t('common_210') }}</h1>
      </div>

      <div class="navbar-divider" aria-hidden="true" />

      <div class="navbar-nav d-flex align-items-center">
        <!-- 视图选择 -->
        <div class="navbar-item" v-if="showViewSelection">
          <a-dropdown
            :trigger="['click']"
            :open="viewChangePopoverVisible"
            :destroyPopupOnHide="false"
            :getPopupContainer="triggerNode => triggerNode.parentNode"
            @update:open="onViewDropdownOpenChange">
            <div class="navbar-chip">
              <icon type="navbar-view-switch" class="chip-icon" />
              <span class="chip-label text-truncate" :title="viewLabel">{{ viewLabel }}</span>
              <icon type="caret-down" class="chip-caret" />
            </div>
            <template #overlay>
              <div class="view-dropdown-overlay" @click.stop>
                <ul class="list-unstyled view-list-wrap">
                  <!-- 管理后台 -->
                  <template v-if="systemProjects && systemProjects.length">
                    <li v-if="systemProjects.length === 1" class="item-link" @click="() => projectChange(systemProjects[0].id, 'system')">
                      <div class="d-flex h-100 align-items-center">
                        <div class="flex-fill text-truncate">{{ $t('navbar.view.system_manager') }}</div>
                        <div style="width: 20px;" class="ml-1">
                          <check-circle-outlined v-show="isViewSelected(systemProjects[0].id, 'system')" class="navbar-check-icon" />
                        </div>
                      </div>
                    </li>
                    <li v-else>
                      <div class="item-section-title">{{ $t('navbar.view.system_manager') }}</div>
                      <ul class="list-unstyled">
                        <template v-for="item of systemProjects" :key="item.id">
                          <li class="item-link" @click="() => projectChange(item.id, 'system')">
                            <div class="d-flex h-100 align-items-center">
                              <div class="flex-fill text-truncate">{{ item.name }}({{ item.domain }})</div>
                              <div style="width: 20px;" class="ml-1">
                                <check-circle-outlined v-show="isViewSelected(item.id, 'system')" class="navbar-check-icon" />
                              </div>
                            </div>
                          </li>
                        </template>
                      </ul>
                    </li>
                  </template>
                  <!-- 域管理后台 -->
                  <template v-if="domainProjects && domainProjects.length">
                    <li>
                      <div class="item-section-title">{{$t('navbar.view.domain_manager')}}</div>
                      <ul class="list-unstyled">
                        <template v-for="item of domainProjects" :key="item.id">
                          <li class="item-link" @click="() => projectChange(item.id, 'domain')">
                            <div class="d-flex h-100 align-items-center">
                              <div class="flex-fill text-truncate" v-if="isSingleProject(domainProjects, item)">{{ item.domain }}</div>
                              <div class="flex-fill text-truncate" v-else>{{ item.domain }}({{ item.name }})</div>
                              <div style="width: 20px;" class="ml-1">
                                <check-circle-outlined v-show="isViewSelected(item.id, 'domain')" class="navbar-check-icon" />
                              </div>
                            </div>
                          </li>
                        </template>
                      </ul>
                    </li>
                  </template>
                  <!-- 项目 -->
                  <template v-if="projects && projects.length">
                    <li>
                      <div class="item-section-title">{{$t('navbar.view.project')}}</div>
                      <ul class="list-unstyled">
                        <template v-for="item of projects" :key="item.id">
                          <li class="item-link" @click="() => projectChange(item.id, 'project')">
                            <div class="d-flex h-100 align-items-center">
                              <div class="flex-fill text-truncate">{{ item.name }}</div>
                              <div style="width: 20px;" class="ml-1">
                                <check-circle-outlined v-show="isViewSelected(item.id, 'project')" class="navbar-check-icon" />
                              </div>
                            </div>
                          </li>
                        </template>
                      </ul>
                    </li>
                  </template>
                </ul>
              </div>
            </template>
          </a-dropdown>
        </div>
        <!-- 系统选择 -->
        <div class="navbar-item" v-if="products">
          <a-dropdown :trigger="['click']">
            <div class="navbar-chip">
              <icon type="navbar-setting" class="chip-icon" />
              <span class="chip-label">{{$t('dictionary.endpoint')}}</span>
              <icon type="caret-down" class="chip-caret" />
            </div>
            <template #overlay>
              <a-menu @click="productChange">
                <a-menu-item v-for="item of products" :key="item.key">{{ item.label }}</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </div>
    <div class="navbar-right d-flex align-items-center flex-shrink-0">
      <!-- 资源报警 -->
      <alertresource v-if="showAlertresource && showMenuMap.alert" :res_total="alertresource.total" class="navbar-item-icon primary-color-hover" />
      <!-- 消息中心 -->
      <notify-popover class="navbar-item-icon primary-color-hover" :notifyMenuTitleUsedText="notifyMenuTitleUsedText" v-if="showNotify && showMenuMap.notification" />
      <!-- cloudshell -->
      <cloud-shell v-if="isAdminMode && showMenuMap.cloudshell" class="navbar-item-icon primary-color-hover" />
      <!-- 更多 -->
      <more-popover class="navbar-item-icon primary-color-hover" :showMenuMap="{more: true, docs: true, about: true}" />
      <div class="navbar-item navbar-user">
        <a-dropdown
          :trigger="['click']"
          placement="bottomRight"
          overlayClassName="navbar-user-dropdown"
          :getPopupContainer="getNavbarPopupContainer">
          <div class="navbar-chip is-user">
            <a-avatar :size="32" class="user-avatar">{{ firstNameWord }}</a-avatar>
            <span class="user-name text-truncate">{{ username }}</span>
          </div>
          <template #overlay>
            <a-menu class="navbar-user-menu" @click="userMenuClick">
              <a-sub-menu
                v-if="!supportLanguages.length || (supportLanguages.length > 1 && showMenuMap.language)"
                key="language"
                popupClassName="navbar-lang-submenu">
                <template #title>
                  <span class="navbar-user-menu-item">
                    <global-outlined />
                    <span>{{$t('common_630')}}</span>
                  </span>
                </template>
                <a-menu-item v-if="!supportLanguages.length || supportLanguages.includes('zh-CN')" key="3" @click="settingLanguageCH">
                  <div class="lang-item">
                    <span class="lang-item__label">简体中文</span>
                    <check-circle-outlined v-show="language === 'zh-CN'" class="lang-item__check" />
                  </div>
                </a-menu-item>
                <a-menu-item v-if="!supportLanguages.length || supportLanguages.includes('en')" key="4" @click="settingLanguageEN">
                  <div class="lang-item">
                    <span class="lang-item__label">English</span>
                    <check-circle-outlined v-show="language === 'en'" class="lang-item__check" />
                  </div>
                </a-menu-item>
                <a-menu-item v-if="!supportLanguages.length || supportLanguages.includes('ja-JP')" key="5" @click="settingLanguageJP">
                  <div class="lang-item">
                    <span class="lang-item__label">日本語</span>
                    <check-circle-outlined v-show="language === 'ja-JP'" class="lang-item__check" />
                  </div>
                </a-menu-item>
              </a-sub-menu>
              <a-menu-item key="toClouduser" v-if="showClouduser && showMenuMap.clouduser">
                <span class="navbar-user-menu-item">
                  <cloud-upload-outlined />
                  <span>{{ $t('scope.cloudid') }}</span>
                </span>
              </a-menu-item>
              <a-menu-item key="toCredentials" v-if="showMenuMap.credential">
                <span class="navbar-user-menu-item">
                  <icon class="mr-2" type="access-credentials" />
                  <span>{{ $t('common_631') }}</span>
                </span>
              </a-menu-item>
              <a-menu-item key="handleUpdatePassword" v-if="showMenuMap['change-password']">
                <span class="navbar-user-menu-item">
                  <lock-outlined />
                  <span>{{ $t('scope.text_5') }}</span>
                </span>
              </a-menu-item>
              <a-menu-item key="logout">
                <span class="navbar-user-menu-item">
                  <logout-outlined />
                  <span>{{ $t('scope.text_6') }}</span>
                </span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import get from 'lodash/get'
import * as R from 'ramda'
import { mapGetters, mapState } from 'vuex'
import {
  GlobalOutlined,
  CloudUploadOutlined,
  LockOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue'
import storage from '@/utils/storage'
import Alertresource from '@/sections/Navbar/components/Alertresource'
import { setLanguage } from '@/utils/common/cookie'
import CloudShell from '@/sections/Navbar/components/CloudShell'
import NotifyPopover from '@/sections/Navbar/components/NotifyPopover'
import MorePopover from '@/sections/Navbar/components/MorePopover'
import WindowsMixin from '@/mixins/windows'
import { hasSetupKey, featureMenuHiddenCheck } from '@/utils/auth'
import { genReferRouteQuery } from '@/utils/utils'

export default {
  name: 'Navbar',
  components: {
    CloudShell,
    Alertresource,
    NotifyPopover,
    MorePopover,
    GlobalOutlined,
    CloudUploadOutlined,
    LockOutlined,
    LogoutOutlined,
    CheckCircleOutlined,
  },
  mixins: [WindowsMixin],
  props: {
    showViewSelection: {
      type: Boolean,
      default: true,
    },
    showNotify: {
      type: Boolean,
      default: true,
    },
    notifyMenuTitleUsedText: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      reLogging: false,
      viewChangePopoverVisible: false,
      pendingView: null,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'scope', 'logo', 'permission', 'scopeResource', 'setting']),
    ...mapState('app', {
      alertresource: state => state.alertrecords,
    }),
    username () {
      return this.userInfo.displayname || this.userInfo.name || 'OneCloud'
    },
    firstNameWord () {
      const word = this.username.split('')[0]
      return word && word.toUpperCase()
    },
    products () {
      if (this.userInfo.menus && this.userInfo.menus.length > 0) {
        const menus = this.userInfo.menus.map(item => {
          return {
            key: item.url,
            label: item.name,
          }
        })
        return menus
      }
      return null
    },
    projects () {
      return R.sort((a, b) => {
        return a.name.localeCompare(b.name)
      }, this.userInfo.projects)
    },
    systemProjects () {
      return this.projects.filter(v => v.system_capable === true)
    },
    domainProject () {
      return R.find(R.propEq('domain_capable', true))(this.projects)
    },
    domainProjects () {
      const ret = this.projects.filter(v => v.domain_capable === true)
      return R.uniqWith((a, b) => {
        return this.isSingleProject(ret, a) && this.isSingleProject(ret, b) &&
          a.domain_id === b.domain_id && R.equals(a.domain_policies, b.domain_policies)
      })(ret)
    },
    viewLabel () {
      if (this.$store.getters['auth/isAdmin']) {
        return this.$t('navbar.view.system_manager')
      }
      if (this.$store.getters['auth/isDomain']) {
        return this.isOperation ? this.$t('navbar.view.manager') : this.$t('navbar.view.domain_manager_1var', { domain: this.userInfo.projectDomain || '-' })
      }
      return this.userInfo.projectName || '-'
    },
    // 认证信息加载完毕
    authInfoLoaded () {
      return !!this.userInfo.roles && !!this.permission && !!this.scopeResource
    },
    language () {
      return this.setting.language
    },
    showAlertresource () {
      if (this.isAdminMode) {
        if (this.alertresource) {
          return this.alertresource.total > 0
        }
      }
      return false
    },
    showClouduser () {
      return hasSetupKey(['public', 'hcso'])
    },
    globalSettingSetupKeys () {
      const { globalSetting } = this.$store.state
      if (globalSetting && globalSetting.value) {
        return globalSetting.value.setupKeys || []
      }
      return []
    },
    supportLanguages () {
      const languages = (this.globalSettingSetupKeys || []).filter(item => ['zh-CN', 'en', 'ja-JP'].includes(item))
      return languages
    },
    showMenuMap () {
      const ret = { credential: true };
      (['alert', 'notification', 'cloudshell', 'language', 'clouduser', 'change-password']).forEach(key => {
        if (featureMenuHiddenCheck({ path: `navbar-${key}` })) {
          ret[key] = false
        } else {
          ret[key] = true
        }
      })
      if (featureMenuHiddenCheck({ path: 'credentials-aksk' }) && featureMenuHiddenCheck({ path: 'credentials-container-image' }) && featureMenuHiddenCheck({ path: 'credentials-container-secret' })) {
        ret.credential = false
      }
      return ret
    },
  },
  watch: {
    userInfo: {
      handler (val = {}, oldVal = {}) {
        if (val.id !== oldVal.id) {
          if ((R.isNil(val.projects) || R.isEmpty(val.projects)) && (R.isNil(val.projectId) || R.isEmpty(val.projectId))) {
            this.$router.push('/no-project')
          }
          this.fetchOEM(val)
        }
      },
      immediate: true,
    },
    supportLanguages: {
      handler: function (val) {
        this.setSupportLanguages(val)
        if (val.length && !val.includes(this.language)) {
          const navigatorL = navigator.language || navigator.userLanguage
          setLanguage(val.includes(navigatorL) ? navigatorL : val[0])
          window.location.reload()
        }
      },
      immediate: true,
    },
  },
  created () {
    this.pushApiServerUrlAlert(this.userInfo.id)
    this.cronjobFetchAlerts()
  },
  methods: {
    // 挂到 navbar-wrap：圆角模式下 navbar 有 inset，避免面板按视口贴边错位
    getNavbarPopupContainer (triggerNode) {
      return (triggerNode && triggerNode.closest && triggerNode.closest('.navbar-wrap')) || document.body
    },
    async userMenuClick (item) {
      if (item.key === 'logout') {
        try {
          await this.$store.dispatch('auth/logout')
          this.$router.push({
            path: '/auth/login',
            query: genReferRouteQuery(this.$route),
          })
        } catch (error) {
          throw error
        }
      } else if (item.key === 'handleUpdatePassword') {
        this.createDialog('UpdateUserPasswordDialog')
      } else if (item.key === 'toClouduser') {
        this.$router.push('/clouduser')
      } else if (item.key === 'toCredentials') {
        this.$router.push('/credentials')
      }
    },
    projectChange (id, scope) {
      if (this.userInfo.projectId === id && this.scope === scope) {
        this.viewChangePopoverVisible = false
        return
      }
      // 先就地切换勾选，避免先关弹层清空内容再渲染导致抖动
      this.pendingView = { id, scope }
      this.reLogin(id, scope)
    },
    onViewDropdownOpenChange (open) {
      // 切换登录过程中保持列表挂载，不触发销毁重建
      if (this.reLogging) return
      this.viewChangePopoverVisible = open
    },
    isViewSelected (id, scope) {
      if (this.pendingView) {
        return this.pendingView.id === id && this.pendingView.scope === scope
      }
      return this.scope === scope && this.userInfo.projectId === id
    },
    productChange (item) {
      window.open(item.key, '_blank')
    },
    async reLogin (projectId, scope) {
      this.reLogging = true
      try {
        await this.$store.dispatch('auth/login', {
          tenantId: projectId,
        })
        await this.$store.commit('auth/SET_SCOPE', scope)
        await this.$store.commit('auth/SET_TENANT', projectId)
        await this.$store.commit('auth/UPDATE_HISTORY_USERS', {
          key: this.$store.getters['auth/currentLoggedUserKey'],
          value: {
            tenant: projectId,
            scope,
          },
        })
        await this.$store.commit('auth/UPDATE_HISTORY_USERS', {
          key: this.$store.getters['auth/currentLoggedUserKey'],
          value: {
            tenant: projectId,
            scope,
          },
        })
        await this.$store.dispatch('scopedPolicy/get', {
          category: ['sub_hidden_menus'],
        })
        window.location.reload()
        return true
      } catch (error) {
        this.pendingView = null
        throw error
      } finally {
        this.reLogging = false
      }
    },
    handleToggleSidebar () {
      const drawerVisible = !(get(this.$store.getters, 'common.sidebar.drawerVisible', false))
      this.$store.dispatch('common/updateObject', {
        name: 'sidebar',
        data: {
          drawerVisible,
        },
      })
    },
    handleCloseSidebar () {
      this.$store.dispatch('common/updateObject', {
        name: 'sidebar',
        data: {
          drawerVisible: false,
        },
      })
    },
    settingLanguageCH () {
      setLanguage('zh-CN')
      window.location.reload()
    },
    settingLanguageEN () {
      setLanguage('en')
      window.location.reload()
    },
    settingLanguageJP () {
      setLanguage('ja-JP')
      window.location.reload()
    },
    isSingleProject (projects, item) {
      const sameDomainProjects = projects.filter(v => v.domain_id === item.domain_id)
      const num = sameDomainProjects?.length
      if (num > 1) {
        const isAll = sameDomainProjects.every(v => {
          return R.equals(v.domain_policies, item.domain_policies)
        })

        if (isAll) {
          return true
        }
      }
      return num === 1
    },
    cronjobFetchAlerts () { // 定时5分钟请求一次
      const userInfo = this.$store.getters.userInfo
      if ((R.isNil(userInfo.projects) || R.isEmpty(userInfo.projects)) && (R.isNil(userInfo.projectId) || R.isEmpty(userInfo.projectId))) {
        return
      }
      this.$store.dispatch('app/fetchAlertingrecords')
      setInterval(() => {
        this.$store.dispatch('app/fetchAlertingrecords')
      }, 5 * 60 * 1000)

      if (this.isAdminMode && this.$store._actions['app/fetchAlertresource']) {
        // this.$store.dispatch('app/fetchAlertresource')
        // setInterval(() => {
        //   this.$store.dispatch('app/fetchAlertresource')
        // }, 5 * 60 * 1000)
      } else {
        this.$store.commit('app/SET_ALERTRESOURCE', {
          data: [],
          total: 0,
        })
      }
    },
    async pushApiServerUrlAlert (id) {
      if (!id) return
      const t = (key) => {
        if (typeof this.$t === 'function') return this.$t(key)
        if (this.$i18n && typeof this.$i18n.t === 'function') return this.$i18n.t(key)
        return key
      }
      try {
        const params = {}
        if (this.$store.getters.scope !== 'system') {
          params.domain = this.$store.getters.userInfo.projectDomain
        }
        const regions = await this.$store.dispatch('auth/getRegions', params)
        const currentHost = window.location.hostname
        const apiServer = regions.api_server || ''
        if (apiServer) {
          if (!apiServer.includes(currentHost)) {
            this.$store.dispatch('common/updateObject', {
              name: 'topAlert',
              data: {
                apiServer: {
                  messageOptions: [
                    t('common_222'),
                    ['a', { attrs: { href: apiServer } }, apiServer],
                    t('common_223'),
                  ],
                  interval: 1000 * 60 * 60 * 24,
                },
              },
            })
          }
        }
      } catch (error) {
        throw error
      }
    },
    fetchOEM (val) {
      if (val) {
        this.$store.dispatch('app/fetchOEM')
      }
    },
    setSupportLanguages (val) {
      storage.set('__oc_support_languages__', val)
    },
  },
}
</script>

<style lang="less" scoped>
@import '../../../src/styles/less/theme';

.navbar-wrap {
  color: #4b5563;
  height: 60px;
  padding: 0 12px 0 8px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  // 需高于 antd Drawer z-index(1000)，避免侧边菜单遮罩盖住顶栏
  z-index: 1001;
  background: #fff;
  overflow: visible;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.04);
  -webkit-font-smoothing: antialiased;
}

.navbar-left,
.navbar-right,
.navbar-nav,
.navbar-brand {
  min-height: 100%;
}

.navbar-left {
  gap: 4px;
  min-width: 0;
}

.navbar-right {
  gap: 2px;
  padding-left: 8px;
}

.navbar-brand {
  gap: 10px;
  margin-left: 4px;
  flex-shrink: 0;
}

.navbar-divider {
  width: 1px;
  height: 18px;
  margin: 0 10px;
  background: rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.navbar-nav {
  gap: 4px;
  min-width: 0;
}

.navbar-item {
  height: auto;
}

.navbar-user {
  position: relative;
}

.navbar-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #6b7280;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.15s cubic-bezier(0.2, 0, 0, 1),
    color 0.15s cubic-bezier(0.2, 0, 0, 1);

  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }

  :deep(.trigger),
  :deep(a),
  :deep(button),
  :deep([tabindex]),
  :deep(.ant-tooltip-open),
  :deep(.ant-popover-open),
  :deep(.ant-dropdown-open) {
    outline: none !important;
    box-shadow: none !important;
  }

  &:hover {
    color: var(--ant-color-primary, #1890ff);
    background: #f3f4f6;
  }

  :deep(.trigger) {
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }
}

.navbar-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #4b5563;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color 0.15s cubic-bezier(0.2, 0, 0, 1),
    color 0.15s cubic-bezier(0.2, 0, 0, 1);

  :deep(.anticon),
  :deep(svg) {
    font-size: 22px;
  }

  &:hover:not(.is-disabled) {
    color: #111827;
    background: #f3f4f6;
  }

  &:active:not(.is-disabled) {
    transform: scale(0.96);
  }

  &.is-disabled {
    cursor: default;
    opacity: 0.55;
  }
}

.navbar-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 240px;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  transition:
    background-color 0.15s cubic-bezier(0.2, 0, 0, 1),
    color 0.15s cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }

  &:active {
    transform: scale(0.98);
  }

  &.is-user {
    gap: 8px;
    max-width: 180px;
    padding: 0 12px 0 6px;
    margin-left: 4px;
  }
}

.chip-icon {
  font-size: 18px;
  color: #6b7280;
  flex-shrink: 0;
}

.chip-label {
  max-width: 160px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
}

.chip-caret {
  font-size: 18px;
  color: #9ca3af;
  flex-shrink: 0;
  line-height: 1;
  margin-left: -2px;
  // 光学对齐：ant caret 视觉中心偏下
  transform: translateY(-1px);
}

.header-logo {
  line-height: 1;
  display: flex;
  align-items: center;

  img {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    object-fit: cover;
    outline-offset: -1px;
  }
}

.header-title {
  margin: 0;
  padding: 0;
  font-weight: 600;
  font-size: 18px;
  line-height: 1;
  color: #111827;
  white-space: nowrap;
}

.user-avatar {
  color: #fff !important;
  background: @primary-color !important;
  font-size: 14px !important;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  max-width: 110px;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  line-height: 1;
}

.view-dropdown-overlay {
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12);
}

.lang-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.lang-item__label {
  flex: 0 1 auto;
  min-width: 0;
}

.lang-item__check {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 14px;
  color: #52c41a;
  line-height: 1;
}

.navbar-check-icon {
  font-size: 14px;
  color: #52c41a;
  line-height: 1;
}

.view-list-wrap {
  width: 180px;
  max-height: 60vh;
  overflow-y: auto;
  margin: 0;
  padding: 4px;

  > li {
    padding: 0;

    > ul {
      margin: 0;
      padding: 0;
    }
  }

  .item-link {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 8px;
    margin: 2px 0;
    border-radius: 6px;
    cursor: pointer;
    box-sizing: border-box;

    > .d-flex {
      flex: 1;
      width: 100%;
      min-width: 0;
    }

    &:hover {
      background: #f3f4f6;
    }
  }

  .item-section-title {
    padding: 6px 8px 2px;
    color: #9ca3af;
    font-size: 12px;
  }
}

.global-map-btn {
  margin-left: 2px;
}

@media only screen and (max-width: 1100px) {
  .header-title {
    display: none;
  }

  .navbar-divider {
    display: none;
  }
}
</style>

<style lang="less">
/* submenu / dropdown 挂到 body，需非 scoped */
.navbar-user-menu-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  line-height: 1;
}

.navbar-user-menu-item .anticon {
  font-size: 14px;
}

/* 贴 navbar 外框：上贴底边、右贴外框右缘（不是触发器内容边） */
.navbar-wrap .navbar-user-dropdown.ant-dropdown {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  left: auto !important;
  bottom: auto !important;
  margin: 0 !important;
  transform: none !important;
  overflow: visible;
}

.navbar-wrap .navbar-user-dropdown .ant-dropdown-menu.navbar-user-menu,
.navbar-wrap .navbar-user-dropdown .navbar-user-menu {
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.navbar-lang-submenu {
  min-width: 118px !important;
  width: max-content !important;

  .lang-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-width: 96px;
  }

  .lang-item__check {
    flex-shrink: 0;
    margin-left: 8px;
    font-size: 14px;
    color: #52c41a;
    line-height: 1;
  }
}
</style>
