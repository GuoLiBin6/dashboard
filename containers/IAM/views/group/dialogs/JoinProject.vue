<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('system.text_195', [$t('dictionary.project')]) }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.group')" :count="params.data.length" :action="$t('system.text_195', [$t('dictionary.project')])" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item v-if="isAdminMode" :label="$t('dictionary.domain')" prop="domain">
          <a-radio-group v-if="!l3PermissionEnable" v-model:value="form.domain" @change="domainChange">
            <template v-for="item of domainOptions" :key="item.key">
              <a-radio-button :value="item.key">{{ item.label }}</a-radio-button>
            </template>
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
            v-model:value="form.projects"
            resource="projects"
            version="v1"
            remote
            :params="projectsParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ mode: 'multiple' }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('dictionary.role')" prop="roles">
          <base-select
            v-model:value="form.roles"
            resource="roles"
            version="v1"
            remote
            :params="rolesParams"
            :remote-fn="q => ({ filter: `name.contains(${q})` })"
            :select-props="{ mode: 'multiple' }" />
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
  name: 'GroupJoinProjectDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const domainId = this.params.data[0].domain_id
    return {
      loading: false,
      domain_id: domainId,
      form: {
        domain: domainId,
        projects: undefined,
        roles: undefined,
      },
      rules: {
        projects: [
          {
            required: true,
            message: this.$t('rules.project'),
          },
        ],
        roles: [
          {
            required: true,
            message: this.$t('rules.role'),
          },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['scope', 'l3PermissionEnable', 'isAdminMode']),
    ...mapGetters('auth', ['isSystemAdmin', 'isDomainAdmin']),
    domainOptions () {
      const ret = []
      if ((this.params.data[0].domain_id !== 'default' && this.isAdminMode) || !this.l3PermissionEnable) {
        ret.push({
          label: 'Default',
          key: 'default',
        })
      }
      if (this.l3PermissionEnable) {
        ret.unshift({
          label: this.params.data[0].project_domain,
          key: this.params.data[0].domain_id,
        })
      }
      return ret
    },
    projectsParams () {
      const params = {
        scope: this.scope,
        domain_id: this.domain_id,
      }
      return params
    },
    rolesParams () {
      return {
        scope: this.scope,
        domain_id: this.domain_id,
      }
    },
    domainParams () {
      return {
        scope: this.scope,
      }
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('groups', 'v1')
    if (!this.l3PermissionEnable) {
      this.domain_id = 'default'
      this.form.domain = 'default'
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.manager.performAction({
          id: this.params.data[0].id,
          action: 'join',
          data: this.form,
        })
        this.loading = false
        this.params.success()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    domainChange (val) {
      const domain = val && val.target ? val.target.value : val
      this.domain_id = domain
      this.form.domain = domain
    },
  },
}
</script>
