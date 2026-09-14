<template>
  <div class="navbar-wrap d-flex align-items-center" :class="{ 'is-chip-compact': chipCompact }" @click.stop.prevent="handleCloseSidebar">
    <div v-if="!isHiddenMenu">
      <template v-if="authInfoLoaded && isShowMenu">
        <a-tooltip :title="$t('navbar.button.menu')" placement="bottom">
          <div class="primary-color-hover navbar-item-trigger global-map-btn" @click.stop.prevent="handleToggleSidebar">
            <icon :type="drawerVisible ? 'menu-close' : 'open'" />
          </div>
        </a-tooltip>
      </template>
      <template v-else>
        <div class="primary-color-hover navbar-item-trigger global-map-btn is-disabled">
          <icon :type="drawerVisible ? 'menu-close' : 'open'" />
        </div>
      </template>
    </div>
    <div class="flex-fill d-flex align-items-center h-100 flex-shrink-0 flex-grow-0">
      <router-link to="/" custom v-slot="{ navigate, href }">
        <div class="header-logo" :href="href" @click="navigate">
          <img class="logo" :src="logo" />
        </div>
      </router-link>
    </div>
    <!-- 视图选择 -->
    <div class="navbar-item d-flex align-items-center justify-content-end flex-shrink-0 flex-grow-0" v-if="showViewSelection">
      <a-dropdown
        :trigger="['click']"
        :open="viewChangePopoverVisible"
        :destroyPopupOnHide="false"
        :getPopupContainer="triggerNode => triggerNode.parentNode"
        @update:open="onViewDropdownOpenChange">
        <a-tooltip :title="chipCompact ? viewLabel : ''" placement="bottom">
          <div class="navbar-item-trigger d-flex align-items-center" :class="{ 'is-icon-only': chipCompact }">
            <icon type="navbar-view-switch" class="navbar-chip-icon" />
            <span v-show="!chipCompact" class="current-view-label text-truncate" :title="viewLabel">{{ viewLabel }}</span>
            <icon v-show="!chipCompact" type="caret-down" class="navbar-chip-caret" />
          </div>
        </a-tooltip>
        <template #overlay>
          <div class="view-dropdown-overlay" @click.stop>
            <ul class="list-unstyled view-list-wrap">
              <!-- 管理后台 -->
              <template v-if="systemProjects && systemProjects.length">
                <li>
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
                  <div class="item-section-title">{{ domainManagerTitle }}</div>
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
    <div class="navbar-item d-flex align-items-center justify-content-end flex-shrink-0 flex-grow-0" v-if="products && showSystemChoose">
      <a-dropdown :trigger="['click']" :getPopupContainer="triggerNode => triggerNode.parentNode">
        <a-tooltip :title="chipCompact ? $t('dictionary.endpoint') : ''" placement="bottom">
          <div class="navbar-item-trigger d-flex align-items-center" :class="{ 'is-icon-only': chipCompact }">
            <icon type="navbar-setting" class="navbar-chip-icon navbar-chip-icon--setting" />
            <span v-show="!chipCompact" class="products-label text-truncate">{{$t('dictionary.endpoint')}}</span>
            <icon v-show="!chipCompact" type="caret-down" class="navbar-chip-caret" />
          </div>
        </a-tooltip>
        <template #overlay>
          <a-menu @click="productChange">
            <a-menu-item v-for="(item, idx) of products" :key="`${item.key}$$${idx}`">{{ item.label }}</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
    <!-- 全局搜索：中间区 flex:1；收起浅底入口，展开为搜索框；右侧工具区不位移 -->
    <div class="navbar-search-zone d-flex align-items-center flex-fill" v-if="showGlobalSearch">
      <div class="globar-search-wrapper" :class="{ 'is-expanded': searchExpanded }">
        <global-search @expand-change="onSearchExpandChange" />
      </div>
    </div>
    <div v-else class="flex-fill" />
    <div class="navbar-right d-flex align-items-center flex-shrink-0">
    <slot name="frontNavbar" />
    <!-- 资源报警 -->
    <alertresource v-if="showAlertresource && showMenuMap.alert" :res_total="alertresource.total" class="navbar-item-icon primary-color-hover" />
    <slot name="frontNavbar2" />
    <!-- 消息中心 -->
    <notify-popover class="navbar-item-icon primary-color-hover" :notifyMenuTitleUsedText="notifyMenuTitleUsedText" v-if="showNotify && showMenuMap.notification" />
    <!-- 工单 -->
    <work-order-popover class="navbar-item-icon primary-color-hover" :workOrderMenuTitleUsedText="workOrderMenuTitleUsedText" v-if="showWorkFlow && itsmServiceEnable && showMenuMap.workflow" />
    <!-- 大屏监控 -->
    <div class="navbar-item-icon primary-color-hover" v-if="isCMPPrivate && !$store.getters.isSysCE && (isAdminMode || isDomainMode) && showMenuMap.monitor_dashboard" style="cursor: pointer;" @click="handleOpenOverview">
      <a-tooltip :title="$t('navbar.button.monitor')" placement="bottom">
        <icon type="daping" style="font-size: 22px;" />
      </a-tooltip>
    </div>
    <!-- cloudsheel -->
    <cloud-shell v-if="isAdminMode && enableCloudShell && showMenuMap.cloudshell" class="navbar-item-icon primary-color-hover" />
    <!-- ai -->
    <div class="navbar-item-icon primary-color ai-icon-wrap" v-if="enableAi && showMenuMap.ai" style="cursor: pointer;" @click="handleOpenAI">
      <a-tooltip :title="mcpAgent?.id ? $t('navbar.button.ai') : $t('common.config_agent')" placement="bottom">
        <icon type="ai" class="ai-icon" />
      </a-tooltip>
    </div>
    <slot name="behindNavbar" />
    <!-- 更多 -->
    <slot name="morePopover" v-if="showMenuMap.more && (showMenuMap.feature_select || showMenuMap.docs || showMenuMap.about)">
      <more-popover :showMenuMap="showMenuMap" class="navbar-item-icon primary-color-hover" />
    </slot>
    <!-- 用户 -->
    <slot name="userPopover" />
    </div>
  </div>
</template>

<script>
import { h } from 'vue'
import get from 'lodash/get'
import * as R from 'ramda'
import Cookies from 'js-cookie'
import { mapGetters, mapState } from 'vuex'
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import UserProjectSelect from '@/sections/UserProjectSelect'
import WindowsMixin from '@/mixins/windows'
import { getSetupInStorage, hasPermission, featureMenuHiddenCheck } from '@/utils/auth'
import { uuid, isCE, genReferRouteQuery } from '@/utils/utils'
import NotifyPopover from './components/NotifyPopover'
// import SettingPopover from './components/SettingPopover'
import WorkOrderPopover from './components/WorkOrderPopover'
import MorePopover from './components/MorePopover'
import GlobalSearch from './components/GlobalSearch'
import Alertresource from './components/Alertresource'
import CloudShell from './components/CloudShell'

export default {
  name: 'Navbar',
  components: {
    NotifyPopover,
    // SettingPopover,
    WorkOrderPopover,
    MorePopover,
    GlobalSearch,
    Alertresource,
    CloudShell,
    CheckCircleOutlined,
  },
  mixins: [WindowsMixin],
  props: {
    showNotify: {
      type: Boolean,
      default: true,
    },
    showWorkOrder: {
      type: Boolean,
      default: true,
    },
    showHelp: {
      type: Boolean,
      default: true,
    },
    showSystemChoose: {
      type: Boolean,
      default: true,
    },
    notifyMenuTitleUsedText: {
      type: Boolean,
      default: false,
    },
    workOrderMenuTitleUsedText: {
      type: Boolean,
      default: false,
    },
    settingMenuTitleUsedText: {
      type: Boolean,
      default: false,
    },
    isHiddenMenu: {
      type: Boolean,
      default: false,
    },
    showGlobalSearch: {
      type: Boolean,
      default: true,
    },
    showViewSelection: {
      type: Boolean,
      default: true,
    },
    checkLicense: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      reLogging: false,
      viewChangePopoverVisible: false,
      pendingView: null,
      selectPid: '',
      isOperation: process.env.VUE_APP_PLATFORM === 'operation',
      isCMPPrivate: process.env.VUE_APP_PLATFORM === 'cmp_private',
      mcpAgent: null,
      searchExpanded: false,
      chipCompact: false,
    }
  },
  computed: {
    ...mapGetters([
      'isAdminMode',
      'isDomainMode',
      'userInfo',
      'scope',
      'logo',
      'permission',
      'scopeResource',
      'auth',
      'workflow',
      'common',
    ]),
    ...mapState('app', {
      computeStatus: state => state.license.status,
      computeLicense: state => state.license.compute,
      computeServiceNumbers: state => state.license.service_numbers,
      oem: state => state.oem,
      alertresource: state => state.alertrecords,
    }),
    enableCloudShell () {
      const { globalConfig = {} } = this.common
      const { enable_cloud_shell = true } = globalConfig
      return enable_cloud_shell
    },
    enableAi () {
      // 显式依赖 permission / scopeResource，保证刷新后异步就绪能触发重新计算
      if (!this.permission || !this.scopeResource) return false
      return hasPermission({ key: 'mcp_agents_list' }) && !isCE() && !this.$store.getters.isSysCE
    },
    shouldFetchMcpAgents () {
      return !!(process.env.VUE_APP_IS_PRIVATE && !this.$store.getters.isSysCE && this.enableAi && this.showMenuMap.ai)
    },
    products () {
      if (this.userInfo.menus && this.userInfo.menus.length > 0) {
        const menus = this.userInfo.menus.filter(item => item.service === 'external-service').map(item => {
          return {
            key: item.url,
            label: item.name,
          }
        })
        if (menus.length > 0) {
          return menus
        }
      }
      return null
    },
    projects () {
      return R.sort((a, b) => {
        return a.name.localeCompare(b.name)
      }, this.userInfo.projects)
    },
    domainProjects () {
      const ret = this.projects.filter(v => v.domain_capable === true)
      return R.uniqWith((a, b) => {
        return this.isSingleProject(ret, a) && this.isSingleProject(ret, b) &&
          a.domain_id === b.domain_id && R.equals(a.domain_policies, b.domain_policies)
      })(ret)
    },
    systemProjects () {
      return this.projects.filter(v => v.system_capable === true)
    },
    viewLabel () {
      if (this.$store.getters['auth/isAdmin']) {
        return this.$t('navbar.view.system_manager') + '-' + this.userInfo.projectName
      }
      if (this.$store.getters['auth/isDomain']) {
        return this.$t('navbar.view.domain_manager_1var', { domain: this.userInfo.projectDomain || '-' }) + '-' + this.userInfo.projectName
      }
      return this.userInfo.projectName || '-'
    },
    // 认证信息加载完毕
    authInfoLoaded () {
      return !!this.userInfo.roles && !!this.permission && !!this.scopeResource
    },
    // 以下是license相关compute
    email () {
      const email = this.oem.email
      if (!R.isNil(email) && !R.isEmpty(email)) {
        return email
      }
      return null
    },
    sn () {
      const sn = this.computeLicense.sn
      if (R.is(String, sn)) {
        return [sn]
      }
      return sn
    },
    unAuthServiceNumbers () {
      return this.computeServiceNumbers.filter(item => this.sn && !this.sn.includes(item))
    },
    licenseMessage () {
      const now = new Date()
      const days = (this.computeStatus.expire - now.getTime() / 1000) / 24 / 3600
      // 过期
      if (this.computeStatus.expired) {
        return {
          message: this.$t('common_217', [this.email]),
        }
      }
      // 超过配额
      if (this.computeStatus.prohibited) {
        return {
          message: this.$t('common_218', [this.email]),
          to: '/licenses',
        }
      }
      // 即将过期
      if (this.computeStatus.expire > 0) {
        if ((this.computeLicense.license_type === 'test' && days < 7) ||
          (this.computeLicense.license_type === 'commercial' && days < 30)) {
          return {
            message: this.$t('common_219', [this.email]),
          }
        }
      }
      // 即将超出配额
      if (this.computeStatus.exceeded) {
        return {
          message: this.$t('common_220', [this.email]),
          to: '/licenses',
        }
      }
      // 发现未被授权的服务器
      if (this.unAuthServiceNumbers && this.unAuthServiceNumbers.length) {
        return {
          message: this.$t('common_221', [this.email]),
          to: '/licenses',
        }
      }
      return null
    },
    maintenanceMessage () {
      const days = (this.computeLicense.maintenance_expire - Date.now() / 1000) / 24 / 3600

      if (this.computeLicense.maintenance_expire > 0) {
        // 即将过期
        if (days < 30) {
          return {
            message: this.$t('common.licenses.maintenance_adverb_expire.alert', [this.email]),
          }
        }
        // 已经过期
        if (days < 0) {
          return {
            message: this.$t('common.licenses.maintenance_already_expire.alert', [this.email]),
          }
        }
      }
      return null
    },
    licenseClosable () {
      return this.computeStatus.prohibited || this.computeStatus.exceeded
    },
    itsmServiceEnable () {
      const itsm = (this.userInfo.services || []).find(v => v.type === 'itsm' && v.status === true)
      return !!itsm
    },
    isShowMenu () {
      const { globalSetting } = this.$store.state
      if (!globalSetting || (globalSetting && !globalSetting.value) || (globalSetting.value && !globalSetting.value.key)) {
        return true
      }
      return globalSetting.value.key.length > 0
    },
    showAlertresource () {
      if (this.isAdminMode && this.$appConfig.isPrivate && hasPermission({ key: 'alertresources_list' })) {
        return true
      }
      return false
    },
    domainManagerTitle () {
      return this.$t('navbar.view.domain_manager')
    },
    showWorkFlow () {
      return this.showWorkOrder && this.workflow.enabledKeys?.length > 0
    },
    globalSettingSetupKeys () {
      const { globalSetting } = this.$store.state
      if (globalSetting && globalSetting.value) {
        return globalSetting.value.setupKeys || []
      }
      return []
    },
    drawerVisible () {
      return get(this.common, 'sidebar.drawerVisible', false)
    },
    showMenuMap () {
      const ret = {}
      const list = ['alert', 'notification', 'workflow', 'monitor_dashboard', 'cloudshell', 'more', 'feature_select', 'docs', 'about', 'ai']
      list.map(item => {
        ret[item] = !this.$isScopedPolicyMenuHidden(`navbar_hidden_items.${item}`)
      });
      (['alert', 'notification', 'workflow', 'monitor_dashboard', 'cloudshell', 'ai']).forEach(key => {
        if (featureMenuHiddenCheck({ path: `navbar-${key.replace('_', '-')}` })) {
          ret[key] = false
        }
      })
      return ret
    },
  },
  watch: {
    userInfo: {
      handler (val = {}, oldVal = {}) {
        if (val.id !== oldVal.id) {
          if (getSetupInStorage() && this.globalSettingSetupKeys.length === 0 && val.roles && val.roles.includes('admin')) {
            this.$router.push('/guide')
            return
          }
          if ((R.isNil(val.projects) || R.isEmpty(val.projects)) && (R.isNil(val.projectId) || R.isEmpty(val.projectId))) {
            this.$router.push('/no-project')
            return
          }
          this.checkProjects(val)
        }
      },
      immediate: true,
    },
    'userInfo.id' (val) {
      this.checkWorkflow(val)
      this.fetchOEM(val)
      if (this.checkLicense) {
        this.fetchLicense(val)
      }
      this.pushApiServerUrlAlert(val)
    },
    licenseMessage: {
      handler (val) {
        if (val) {
          this.$nextTick(() => {
            this.pushLicenseAlert()
          })
        }
      },
      immediate: true,
    },
    maintenanceMessage: {
      handler (val) {
        if (val) {
          this.$nextTick(() => {
            this.pushLicenseAlert('maintenance')
          })
        }
      },
      immediate: true,
    },
    // 刷新时 permission / setupKeys 异步就绪，created 时条件可能未满足，需 watch 后再请求
    shouldFetchMcpAgents: {
      handler (val) {
        if (val) {
          this.fetchMcpAgents()
        }
      },
      immediate: true,
    },
  },
  created () {
    this.checkWorkflow(this.userInfo.id)
    this.fetchOEM(this.userInfo.id)
    if (this.checkLicense) {
      this.fetchLicense(this.userInfo.id)
    }
    this.pushApiServerUrlAlert(this.userInfo.id)
    this.cronjobFetchAlerts()
    // 商业版数据处理
    if (process.env.VUE_APP_IS_PRIVATE && !this.$store.getters.isSysCE) {
      if (this.isAdminMode || this.isDomainMode) {
        this.$store.dispatch('bill/fetchProjectSharingAccounts')
      }
    }
    this.$bus.$on('default-mcp-agent-updated', () => {
      this.fetchMcpAgents()
    })
  },
  mounted () {
    this.bindChipCompactMedia()
  },
  beforeUnmount () {
    this.unbindChipCompactMedia()
  },
  methods: {
    bindChipCompactMedia () {
      // 窄屏优先收起「管理后台 / 常用系统」文案，给搜索与右侧工具让位
      if (typeof window === 'undefined' || !window.matchMedia) return
      this._chipCompactMq = window.matchMedia('(max-width: 1360px)')
      this._onChipCompactMq = (e) => {
        this.chipCompact = !!(e && e.matches)
      }
      this.chipCompact = !!this._chipCompactMq.matches
      if (this._chipCompactMq.addEventListener) {
        this._chipCompactMq.addEventListener('change', this._onChipCompactMq)
      } else if (this._chipCompactMq.addListener) {
        this._chipCompactMq.addListener(this._onChipCompactMq)
      }
    },
    unbindChipCompactMedia () {
      if (!this._chipCompactMq || !this._onChipCompactMq) return
      if (this._chipCompactMq.removeEventListener) {
        this._chipCompactMq.removeEventListener('change', this._onChipCompactMq)
      } else if (this._chipCompactMq.removeListener) {
        this._chipCompactMq.removeListener(this._onChipCompactMq)
      }
      this._chipCompactMq = null
      this._onChipCompactMq = null
    },
    async fetchMcpAgents () {
      console.log('fetchMcpAgents')
      try {
        const response = await new this.$Manager('mcp_agents', 'v2').list({
          params: {
            scope: this.$store.getters.scope,
            default_agent: true,
            $t: 1,
          },
        })
        if (response.data && response.data.data && response.data.data.length > 0) {
          this.mcpAgent = response.data.data[0]
        }
      } catch (error) {
        console.error('Failed to fetch MCP agents:', error)
      }
    },
    handleOpenAI () {
      if (!this.mcpAgent?.id) {
        this.$router.push('/mcp')
        return
      }
      this.initSidePageTab('chat')
      this.sidePageTriggerHandle(this, 'McpSidePage', {
        id: this.mcpAgent.id,
        resource: 'mcp_agents',
      })
    },
    checkWorkflow (val) {
      if (!this.itsmServiceEnable) return
      if (val) {
        this.$store.dispatch('app/fetchWorkflowStatistics')
        this.$store.dispatch('app/fetchWorkflowEnabledKeys', { $t: uuid() })
      }
    },
    fetchOEM (val) {
      if (val) {
        this.$store.dispatch('app/fetchOEM')
      }
    },
    fetchLicense (val) {
      if (val) {
        this.$store.dispatch('app/fetchLicense').catch(ret => {
          let is402 = false
          if (R.type(ret) === 'Error' || R.type(ret) === 'String') {
            is402 = ret.toString().indexOf('status code 402') > -1
          }
          if (R.type(ret) === 'Object') {
            is402 = ret.status === 402
          }
          if (is402 && this.$store.getters.isAdminMode) {
            this.createDialog('UpdateLicenseDialog')
          }
        })
      }
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
      // 打开的常用系统是同域下的，则设置一个临时的session（供其他系统使用）
      const hostname = window.location.hostname
      const href = item.key.split('$$')[0]
      if (href.includes(hostname)) {
        const obj = {
          projectId: this.userInfo.projectId,
          projectName: this.userInfo.projectName,
          name: this.userInfo.name,
          displayname: this.userInfo.displayname,
          id: this.userInfo.id,
          ...this.auth.auth,
        }
        const bStr = window.encodeURI(JSON.stringify(obj))
        Cookies.set('timeauth', bStr)
      }
      window.open(href, '_blank')
    },
    async reLogin (projectId, scope) {
      this.reLogging = true
      try {
        await this.$store.dispatch('auth/login', {
          tenantId: projectId,
        })
        await this.$store.commit('auth/SET_SCOPE', scope)
        await this.$store.commit('auth/SET_TENANT', projectId)
        await this.$store.commit('auth/UPDATE_LOGGED_USERS', {
          key: this.$store.getters['auth/currentLoggedUserKey'],
          value: {
            tenant: projectId,
            scope,
          },
        })
        await this.$store.commit('auth/UPDATE_HISTORY_USERS', {
          key: this.$store.getters['auth/currentHistoryUserKey'],
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
    pushLicenseAlert (type) {
      if (!this.isAdminMode) return false
      const messageOptions = []
      if (type === 'maintenance') {
        if (this.maintenanceMessage?.message) {
          messageOptions.push(this.maintenanceMessage?.message)
        }
      } else {
        if (this.licenseMessage?.message) {
          messageOptions.push(this.licenseMessage?.message)
        }
      }
      if (this.licenseMessage?.to) {
        messageOptions.push([
          'router-link',
          { class: 'ml-2', props: { to: this.licenseMessage.to } },
          this.$t('common_224'),
        ])
      }
      this.$store.dispatch('common/updateObject', {
        name: 'topAlert',
        data: {
          license: {
            messageOptions,
            alertProps: {
              clseable: this.licenseClosable,
            },
            interval: '1d',
          },
        },
      })
    },
    checkProjects (userInfo) {
      // 当有项目时 且 没有匹配到当前登录项目，则提示选择项目进行relogin
      if (
        (R.isEmpty(userInfo.projectId) || R.isNil(userInfo.projectId)) &&
        (!R.isEmpty(userInfo.projects) && !R.isNil(userInfo.projects))
      ) {
        this.createDialog('CommonDialog', {
          header: this.$t('common_225') + this.$t('dictionary.project'),
          body: () => {
            return h(UserProjectSelect, {
              props: {
                value: this.selectPid,
              },
              on: {
                input: (pid) => {
                  this.selectPid = pid
                },
              },
            })
          },
          ok: () => this.reLogin(this.selectPid, 'project'),
          hiddenCancel: true,
          modalProps: {
            maskClosable: false,
            closable: false,
          },
        })
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
    onSearchExpandChange (expanded) {
      this.searchExpanded = expanded
    },
    handleOpenOverview () {
      const { companyInfo } = this.$store.state.app
      if (companyInfo.monitor_dashboard_style === 'overview-private2') {
        window.open('/overview-private', '_blank')
      } else if (companyInfo.monitor_dashboard_style === 'custom-url' && companyInfo.custom_url) {
        window.open(companyInfo.custom_url, '_blank')
      } else {
        window.open('/overview', '_blank')
      }
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

      if (this.isAdminMode && this.$appConfig.isPrivate && this.$store._actions['app/fetchAlertresource']) {
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
  },
}
</script>

<style lang="less" scoped>
@import '../../styles/less/theme';

.navbar-wrap {
  // 常态图标/文字统一色，避免芯片偏深、右侧图标偏浅
  --oc-navbar-fg: #4b5563;
  color: var(--oc-navbar-fg);
  height: 60px;
  padding: 0 12px 0 8px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 101;
  background: #fff;
  overflow: visible;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.04),
    0 1px 3px rgba(0, 0, 0, 0.04);
  -webkit-font-smoothing: antialiased;
}
.navbar-item {
  height: 100%;
}
.navbar-item-icon {
  width: 40px;
  height: 40px;
  margin-left: 2px;
  margin-right: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 8px;
  color: var(--oc-navbar-fg, #4b5563);
  -webkit-tap-highlight-color: transparent;
  overflow: visible;
  transition:
    background-color 0.15s cubic-bezier(0.2, 0, 0, 1),
    color 0.15s cubic-bezier(0.2, 0, 0, 1);

  // 点击后浏览器/组件 focus 描边会多出一个框
  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none;
    box-shadow: none;
  }

  :deep(.trigger),
  :deep(a),
  :deep(button),
  :deep(span),
  :deep([tabindex]),
  :deep(.ant-tooltip-open),
  :deep(.ant-popover-open),
  :deep(.ant-dropdown-open),
  :deep(.ant-tooltip),
  :deep(.anticon),
  :deep(svg) {
    outline: none !important;
    box-shadow: none !important;
  }

  &:hover {
    color: var(--ant-color-primary, #1890ff) !important;
    background: #f3f4f6;

    // 数据加载后 a-badge 会写死 color，需强制子树继承，角标数字保持白字
    :deep(.ant-badge) {
      color: inherit !important;
    }
    :deep(.ant-badge-count),
    :deep(.ant-scroll-number),
    :deep(.ant-badge-multiple-words) {
      color: #fff !important;
    }
    // 格子内图标跟随 hover；下拉「关于」升级图标另有绿色 !important
    :deep(.oc-icon),
    :deep(svg),
    :deep(.shop-cart-icon) {
      color: inherit !important;
      fill: currentColor !important;
    }
  }

  :deep(.trigger) {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    color: inherit;
  }

  // 仅统一触发器图标，避免 Popover/Dropdown 面板内小图标被放大
  :deep(.trigger .oc-icon) {
    width: 20px !important;
    height: 20px !important;
    font-size: 20px !important;
    line-height: 1;
    flex-shrink: 0;
    color: inherit;
  }

  :deep(.about-upgrade-icon.oc-icon),
  :deep(svg.about-upgrade-icon) {
    color: #52c41a !important;
    fill: #52c41a !important;
  }
}
.ai-icon-wrap {
  color: var(--ant-color-primary, @primary-color) !important;

  &:hover {
    color: var(--ant-color-primary, @primary-color) !important;
  }

  .ai-icon,
  :deep(.oc-icon.ai-icon),
  :deep(.ai-icon.oc-icon) {
    width: 24px !important;
    height: 24px !important;
    font-size: 24px !important;
    transform-origin: center center;
    animation: ai-icon-pulse 1.5s ease-in-out infinite;
    color: inherit;
  }
  &:hover .ai-icon,
  &:hover :deep(.oc-icon.ai-icon) {
    animation: ai-icon-pulse 0.8s ease-in-out infinite;
  }
}
@keyframes ai-icon-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.1); }
}
.navbar-item-trigger {
  height: 38px;
  padding: 0 12px;
  margin: 0 2px;
  gap: 6px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  line-height: 1;
  color: var(--oc-navbar-fg, #4b5563);
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 0.15s cubic-bezier(0.2, 0, 0, 1),
    color 0.15s cubic-bezier(0.2, 0, 0, 1);

  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none;
  }

  // 与右侧图标按钮一致：hover 主题色 + 浅灰底
  &:hover {
    background: #f3f4f6;
    color: var(--ant-color-primary, #1890ff);

    .navbar-chip-icon,
    .navbar-chip-caret,
    .current-view-label,
    .products-label,
    :deep(.oc-icon) {
      color: inherit;
    }
  }

  // flex 内取消 oc-icon 默认 vertical-align，避免相对文字偏上
  :deep(.oc-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    vertical-align: 0;
    flex-shrink: 0;
  }

  // 窄屏：仅保留图标，对齐右侧工具按钮尺寸
  &.is-icon-only {
    width: 40px;
    height: 40px;
    padding: 0;
    gap: 0;
    justify-content: center;
  }
}
.navbar-chip-icon {
  font-size: 18px !important;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  line-height: 1;
  color: inherit;

  // 齿轮 SVG 内边距更大，略放大以与视图切换图标视觉对齐
  &--setting {
    font-size: 20px !important;
    width: 20px;
    height: 20px;
  }
}
.navbar-chip-caret {
  font-size: 14px !important;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  line-height: 1;
  color: inherit;
  margin-left: 2px; // 相对 gap 再略拉开与文字距离
  transform: translateY(1px);
}
.navbar-search-zone {
  min-width: 0;
  height: 100%;
  padding: 0 16px 0 12px;
  justify-content: flex-start;
}
.navbar-right {
  gap: 2px;
  height: 100%;
  min-width: 0;
}
.globar-search-wrapper {
  width: 100%;
  min-width: 0;
  overflow: visible;
}
.header-logo {
  line-height: 1;
  cursor: pointer;
  img {
    height: 30px;
    border-radius: 7px;
    outline-offset: -1px;
  }
}
.header-title {
  margin: 0;
  padding: 0;
  font-weight: 600;
  font-size: 18px;
  color: var(--oc-color-text-heading, #303133);
}
.products-label {
  max-width: 150px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  color: inherit;
}
.current-view-label {
  max-width: 150px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  color: inherit;
}
.view-dropdown-overlay {
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0 !important;
  border-radius: 8px;
  margin: 0 2px;
  flex-shrink: 0;
  cursor: pointer;

  :deep(.oc-icon) {
    display: block;
    width: 22px;
    height: 22px;
    font-size: 22px;
    line-height: 1;
  }

  &:hover {
    background: #f3f4f6;
  }

  &.is-disabled {
    cursor: default;
  }
}
@media only screen and (max-width: 1100px) {
  .header-title {
    display: none;
  }
}
@media only screen and (max-width: 980px) {
  .navbar-search-zone {
    display: none !important;
  }
}
</style>
