<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('user.create_samluser') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item :label="$t('cloudenv.clouduser_list_t4')">
          <span>{{ params.user.name }}</span>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.project')" prop="project_id">
          <base-select
            v-model:value="form.project_id"
            filterable
            v-model:item="fi.project"
            :options="projects">
            <template #optionTemplate="{ options }">
              <a-select-option v-for="item in options" :key="item.id" :value="item.id">
                {{ item.name }}<span class="text-color-secondary ml-2">{{ $t('common_624', [$t('dictionary.domain')]) }}: </span>{{ item.project_domain }}
              </a-select-option>
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.cloudaccount')">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-select v-model:value="fi.provider">
                <template v-for="item of providerOptions" :key="item[0]">
                  <a-select-option :value="item[1].provider">
                    <span class="text-color-secondary">{{ $t('common.brand') }}: </span>{{ item[1].label }}
                  </a-select-option>
                </template>
              </a-select>
            </a-col>
            <a-col :span="12">
              <a-form-model-item prop="cloudaccount_id" class="mb-0">
                <base-select
                  v-model:value="form.cloudaccount_id"
                  resource="cloudaccounts"
                  filterable
                  v-model:item="fi.cloudaccount"
                  :params="cloudaccountParams"
                  :mapper="cloudaccountMapper">
                  <template #optionTemplate="{ options }">
                    <a-select-option v-for="item in options" :key="item.id" :value="item.id">
                      <span class="text-color-secondary">{{ $t('dictionary.cloudaccount') }}: </span>{{ item.name }}
                    </a-select-option>
                  </template>
                </base-select>
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <template v-if="isGoogle">
          <a-form-model-item :label="$t('dictionary.cloudprovider')" prop="cloudprovider_id">
            <base-select
              v-model:value="form.cloudprovider_id"
              resource="cloudproviders"
              filterable
              :params="cloudproviderParams" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('dictionary.cloudgroup')" :extra="$t('cloudenv.clouduser_text2')" prop="cloudgroup_id">
          <list-select
            v-model:value="form.cloudgroup_id"
            :listProps="cloudgroupListSelectProps"
            :formatter="formatterLabel"
            :dialog-params="{ mask: false }"
            :multiple="false" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import get from 'lodash/get'
import * as R from 'ramda'
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import ListSelect from '@/sections/ListSelect'
import { getNameFilter } from '@/utils/common/tableFilter'
import { HYPERVISORS_MAP } from '@/constants'

export default {
  name: 'SamluserCreateForUserDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const providerOptions = Object.entries(HYPERVISORS_MAP).filter(item => {
      return (this.$store.getters.capability.saml_auth_brands || []).includes(item[1].provider) && this.$store.getters.capability.brands.includes(item[1].provider)
    })
    const firstProvider = get(providerOptions, '[0][1].provider')
    return {
      loading: false,
      form: {
        project_id: undefined,
        cloudaccount_id: undefined,
        cloudprovider_id: undefined,
        cloudgroup_id: undefined,
      },
      fi: {
        provider: firstProvider,
        cloudaccount: {},
        project: {},
      },
      rules: {
        project_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudaccount_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudprovider_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudgroup_id: [
          { required: true, message: this.$t('common.select') },
        ],
      },
      projects: [],
      providerOptions,
      cloudgroupListSelectProps: {
        list: this.$list.createList(this, {
          id: this.id,
          resource: 'cloudgroups',
          apiVersion: 'v1',
          getParams: () => {
            return {
              scope: this.$store.getters.scope,
              provider: this.fi.provider,
            }
          },
          filterOptions: {
            name: getNameFilter(),
          },
        }),
        columns: [
          {
            field: 'name',
            title: this.$t('table.title.name'),
            showOverflow: 'title',
          },
          {
            field: 'description',
            title: this.$t('system.text_193'),
            showOverflow: 'title',
          },
          {
            field: 'cloudpolicies',
            title: this.$t('cloudenv.text_329'),
            type: 'expand',
            slots: {
              default: ({ row }) => {
                return [this.$t('cloudenv.text_245', [(row.cloudpolicies && row.cloudpolicies.length) || 0])]
              },
              content: ({ row }) => {
                if (R.isNil(row.cloudpolicies) || R.isEmpty(row.cloudpolicies)) return this.$t('cloudenv.text_330')
                return [
                  h('table-lite-grid', {
                    showOverflow: 'title',
                    data: row.cloudpolicies,
                    columns: [
                      { field: 'name', title: this.$t('common.name') },
                      { field: 'description', title: this.$t('table.title.desc'), formatter: ({ cellValue }) => cellValue || '-' },
                    ],
                  }),
                ]
              },
            },
          },
        ],
      },
    }
  },
  computed: {
    cloudaccountParams () {
      const params = {
        scope: this.$store.getters.scope,
        provider: this.fi.provider,
        enabled: true,
        health_status: 'normal',
        status: 'connected',
        tenant_id: this.fi.project.id,
      }
      if (this.$store.getters.isAdminMode) {
        params.project_domain = this.fi.project.domain_id
      }
      if (this.$store.getters.isDomainMode) {
        params.project_domains = [this.fi.project.domain_id]
      }
      return params
    },
    cloudproviderParams () {
      return {
        scope: this.$store.getters.scope,
        cloudaccount_id: this.fi.cloudaccount.id || '',
        tenant_id: this.fi.project.id,
      }
    },
    isGoogle () {
      return this.fi.provider === 'Google'
    },
  },
  watch: {
    isGoogle (val) {
      this.rules.cloudgroup_id[0].required = !!val
      this.form.cloudgroup_id = undefined
      this.form.cloudprovider_id = undefined
    },
    'fi.cloudaccount.provider' () {
      this.form.cloudgroup_id = undefined
      this.form.cloudprovider_id = undefined
    },
    'fi.project.id' () {
      this.form.cloudgroup_id = undefined
      this.form.cloudprovider_id = undefined
    },
  },
  unmounted () {
    this.um = null
  },
  created () {
    this.um = new this.$Manager('users', 'v1')
    this.fetchProjects()
  },
  methods: {
    async fetchProjects () {
      try {
        const response = await this.um.getSpecific({
          id: this.params.user.id,
          spec: 'projects',
          params: {
            scope: this.$store.getters.scope,
          },
        })
        this.projects = response.data.data || []
        this.form.project_id = this.projects[0]?.id
      } catch (error) {
        throw error
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        values.owner_id = this.params.user.id
        values.project_domain = this.fi.project.project_domain
        await this.params.onManager('create', {
          managerArgs: {
            data: values,
          },
        })
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
    formatterLabel (row) {
      return row.description ? `${row.name} / ${row.description}` : row.name
    },
    cloudaccountMapper (data) {
      let _data = [...data]
      _data = _data.filter(item => {
        if (this.fi.provider !== 'Google' && item.share_mode === 'provider_domain' && item.project_domain !== this.fi.project.project_domain) {
          return false
        }
        return true
      })
      return _data
    },
  },
}
</script>
