<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.cloudgroup_single_action1') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.cloudgroup')" :count="params.data.length" :action="$t('cloudenv.cloudgroup_single_action1')" />
      <dialog-table class="mb-2" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.coludgroup_text001')" prop="clouduser_id">
          <list-select
            v-model:value="form.clouduser_id"
            :listProps="clouduserSelectProps"
            :formatter="row => `${row.name} / ${row.cloudaccount || ''}`"
            :multiple="false"
            :dialog-params="{ mask: false, width: 900, title: $t('rules.clouduser') }" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import ListSelect from '@/sections/ListSelect'
import { getNameFilter } from '@/utils/common/tableFilter'
import { getStatusTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'CloudgroupAddUserDialog',
  components: {
    ListSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        clouduser_id: undefined,
      },
      rules: {
        clouduser_id: [
          { required: true, message: this.$t('common.select') },
        ],
      },
      clouduserSelectProps: {
        list: this.$list.createList(this, {
          resource: 'cloudusers',
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
          getStatusTableColumn({ statusModule: 'clouduser' }),
          {
            field: 'cloudaccount',
            title: this.$t('dictionary.cloudaccount'),
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
            action: 'add-user',
            data: {
              ...this.form,
              provider: this.params.data[0].provider,
            },
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
