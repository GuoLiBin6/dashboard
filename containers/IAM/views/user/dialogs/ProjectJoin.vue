<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{action}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.user')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item v-if="isAdminMode" :label="$t('dictionary.domain')" prop="domain">
          <a-radio-group v-if="!l3PermissionEnable" v-model:value="form.domain" @change="domainChange">
            <a-radio-button v-for="item in domainOptions" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
          <base-select v-else
            v-model:value="form.domain"
            version="v1"
            resource="domains"
            filterable
            :params="domainParams"
            :select-props="{ placeholder: $t('rules.project') }"
            @change="domainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.project')" prop="projects">
          <base-select
            resource="projects"
            v-model:value="form.projects"
            filterable
            remote
            :select-props="{placeholder: $t('rules.project'), mode: 'multiple'}"
            :params="projectParams">
            <template #optionLabelTemplate="{item}">
              {{item.name}}
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.role')" prop="roles">
          <base-select
            resource="roles"
            v-model:value="form.roles"
            filterable
            remote
            :select-props="{placeholder: $t('rules.role'), mode: 'multiple'}"
            :params="roleParams">
            <template #optionLabelTemplate="{item}">
              {{item.name}}
            </template>
          </base-select>
        </a-form-model-item>
        <a-form-model-item v-if="isUserDisabled" :label="$t('iam.enabled_user')" :extra="$t('iam.user_can_enabled')" prop="enabled">
          <a-switch
            :checkedChildren="$t('common_292')"
            :unCheckedChildren="$t('common_293')"
            v-model:checked="form.enabled" />
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

export default {
  name: 'UserProjectJoinDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const domainId = this.params.data[0].domain_id
    return {
      action: this.$t('system.text_195', [this.$t('dictionary.project')]),
      loading: false,
      domainId,
      form: {
        domain: domainId,
        projects: undefined,
        roles: undefined,
        enabled: false,
      },
      rules: {
        projects: [
          { required: true, message: this.$t('rules.project') },
        ],
        roles: [
          { required: true, message: this.$t('rules.role') },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['isDomainMode', 'isAdminMode', 'l3PermissionEnable', 'scope']),
    domainOptions () {
      return [{
        label: 'Default',
        key: 'default',
      }]
    },
    domainParams () {
      return {
        scope: this.scope,
      }
    },
    projectParams () {
      const ret = {
        scope: this.scope,
        project_domain_id: this.domainId,
        limit: 20,
      }
      return ret
    },
    roleParams () {
      const ret = {
        scope: this.scope,
        project_domain_id: this.domainId,
        limit: 20,
      }
      return ret
    },
    isUserDisabled () {
      return !this.params.data[0].enabled
    },
  },
  created () {
    if (!this.l3PermissionEnable) {
      this.domainId = 'default'
      this.form.domain = 'default'
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      const manager = new this.$Manager('users', 'v1')
      try {
        await this.$refs.formRef.validate()
        await manager.performAction({
          id: this.params.data[0].id,
          action: 'join',
          data: this.form,
        })
        this.cancelDialog()
        this.$bus.$emit('UserSidepageProjectsListRefresh')
        if (this.form.enabled) {
          this.$bus.$emit('RefreshUser', this.params.data[0].id)
        }
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    domainChange (val) {
      const domain = val && val.target ? val.target.value : val
      this.domainId = domain
      this.form.domain = domain
    },
  },
}
</script>
