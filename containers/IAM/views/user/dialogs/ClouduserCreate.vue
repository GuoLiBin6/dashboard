<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }} {{ $t('dictionary.clouduser') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
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
              <a-form-model-item prop="cloudaccount_id" :wrapper-col="{ span: 24 }" class="mb-0">
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
        <a-form-model-item :label="$t('system.text_126')" :extra="nameExtra" prop="generate_name">
          <a-input v-model:value="form.generate_name" :placeholder="namePlaceholder" @change="e => { fi.generate_name = e.target.value }" />
          <template #extra>
            <name-repeated
              res="cloudusers"
              version="v1"
              :name="fi.generate_name" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.cloudgroup')" :extra="$t('cloudenv.clouduser_text2')" prop="cloudgroup_ids">
          <list-select
            v-model:value="form.cloudgroup_ids"
            :listProps="cloudgroupListSelectProps"
            :formatter="formatterLabel"
            :dialog-params="{ mask: false }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('system.text_146')" class="mb-0" :extra="isEnableMail ? '' : $t('system.is_config_mail_tips')" prop="email">
          <a-input v-model:value="form.email" :disabled="!isEnableMail" :placeholder="$t('system.email_placeholder')" />
        </a-form-model-item>
        <a-form-model-item :wrapperCol="{ offset: 3 }" prop="notify">
          <a-checkbox v-model:checked="form.notify" :disabled="!isCanSendNotify">{{ $t('system.email_checkbox_text') }}</a-checkbox>
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
import NameRepeated from '@/sections/NameRepeated'
import ListSelect from '@/sections/ListSelect'
import { getNameFilter } from '@/utils/common/tableFilter'
import { HYPERVISORS_MAP } from '@/constants'

export default {
  name: 'ClouduserCreateForUserDialog',
  components: {
    NameRepeated,
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const providerOptions = Object.entries(HYPERVISORS_MAP).filter(item => {
      return (this.$store.getters.capability.cloud_id_brands || []).includes(item[1].provider) && this.$store.getters.capability.brands.includes(item[1].provider)
    })
    const firstProvider = get(providerOptions, '[0][1].provider')
    return {
      loading: false,
      form: {
        project_id: undefined,
        cloudaccount_id: undefined,
        cloudprovider_id: undefined,
        cloudgroup_ids: undefined,
        generate_name: '',
        email: '',
        notify: false,
      },
      fi: {
        generate_name: '',
        provider: firstProvider,
        cloudaccount: {},
        project: {},
      },
      rules: {
        generate_name: [],
        project_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudaccount_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudprovider_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudgroup_ids: [
          { required: firstProvider === 'Google', message: this.$t('common.select') },
        ],
        email: [
          { validator: this.emailValidator },
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
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      isCanSendNotify: false,
      isEnableMail: false,
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
    namePlaceholder () {
      return this.isGoogle ? this.$t('system.text_496') : this.params.user.name
    },
    nameExtra () {
      return this.isGoogle ? null : this.$t('cloudenv.clouduser_text1')
    },
  },
  watch: {
    isGoogle (val) {
      this.rules.generate_name = val ? [
        { required: true, message: this.$t('common.text00042') },
        { validator: this.$validate('email'), message: this.$t('system.text_497') },
      ] : []
      this.rules.cloudgroup_ids[0].required = val
      this.form.generate_name = ''
      this.form.cloudgroup_ids = undefined
      this.fi.generate_name = ''
    },
    'fi.cloudaccount.provider' () {
      this.form.cloudgroup_ids = undefined
      this.form.cloudprovider_id = undefined
    },
    'fi.project.id' () {
      this.form.cloudgroup_ids = undefined
      this.form.cloudprovider_id = undefined
    },
    'form.email' (val) {
      this.$nextTick(() => {
        this.$refs.formRef?.validateField('email', (errors) => {
          if (!errors || errors.length === 0) {
            this.isCanSendNotify = !!val
          } else {
            this.isCanSendNotify = false
          }
        })
      })
    },
  },
  unmounted () {
    this.um = null
  },
  created () {
    this.um = new this.$Manager('users', 'v1')
    this.fetchProjects()
    this.fetchReceivers()
  },
  methods: {
    emailValidator (rule, value, callback) {
      if (R.isEmpty(value) || R.isNil(value)) {
        return callback()
      }
      return this.$validate('email')(rule, value, callback)
    },
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
    async fetchReceivers () {
      this.isEnableMail = false
      try {
        const params = { scope: this.$store.getters.scope, id: this.params.user.id }
        const response = await new this.$Manager('receivers', 'v1').list({ params })
        const receivers = response.data.data || []
        if (receivers.length > 0) {
          const receiver = receivers[0]
          if (receiver.enabled_contact_types.includes('email')) {
            this.isEnableMail = true
            this.form.email = receiver.email
          }
        }
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
