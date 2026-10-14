<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.clouduser_list_a2') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.clouduser')" :count="params.data.length" :action="$t('cloudenv.clouduser_list_a2')" />
      <dialog-table class="mb-2" :data="params.data" :columns="columns" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('cloudenv.clouduser_list_t4')" prop="user_id">
          <template v-if="userLoading">
            <a-spin />
          </template>
          <template v-else>
            <user-select
              v-model="form.user_id"
              v-model:project="formFi.project"
              :cloudaccount-id="params.cloudaccount.id"
              :default-domain-id="userInfo.projectDomainId"
              :default-user-id="userInfo.id"
              :default-project-id="userInfo.projectId"
              :cloudprovider-id="params.data[0].cloudprovider_id" />
          </template>
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
import UserSelect from '../components/UserSelect'

export default {
  name: 'ClouduserChangeOwnerDialog',
  components: {
    UserSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      userLoading: false,
      form: {
        user_id: undefined,
      },
      formFi: {
        project: {},
      },
      rules: {
        user_id: [
          { required: false, message: this.$t('common.select') },
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
    ...mapGetters(['userInfo']),
    columns () {
      const columns = this.params.columns.filter(item => {
        return ['name', 'status', 'owner_name'].indexOf(item.field) !== -1
      })
      return columns
    },
  },
  unmounted () {
    this.um = null
  },
  created () {
    this.um = new this.$Manager('users', 'v1')
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          user_id: this.form.user_id,
          project_id: this.formFi.project.id,
        }
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          steadyStatus: 'available',
          managerArgs: {
            action: 'change-owner',
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
