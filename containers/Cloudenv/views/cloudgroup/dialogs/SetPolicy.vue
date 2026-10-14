<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.cloudgroup_single_action2') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudgroup')" :count="params.data.length" :action="$t('cloudenv.cloudgroup_single_action2')" />
      <dialog-table class="mb-2" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('dictionary.policy')" prop="cloudpolicy_ids">
          <list-select
            v-model:value="form.cloudpolicy_ids"
            :listProps="policySelectProps"
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
import get from 'lodash/get'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import ListSelect from '@/sections/ListSelect'
import { getNameFilter } from '@/utils/common/tableFilter'

export default {
  name: 'CloudgroupSetPolicyDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cloudpolicy_ids: get(this.params.data[0], 'cloudpolicies', []).map(item => item.id),
      },
      policySelectProps: {
        list: this.$list.createList(this, {
          id: this.id,
          resource: 'cloudpolicies',
          apiVersion: 'v1',
          getParams: () => {
            return {
              scope: this.$store.getters.scope,
              manager_id: this.params.data[0].manager_id,
              cloudaccount_id: this.params.data[0].cloudaccount_id,
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
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.params.onManager('performAction', {
          steadyStatus: ['available'],
          id: this.params.data[0].id,
          managerArgs: {
            action: 'set-policies',
            data: {
              ...this.form,
              provider: this.params.data[0].provider,
            },
          },
        })
        if (this.params.success) {
          this.params.success()
        }
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
