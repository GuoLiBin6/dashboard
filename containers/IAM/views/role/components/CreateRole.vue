<template>
  <a-form-model
    ref="formRef"
    :model="form"
    :rules="rules">
    <a-form-model-item :label="$t('system.text_101')" prop="name">
      <a-input v-model:value="form.name" />
    </a-form-model-item>
    <a-form-model-item :label="$t('common.description')" prop="description">
      <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
    </a-form-model-item>
    <a-form-model-item :label="$t('dictionary.domain')" v-if="isAdminMode && l3PermissionEnable" prop="domain_id">
      <base-select
        v-model="form.domain_id"
        resource="domains"
        version="v1"
        remote
        :params="{ enabled: true }"
        :remote-fn="q => ({ filter: `name.contains(${q})` })"
        :select-props="{ mode: 'default' }"
        v-model:initLoaded="domainOpsLoaded" />
    </a-form-model-item>
  </a-form-model>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'CreateRoleForm',
  props: {
    domain: String,
  },
  data () {
    return {
      domainOpsLoaded: false,
      form: {
        name: undefined,
        description: undefined,
        domain_id: undefined,
      },
      rules: {
        name: [
          {
            required: true,
            message: this.$t('system.text_194'),
            whitespace: true,
          },
        ],
        domain_id: [
          {
            required: true,
            message: this.$t('rules.domain'),
          },
        ],
      },
    }
  },
  computed: mapGetters(['isAdminMode', 'l3PermissionEnable']),
  watch: {
    domainOpsLoaded (val) {
      if (val && this.domain) {
        this.form.domain_id = this.domain
      }
    },
  },
  unmounted () {
    this.manager = null
  },
  created () {
    this.manager = new this.$Manager('roles', 'v1')
  },
  methods: {
    async create () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const response = await this.manager.create({
          data: { ...this.form },
        })
        return response
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
