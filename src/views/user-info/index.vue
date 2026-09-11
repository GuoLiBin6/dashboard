<template>
  <div>
    <h4 class="text-center mb-4">{{ userInfo.name || userInfo.email }}</h4>
    <contact />
    <a-card
      size="small"
      :title="$t('scope.text_230', [this.$t('dictionary.user')])"
      class="mb-4"
      :loading="loading">
      <table-lite-grid
        :data="userTableData"
        :show-header="false"
        :columns="userTableColumns"
        :border="false">
        <template #label="{ row }">{{ row.label }}:</template>
        <template #value="{ row }">
          <list-body-cell-wrap v-if="!row.isProjects" copy field="value" :row="row" />
          <table-lite-grid
            v-else
            :data="row.value"
            :columns="projectTableColumns"
            show-overflow="title"
            border>
            <template #current="{ row: project }">
              <a-tooltip v-if="project.current" :title="$t('scope.text_231', [$t('dictionary.project')])">
                <icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" />
              </a-tooltip>
            </template>
            <template #id="{ row: project }">
              <list-body-cell-wrap copy field="id" :row="project" />
            </template>
            <template #roles="{ row: project }">{{ getRoles(project.roles).join(', ') || '-' }}</template>
            <template #project_policies="{ row: project }">{{ project.project_policies && project.project_policies.join(', ') || '-' }}</template>
            <template #domain_policies="{ row: project }">{{ project.domain_policies && project.domain_policies.join(', ') || '-' }}</template>
            <template #system_policies="{ row: project }">{{ project.system_policies && project.system_policies.join(', ') || '-' }}</template>
          </table-lite-grid>
        </template>
      </table-lite-grid>
    </a-card>
    <idp-card />
    <a-card
      v-show="isAdminMode"
      size="small"
      :title="$t('scope.text_238')"
      class="mb-4">
      <div class="d-flex">
        <div class="user-info-item-label flex-grow-0 flex-shrink-0 text-right">{{$t('scope.text_239')}}</div>
        <div class="flex-fill ml-3">
          <a-switch
            v-model:checked="isShowSystemResource"
            :checked-children="$t('table.title.on')"
            :un-checked-children="$t('table.title.off')"
            @change="doUpdateShowSystemRsChangeHandle" />
          <a-tooltip :title="$t('scope.text_242')" placement="right">
            <icon type="question-circle" class="ml-2" style="position: relative; top: 2px;" />
          </a-tooltip>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { SHOW_SYSTEM_RESOURCE, contactMap } from '@/constants'
import WindowsMixin from '@/mixins/windows'
import Contact from './components/Contact'
import IdpCard from './components/IdpCard'

export default {
  name: 'User',
  components: {
    Contact,
    IdpCard,
  },
  mixins: [WindowsMixin],
  data () {
    return {
      loading: false,
      isShowSystemResource: false,
      contactMap,
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'profile', 'isAdminMode']),
    projects () {
      const ret = this.userInfo.projects.map(item => {
        const current = item.id === this.userInfo.projectId
        return {
          ...item,
          current,
        }
      }).sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
      return ret
    },
    projectTableColumns () {
      return [
        { field: 'current', width: 35, slots: { default: 'current' } },
        { field: 'id', title: 'ID', minWidth: 160, slots: { default: 'id' } },
        { field: 'name', title: this.$t('scope.text_21') },
        { field: 'domain', title: this.$t('table.title.domain') },
        { field: 'roles', title: this.$t('table.title.role'), slots: { default: 'roles' } },
        { field: 'project_policies', title: this.$t('table.title.projectPolicy'), slots: { default: 'project_policies' } },
        { field: 'domain_policies', title: this.$t('table.title.domainPolicy'), slots: { default: 'domain_policies' } },
        { field: 'system_policies', title: this.$t('table.title.managePolicy'), slots: { default: 'system_policies' } },
      ]
    },
    userTableColumns () {
      return [
        { field: 'label', width: 190, align: 'right', slots: { default: 'label' } },
        { field: 'value', slots: { default: 'value' } },
      ]
    },
    userTableData () {
      const us = this.userInfo
      const passwordExpiresAtStr = us.password_expires_at ? this.$moment(this.userInfo.password_expires_at).format() : '-'
      return [
        { label: this.$t('scope.text_244'), value: us.name },
        { label: this.$t('scope.text_245'), value: us.displayname },
        { label: this.$t('table.title.userId'), value: us.id },
        { label: this.$t('scope.text_246'), value: us.last_login_ip },
        { label: this.$t('scope.text_247'), value: this.$moment(us.last_active_at).format('') },
        { label: this.$t('scope.text_248'), value: passwordExpiresAtStr },
        { label: this.$t('scope.text_249'), value: us.last_login_source },
        { label: this.$t('scope.text_250'), value: us.enable_mfa ? this.$t('table.title.on') : this.$t('table.title.off') },
        { label: this.$t('dictionary.project'), value: this.projects, isProjects: true },
      ]
    },
  },
  watch: {
    profile: {
      handler: function (val) {
        if (val) {
          this.isShowSystemResource = !!(val.value && val.value[SHOW_SYSTEM_RESOURCE])
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    getRoles (rlist) {
      const roles = []
      for (let i = 0; i < rlist.length; i++) {
        roles[i] = rlist[i].name
      }
      return roles
    },
    async doUpdateShowSystemRsChangeHandle (v) {
      try {
        this.isShowSystemResource = !!v
        await this.$store.dispatch('profile/update', { [SHOW_SYSTEM_RESOURCE]: !!v })
      } catch (error) {
        this.isShowSystemResource = !v
        throw error
      }
    },
  },
}
</script>

<style lang="less" scoped>
.user-info-item-label {
  width: 190px;
}
</style>
