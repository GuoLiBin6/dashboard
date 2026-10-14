<template>
  <div v-if="shareModeShow">
    <a-form-model-item :label="$t('cloudenv.text_282')" :extra="extra" prop="share_mode">
      <a-radio-group v-model:value="form.share_mode">
        <template v-for="item of shareModeOptions" :key="item.key">
          <a-radio-button :value="item.key">{{ item.label }}</a-radio-button>
        </template>
      </a-radio-group>
    </a-form-model-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'ShareMode',
  props: {
    form: {
      type: Object,
      required: true,
    },
    cloneData: {
      type: Object,
      default: () => ({}),
    },
  },
  data () {
    let initialShareMode = 'account_domain'
    if (this.cloneData.public_scope === 'system') {
      initialShareMode = 'global'
    }
    return {
      shareModeOptions: [
        { key: 'account_domain', label: this.$t('cloudenv.text_285') },
        { key: 'global', label: this.$t('cloudenv.global_share') },
      ],
      initialShareMode,
    }
  },
  computed: {
    ...mapGetters(['l3PermissionEnable', 'isAdminMode']),
    shareModeShow () {
      return this.l3PermissionEnable && this.isAdminMode
    },
    extra () {
      const shareModeExtra = {
        account_domain: this.$t('cloudenv.text_288', [this.$t('dictionary.cloudaccount'), this.$t('dictionary.domain'), this.$t('dictionary.project'), this.$t('dictionary.cloudaccount')]),
        global: this.$t('cloudenv.global_share_tip'),
      }
      return shareModeExtra[this.form.share_mode]
    },
  },
  mounted () {
    if (this.form.share_mode === undefined) {
      this.form.share_mode = this.initialShareMode
    }
  },
}
</script>
