<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.text_492') }}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <template v-if="showDomainSelect">
          <a-form-model-item :label="`${$t('network.text_205', [$t('dictionary.domain')])}`" prop="project_domain">
            <base-select
              v-model:value="form.project_domain"
              resource="domains"
              version="v1"
              :params="domainProps"
              filterable
              :select-props="{ placeholder: $t('rules.domain') }" />
          </a-form-model-item>
        </template>
        <a-form-model-item :label="$t('dictionary.cloudprovider')" prop="manager_id">
          <base-select
            v-model:value="form.manager_id"
            resource="cloudproviders"
            filterable
            isDefaultSelect
            :params="cloudproviderParams"
            v-model:item="formFi.cloudprovider" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.serverCreateName')" @change="e => { formFi.generate_name = e.target.value }" />
          <name-repeated
            v-if="formFi.generate_name"
            res="servers"
            version="v1"
            :name="formFi.generate_name"
            :params="nameRepeatParams" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.policy')" prop="cloudpolicy_ids">
          <list-select
            v-model:value="form.cloudpolicy_ids"
            :listProps="policySelectProps"
            multiple
            :formatter="row => `${row.name} / ${row.description || ''}`"
            :dialog-params="{ mask: false, width: 900, title: $t('rules.policy') }" />
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
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import NameRepeated from '@/sections/NameRepeated'
import ListSelect from '@/sections/ListSelect'
import { getNameFilter } from '@/utils/common/tableFilter'

export default {
  name: 'CloudgroupCreateDialog',
  components: {
    NameRepeated,
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        manager_id: undefined,
        cloudpolicy_ids: undefined,
        project_domain: undefined,
      },
      formFi: {
        generate_name: '',
        cloudprovider: {},
      },
      rules: {
        name: [
          { required: true, message: this.$t('common.text00042') },
        ],
        manager_id: [
          { required: true, message: this.$t('common.select') },
        ],
        project_domain: [
          { required: true, message: this.$t('rules.domain') },
        ],
      },
      policySelectProps: {
        list: this.$list.createList(this, {
          id: this.id,
          resource: 'cloudpolicies',
          apiVersion: 'v1',
          getParams: () => {
            return {
              scope: this.$store.getters.scope,
              manager_id: this.form.manager_id,
            }
          },
          filterOptions: {
            name: getNameFilter(),
            description: {
              label: this.$t('table.title.desc'),
              filter: true,
              formatter: val => {
                return `description.contains(${val})`
              },
            },
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
            title: this.$t('table.title.desc'),
            showOverflow: 'title',
          },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode']),
    nameRepeatParams () {
      return {
        provider: this.formFi.cloudprovider?.provider,
      }
    },
    domainProps () {
      return {
        scope: this.scope,
      }
    },
    showDomainSelect () {
      return this.isAdminMode && !(this.params.cloudaccount?.domain_id)
    },
    cloudproviderParams () {
      const ret = {
        scope: this.$store.getters.scope,
        cloudaccount_id: this.params.cloudaccount.id,
      }
      const { cloud_id_brands = [], brands = [] } = this.$store.getters.capability || {}
      const list = [...cloud_id_brands].filter(l => brands.includes(l))
      ret.brands = list
      return ret
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        values.project_domain = values.project_domain || this.params.cloudaccount?.domain_id
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
  },
}
</script>
