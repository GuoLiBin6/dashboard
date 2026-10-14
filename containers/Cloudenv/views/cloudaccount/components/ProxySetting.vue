<template>
  <a-form-model-item :label="$t('cloudenv.text_14')" prop="proxy_setting" v-if="isPermission">
    <a-switch
      :checkedChildren="$t('cloudenv.text_84')"
      :unCheckedChildren="$t('cloudenv.text_85')"
      v-model:checked="isOpenProxy" />
    <div v-if="isOpenProxy" class="d-flex align-items-center w-50 mt-3">
      <a-select class="base-select" :loading="loading" showSearch :filterOption="filterOption" v-model:value="form.proxy_setting">
        <a-select-option v-for="item of proxyOpts" :key="item.id" :value="item.id">
          {{item.name}} {{item.id === 'DIRECT' ? $t('cloudenv.text_110') :  null}}
        </a-select-option>
      </a-select>
      <a @click="fetchQueryProxy"><icon :spin="loading" type="sync" class="ml-2" /></a>
    </div>
    <div slot="extra">
      <div v-if="!isOpenProxy">{{$t('cloudenv.text_111')}}</div>
      <div v-else>{{$t('cloudenv.text_112')}}<span class="link-color oc-pointer" @click="createProxySetting">{{$t('cloudenv.text_104')}}</span></div>
    </div>
  </a-form-model-item>
</template>

<script>
import { mapGetters } from 'vuex'
import { hasPermission } from '@/utils/auth'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ProxySetting',
  mixins: [WindowsMixin],
  props: {
    account: {
      type: Object,
    },
    form: {
      type: Object,
      required: true,
    },
    cloneData: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    const { proxy_setting_id } = this.cloneData
    return {
      proxyOpts: [],
      loading: false,
      isOpenProxy: proxy_setting_id && proxy_setting_id !== 'DIRECT',
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'userInfo', 'l3PermissionEnable']),
    isPermission () {
      return hasPermission({ key: 'proxysettings_list' })
    },
  },
  watch: {
    isOpenProxy (val) {
      if (!val) {
        this.form.proxy_setting = ''
      }
    },
  },
  created () {
    if (this.isPermission) {
      this.fetchQueryProxy()
    }
  },
  methods: {
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    resolveDomainId () {
      const domain = this.form.domain
      if (domain && typeof domain === 'object') return domain.key
      return domain
    },
    async fetchQueryProxy () {
      const manager = new this.$Manager('proxysettings')
      if (this.loading) {
        return false
      }
      const params = {
        limit: 0,
      }
      if (this.account) {
        params.project_domain = this.account.domain_id
      } else if (this.l3PermissionEnable && this.isAdminMode) {
        params.project_domain = this.resolveDomainId()
      } else {
        params.project_domain = this.userInfo.projectDomainId
      }
      this.loading = true
      try {
        const { data } = await manager.list({ params })
        this.proxyOpts = data.data
        if (this.proxyOpts && this.proxyOpts.length > 0 && this.account) {
          this.form.proxy_setting = this.account.proxy_setting_id
        } else {
          this.form.proxy_setting = 'DIRECT'
        }
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    createProxySetting () {
      this.createDialog('ProxysettingCreateDialog', {
        domain: this.account ? this.account.domain_id : this.form.domain || {},
        success: async () => {
          await this.fetchQueryProxy()
          if (this.proxyOpts && this.proxyOpts.length > 0) {
            this.form.proxy_setting = this.proxyOpts[0].id
          }
        },
      })
    },
  },
}
</script>
