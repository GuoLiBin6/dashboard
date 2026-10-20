<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('common_114')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.project')" :count="params.data.length" :action="$t('common_114')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 2)" />
      <a-form-model ref="formRef" :model="form" :rules="formRules">
        <a-form-model-item :label="$t('system.text_48')">
          <a-radio-group v-model:value="type" @change="handleTypeChange">
            <a-radio-button
              v-for="item of typeOptions"
              :key="item.value"
              :value="item.value">
              {{item.label}}
            </a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item v-if="isAdminMode" :label="$t('dictionary.domain')" prop="domain">
          <base-select
            v-model:value="form.domain"
            version="v1"
            resource="domains"
            filterable
            :params="domainParams"
            :select-props="{ placeholder: $t('rules.project') }"
            @change="domainChange" />
        </a-form-model-item>
        <a-form-model-item v-if="type === 'group'" :label="$t('dictionary.group')" key="group" prop="groups">
          <base-select
            v-model:value="form.groups"
            resource="groups"
            version="v1"
            remote
            :params="groupsParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :cancel-token="groupsCancelToken"
            :destroyedCallBack="groupDestroyed"
            :select-props="{ mode: 'multiple' }">
            <template v-slot:optionTemplate="{ options }">
              <a-select-option v-for="item in options" :key="item.id" :value="item.id" :disabled="item.__disabled">
                <div class="d-flex">
                  <span class="text-truncate flex-fill mr-2">{{ item.name }}</span>
                  <span style="color: #8492a6; font-size: 13px">{{ $t('dictionary.domain') }}：{{ item.project_domain }}</span>
                </div>
              </a-select-option>
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item v-if="type === 'user'" :label="$t('dictionary.user')" key="user" prop="users">
          <base-select
            v-model:value="form.users"
            resource="users"
            version="v1"
            :params="usersParams"
            remote
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :cancel-token="usersCancelToken"
            :destroyedCallBack="userDestroyed"
            :select-props="{ mode: 'multiple' }"
            @update:items="userSelectChange">
            <template v-slot:optionTemplate="{ options }">
              <a-select-option v-for="item in options" :key="item.id" :value="item.id" :disabled="item.__disabled">
                <div class="d-flex">
                  <span class="text-truncate flex-fill mr-2">{{ item.name }}</span>
                  <span style="color: #8492a6; font-size: 13px">{{ $t('dictionary.domain') }}：{{ item.project_domain }}</span>
                </div>
              </a-select-option>
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.role')" prop="roles">
          <base-select
            v-model:value="form.roles"
            resource="roles"
            version="v1"
            remote
            :params="rolesParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ mode: 'multiple' }">
            <template v-slot:optionTemplate="{ options }">
              <a-select-option v-for="item in options" :key="item.id" :value="item.id" :disabled="item.__disabled">
                <div class="d-flex">
                  <span class="text-truncate flex-fill mr-2">{{ item.name }}</span>
                  <template v-if="domain_id === 'default'">
                    <span style="color: #8492a6; font-size: 13px">{{ $t('dictionary.domain') }}：{{ item.project_domain }}</span>
                  </template>
                </div>
              </a-select-option>
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item v-if="type === 'user' && isSelectedUserDisabled" :label="$t('iam.enabled_user')" :extra="$t('iam.some_user_can_enabled')" prop="enable_all_users">
          <a-switch
            :checkedChildren="$t('common_292')"
            :unCheckedChildren="$t('common_293')"
            v-model:checked="form.enable_all_users" />
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
import axios from 'axios'
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ProjectAddUserOrGroupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const domainId = this.params.data[0].domain_id
    return {
      loading: false,
      domain_id: domainId,
      form: {
        domain: domainId,
        groups: undefined,
        users: undefined,
        roles: undefined,
        enable_all_users: false,
      },
      rules: {
        roles: [
          {
            required: true,
            message: this.$t('rules.role'),
          },
        ],
      },
      type: 'user',
      typeOptions: [
        {
          label: this.$t('common_312'),
          value: 'user',
        },
        {
          label: this.$t('common_308'),
          value: 'group',
        },
      ],
      selectedUsers: [],
    }
  },
  computed: {
    ...mapGetters(['scope', 'isAdminMode']),
    groupsParams () {
      if (this.domain_id !== 'default') {
        return {
          scope: this.scope,
          domain_id: this.domain_id,
        }
      }
      return {
        scope: this.scope,
        domain_id: this.domain_id,
      }
    },
    usersParams () {
      if (this.domain_id !== 'default') {
        return {
          scope: this.scope,
          domain_id: this.domain_id,
          limit: 20,
        }
      }
      return {
        scope: this.scope,
        domain_id: this.domain_id,
        limit: 20,
      }
    },
    rolesParams () {
      return {
        scope: this.scope,
        domain_id: this.domain_id,
        limit: 20,
      }
    },
    domainParams () {
      return {
        scope: this.scope,
      }
    },
    isSelectedUserDisabled () {
      return this.selectedUsers.some(item => !item.enabled)
    },
    formRules () {
      const rules = { ...this.rules }
      if (this.type === 'group') {
        rules.groups = [{ required: true, message: this.$t('rules.group') }]
      } else {
        rules.users = [{ required: true, message: this.$t('rules.user') }]
      }
      return rules
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('projects', 'v1')
    this.groupsCancelToken = new axios.CancelToken(cancel => { this.groupsCancel = cancel })
    this.usersCancelToken = new axios.CancelToken(cancel => { this.usersCancel = cancel })
  },
  methods: {
    handleTypeChange (e) {
      if (e.target.value === 'group') {
        this.groupsCancelToken = new axios.CancelToken(cancel => { this.groupsCancel = cancel })
      } else {
        this.usersCancelToken = new axios.CancelToken(cancel => { this.usersCancel = cancel })
      }
    },
    groupDestroyed () {
      this.groupsCancel()
    },
    userDestroyed () {
      this.usersCancel()
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const data = { ...this.form }
        if (this.type === 'group') {
          delete data.users
          delete data.enable_all_users
        } else {
          delete data.groups
        }
        await this.manager.performAction({
          id: this.params.data[0].id,
          action: 'join',
          data,
        })
        this.loading = false
        this.$bus.$emit('ProjectDirectlyUnderUserListRefresh')
        this.params.success()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    domainChange (val) {
      this.domain_id = val
      this.form.domain = val
    },
    userSelectChange (val) {
      this.selectedUsers = val
    },
  },
}
</script>
