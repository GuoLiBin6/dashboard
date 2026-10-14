<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('samluser.create_title') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.clouduser_list_t4')" :extra="$t('common_625')" prop="owner_id">
          <user-select
            v-model="form.owner_id"
            :cloudaccount-id="params.cloudaccount.id"
            v-model:user="formFi.user"
            v-model:project="formFi.project"
            :cloudprovider-id="formFi.cloudprovider.id"
            :defaultDomainId="params.defaultDomainId"
            :defaultProjectId="params.defaultProjectId"
            :defaultUserId="params.userId" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.cloudprovider')" prop="cloudprovider_id">
          <base-select
            v-model:value="form.cloudprovider_id"
            resource="cloudproviders"
            filterable
            isDefaultSelect
            :params="cloudproviderParams"
            v-model:item="formFi.cloudprovider"
            @change="cloudproviderChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.cloudusergroup')" :extra="$t('samluser.create_cloudgroup_extra')" prop="cloudgroup_id">
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
import * as R from 'ramda'
import { h } from 'vue'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { getNameFilter } from '@/utils/common/tableFilter'
import { getNameDescPopoverColumns } from '@/utils/common/listBodyCellPopover'
import ListSelect from '@/sections/ListSelect'
import UserSelect from '../components/UserSelect'

export default {
  name: 'SamluserCreateDialog',
  components: {
    UserSelect,
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  props: {
    params: {
      type: Object,
      default: () => {},
    },
  },
  data () {
    return {
      loading: false,
      form: {
        owner_id: undefined,
        cloudprovider_id: undefined,
        cloudgroup_id: undefined,
      },
      formFi: {
        user: {},
        cloudprovider: {},
        project: {},
      },
      rules: {
        owner_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudprovider_id: [
          { required: true, message: this.$t('common.select') },
        ],
        cloudgroup_id: [
          { required: true, message: this.$t('common.select') },
        ],
      },
      cloudgroupListSelectProps: {
        list: this.$list.createList(this, {
          id: this.id,
          resource: 'cloudgroups',
          apiVersion: 'v1',
          getParams: () => {
            const params = {
              manager_id: this.formFi.cloudprovider.id,
            }
            if (this.$store.getters.isAdminMode) {
              params.domain_id = this.params.cloudaccount.domain_id
            } else {
              params.scope = this.$store.getters.scope
            }
            return params
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
            title: this.$t('cloudenv.text_327'),
            showOverflow: 'title',
          },
          {
            field: 'cloudpolicies',
            title: this.$t('cloudenv.text_329'),
            slots: {
              default: ({ row }) => {
                if (R.isNil(row.cloudpolicies) || R.isEmpty(row.cloudpolicies)) return this.$t('cloudenv.text_330')
                return [
                  h('list-body-cell-popover', {
                    text: this.$t('cloudenv.text_245', [(row.cloudpolicies && row.cloudpolicies.length) || 0]),
                  }, {
                    default: () => [
                      h('table-lite-grid', {
                        showOverflow: 'title',
                        rowConfig: { isHover: true },
                        columnConfig: { resizable: false },
                        data: row.cloudpolicies,
                        columns: getNameDescPopoverColumns({
                          nameTitle: this.$t('common.name'),
                          descTitle: this.$t('table.title.desc'),
                          rows: row.cloudpolicies,
                        }),
                      }),
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
    }
  },
  computed: {
    cloudproviderParams () {
      return {
        scope: this.$store.getters.scope,
        cloudaccount_id: this.params.cloudaccount.id,
      }
    },
    isGoogle () {
      return this.params.cloudaccount.brand === 'Google'
    },
  },
  methods: {
    cloudproviderChange () {
      this.form.cloudgroup_id = null
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (!this.isGoogle) {
          values.cloudaccount_id = this.params.cloudaccount.id
        }
        values.project_id = this.formFi.project.id
        values.project_domain = this.formFi.project.project_domain
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
  },
}
</script>
