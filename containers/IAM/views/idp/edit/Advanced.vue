<template>
  <a-form-model ref="formRef" :model="fd" :rules="rules">
    <template v-if="isCommon">
      <a-form-model-item :label="$t('common_516')" :extra="$t('common_504', [templateLabel])" prop="user_id_attribute">
        <a-input v-model:value="fd.user_id_attribute" />
      </a-form-model-item>
      <a-form-model-item :label="$t('system.field.username')" :extra="$t('common_505', [templateLabel])" prop="user_name_attribute">
        <a-input v-model:value="fd.user_name_attribute" />
      </a-form-model-item>
    </template>
    <a-form-model-item :label="$t('common_501')" prop="auto_create_user">
      <a-switch v-model:checked="fd.auto_create_user">{{$t('common_499')}}</a-switch>
      <template slot="extra">{{$t('common_513')}}<br />{{$t('common_514')}}</template>
    </a-form-model-item>
    <template v-if="fd.auto_create_user">
      <a-form-model-item :label="$t('common_503', [$t('dictionary.domain')])" :extra="$t('system.text_229', [$t('dictionary.domain')])" prop="target_domain">
        <base-select
          v-if="isAdmin"
          @update:resList="resTargetDomain"
          :disabled="!!fd.project_domain"
          v-model:value="fd.target_domain"
          resource="domains"
          filterable
          version="v1"
          :select-props="{
            placeholder: $t('common_656')
          }" />
          <span v-else>
            {{projectDomain}}
          </span>
      </a-form-model-item>
      <a-collapse accordion v-if="showCollapse">
        <a-collapse-panel key="1" :header="$t('system.text_214')">
          <a-form-model-item class="mb-0" :label="$t('system.text_205', [$t('dictionary.project')])">
            <a-row :gutter="8">
              <a-col :span="10">
                <a-form-model-item :extra="$t('common_506', [templateLabel,$t('dictionary.user'),$t('dictionary.project')])" prop="default_project_id">
                  <base-select
                    v-model:value="fd.default_project_id"
                    resource="projects"
                    version="v1"
                    :params="projectParams"
                    remote
                    v-model:item="project"
                    :remote-fn="q => ({ filter: `name.contains(${q})` })"
                    :select-props="{ placeholder: $t('rules.project') }" />
                </a-form-model-item>
              </a-col>
              <a-col :span="14" v-if="isCommon">
                <template v-if="showProjectInput">
                  <a-form-model-item>
                    <div class="d-flex align-items-center">
                      <div class="flex-fill mr-1">
                        <a-input v-model:value="fd.project_attribute" :placeholder="$t('common_507', [templateLabel,$t('dictionary.project'),templateLabel.toLocaleLowerCase()])" />
                      </div>
                      <a-tooltip placement="right">
                        <span slot="title">{{$t('common_517', [templateLabel])}}</span>
                        <icon type="question" />
                      </a-tooltip>
                      <a-button type="link" @click="showProjectInput = !showProjectInput">{{$t('common_518', [templateLabel, this.$t('dictionary.project')]) }}</a-button>
                    </div>
                    <div slot="extra">
                      <a-checkbox v-model:checked="fd.auto_create_project">{{$t('common_519')}}</a-checkbox>
                      <br />{{$t('common_520')}}</div>
                  </a-form-model-item>
                </template>
                <template v-else>
                  <a-button type="link" @click="showProjectInput = true">{{$t('common_521', [templateLabel, this.$t('dictionary.project')]) }}</a-button>
                </template>
              </a-col>
            </a-row>
          </a-form-model-item>
          <a-form-model-item class="mb-0" :label="$t('system.text_205', [$t('dictionary.role')])">
            <a-row :gutter="8">
              <a-col :span="10">
                <a-form-model-item :extra="$t('common_508', [templateLabel,$t('dictionary.user'),$t('dictionary.role'),$t('dictionary.project')])" prop="default_role_id">
                  <base-select
                    v-model:value="fd.default_role_id"
                    resource="roles"
                    version="v1"
                    :params="roleParams"
                    remote
                    :mapper="roleMapper"
                    :remote-fn="q => ({ filter: `name.contains(${q})` })"
                    :select-props="{ placeholder: $t('rules.role') }" />
                </a-form-model-item>
              </a-col>
              <a-col :span="14" v-if="isCommon">
                <template v-if="showRoleInput">
                  <a-form-model-item>
                    <div class="d-flex align-items-center">
                      <div class="flex-fill mr-1">
                        <a-input v-model:value="fd.role_attribute" :placeholder="$t('common_509', [templateLabel,$t('dictionary.role'),templateLabel.toLocaleLowerCase()])" />
                      </div>
                      <a-tooltip placement="right">
                        <span slot="title">{{$t('common_522', [templateLabel])}}</span>
                        <icon type="question" />
                      </a-tooltip>
                      <a-button type="link" @click="showRoleInput = !showRoleInput">{{$t('common_518', [templateLabel, this.$t('dictionary.role')])}}</a-button>
                    </div>
                  </a-form-model-item>
                </template>
                <template v-else>
                  <a-button type="link" @click="showRoleInput = true">{{$t('common_521', [templateLabel, this.$t('dictionary.role')])}}</a-button>
                </template>
              </a-col>
            </a-row>
          </a-form-model-item>
          <template v-if="isCommon">
            <a-form-model-item :label="$t('scope.text_245')" :extra="$t('common_510', [templateLabel])" prop="user_displayname_attribute">
              <a-input v-model:value="fd.user_displayname_attribute" />
            </a-form-model-item>
            <a-form-model-item :label="$t('scope.text_553')" :extra="$t('common_511', [templateLabel])" prop="user_email_attribute">
              <a-input v-model:value="fd.user_email_attribute" />
            </a-form-model-item>
            <a-form-model-item :label="$t('scope.text_200')" :extra="$t('common_512', [templateLabel])" prop="user_mobile_attribute">
              <a-input v-model:value="fd.user_mobile_attribute" />
            </a-form-model-item>
          </template>
        </a-collapse-panel>
      </a-collapse>
    </template>
  </a-form-model>
</template>

<script>
export default {
  name: 'IDPEditAdvanced',
  props: {
    fd: {
      type: Object,
      required: true,
    },
    templateData: {
      type: Object,
      required: true,
    },
    offsetWrapperCol: {
      type: Object,
      required: true,
    },
    isCommon: {
      type: Boolean,
      required: true,
    },
  },
  data () {
    return {
      isAdmin: this.$store.getters.isAdminMode,
      isDomain: this.$store.getters.isDomainMode,
      projectDomain: this.$store.getters.userInfo.projectDomain,
      projectDomainId: this.$store.getters.userInfo.projectDomainId,
      scope: this.$store.getters.scope,
      showProjectInput: false,
      showRoleInput: false,
      project: {},
      rules: {
        user_id_attribute: [
          { required: true, message: this.$t('common_607') },
        ],
        user_name_attribute: [
          { required: true, message: this.$t('common_608') },
        ],
      },
    }
  },
  computed: {
    projectParams () {
      return {
        limit: 0,
        scope: this.scope,
        project_domains: this.fd.target_domain,
      }
    },
    roleParams () {
      return {
        limit: 0,
        scope: this.scope,
        project_domains: ['default', this.fd.target_domain],
      }
    },
    showCollapse () {
      return this.fd.target_domain || this.isDomain
    },
    templateKey () {
      return this.templateData.key
    },
    templateLabel () {
      return this.templateData.label
    },
  },
  watch: {
    'fd.target_domain' () {
      this.fd.default_project_id = undefined
      this.fd.project_attribute = undefined
    },
    'fd.template': {
      async handler (val) {
        const attributeInitialValues = {
          cas: {
            user_id_attribute: 'cas:user',
            user_name_attribute: 'cas:user',
          },
          oidc: {
            user_id_attribute: 'name',
            user_name_attribute: 'name',
          },
          saml: {},
        }
        let initialValues = {
          user_id_attribute: undefined,
          user_name_attribute: undefined,
        }
        if (attributeInitialValues[val]) {
          initialValues = {
            ...initialValues,
            ...attributeInitialValues[val],
          }
        }
        await this.$nextTick()
        Object.assign(this.fd, initialValues)
      },
      immediate: true,
    },
  },
  methods: {
    async validateForm () {
      await this.$refs.formRef.validate()
    },
    roleMapper (list) {
      if (list && list.length > 0) {
        return list.filter(row => {
          if (row.domain_id === 'default') {
            return row.is_public
          }
          return true
        })
      }
      return []
    },
    resTargetDomain () {
      this.fd.target_domain = this.fd.project_domain
    },
  },
}
</script>
