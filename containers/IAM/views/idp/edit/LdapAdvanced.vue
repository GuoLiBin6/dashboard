<template>
  <div>
    <a-form-model-item :label="$t('common_503', [$t('dictionary.domain')])" :extra="$t('system.text_229', [$t('dictionary.domain')])">
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
  </div>
</template>

<script>
export default {
  name: 'IDPEditLdapAdvanced',
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
      projectDomain: this.$store.getters.userInfo.projectDomain,
    }
  },
  watch: {
    'fd.target_domain' () {
      this.fd.default_project_id = undefined
      this.fd.project_attribute = undefined
    },
  },
  methods: {
    resTargetDomain () {
      this.fd.target_domain = this.fd.project_domain
    },
  },
}
</script>
