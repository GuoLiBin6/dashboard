<template>
  <div>
    <a-form-model-item class="mb-0" :prop="enableField">
      <a-switch
        v-model:checked="model[enableField]"
        :checkedChildren="$t('compute.text_115')"
        :unCheckedChildren="$t('compute.text_116')"
        :disabled="switchDisabled"
        @change="change" />
    </a-form-model-item>
    <a-form-model-item class="mt-2" v-if="backupEnable && !isProjectMode" :prop="backupField">
      <base-select
        v-model:value="model[backupField]"
        :options="hostList"
        :select-props="{ placeholder: $t('compute.text_117') }"
        :disabled-items="disabledItems" />
    </a-form-model-item>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as R from 'ramda'

import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'

export default {
  name: 'Backup',
  mixins: [createFormFieldDraftMixin],
  inject: { form: { default: undefined } },
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    /** selection：switch / 单选，local + session 双写、可跨 tab 回填 */
    formDraftKind: {
      type: String,
      default: 'selection',
    },
    enableField: {
      type: String,
      default: 'backupEnable',
    },
    backupField: {
      type: String,
      default: 'backup',
    },
    model: {
      type: Object,
      required: true,
    },
    disabledItems: {
      type: Array,
      default: () => [],
    },
    diskType: { // 系统盘磁盘类型
      type: String,
    },
    domain: Object,
    availableHostCount: Number, // 可用的宿主机数量
    hostParams: {
      type: Object,
    },
  },
  data () {
    return {
      hostList: [],
      backupEnable: !!this.model[this.enableField],
    }
  },
  computed: {
    ...mapGetters(['isProjectMode']),
    switchDisabled () {
      if (this.diskType === 'gpfs') return true
      if (this.availableHostCount < 2) return true
      return false
    },
  },
  watch: {
    backupEnable: {
      handler (val) {
        if (val) this.fetchBackupHosts()
      },
      immediate: true,
    },
    model: {
      deep: true,
      handler (m) {
        if (!m) return
        const next = !!m[this.enableField]
        if (this.backupEnable !== next) this.backupEnable = next
      },
    },
    hostList: {
      immediate: true,
      handler () {
        // 列表就绪只补宿主机，勿整包 restore（否则草稿 backupEnable:false 会盖掉用户刚开的开关）
        this.$nextTick(() => {
          if (!this.canRestoreFormFieldDraft()) return
          if (!this.backupEnable) return
          const draft = this.sanitizeDraftForRestore(this.readFormFieldDraft())
          if (!draft?.backup) return
          this.writeBackupIfInHostList(draft.backup)
        })
      },
    },
    hostParams: {
      deep: true,
      handler () {
        if (this.backupEnable) this.fetchBackupHosts()
      },
    },
  },
  created () {
    this.backupEnable = !!this.model[this.enableField]
  },
  methods: {
    normalizeBackupId (val) {
      if (!val) return ''
      if (typeof val === 'object') return val.key || val.id || val.value || ''
      return val
    },
    getCreateFormFieldDraftSnapshot () {
      const backupEnable = !!this.model[this.enableField]
      if (!backupEnable) return { backupEnable: false, backup: '' }
      return {
        backupEnable: true,
        backup: this.normalizeBackupId(this.model[this.backupField]) || '',
      }
    },
    applyCreateFormFieldDraft (draft) {
      if (!draft) return
      // 跨 tab：不自动开开关；开关已开时（用户打开后拉列表）再回填宿主机
      if (this.isFormFieldDraftFromLocal()) {
        if (!this.backupEnable) return
        this.writeBackupIfInHostList(draft.backup)
        return
      }
      if (draft.backupEnable) {
        this.backupEnable = true
        this.$set(this.model, this.enableField, true)
        this.writeBackupIfInHostList(draft.backup)
      } else if (draft.backupEnable === false) {
        this.backupEnable = false
        this.$set(this.model, this.enableField, false)
        this.$delete(this.model, this.backupField)
      }
    },
    /** hostList 命中才写备份机 */
    writeBackupIfInHostList (backupId) {
      const id = this.normalizeBackupId(backupId)
      if (!id || !this.backupEnable) return
      const hostList = Array.isArray(this.hostList) ? this.hostList : []
      if (!hostList.length || !hostList.some(item => item.id === id)) return
      if (this.normalizeBackupId(this.model[this.backupField]) === id) return
      this.$set(this.model, this.backupField, id)
    },
    change (val) {
      this.backupEnable = val
      this.$set(this.model, this.enableField, val)
      if (!val) this.$delete(this.model, this.backupField)
    },
    async fetchBackupHosts () {
      if (!R.is(Object, this.hostParams) || this.isProjectMode) return
      try {
        const { data: { data = [] } } = await new this.$Manager('hosts', 'v2').list({ params: this.hostParams })
        this.hostList = data
      } catch (error) {
        throw error
      }
    },
  },
}
</script>
