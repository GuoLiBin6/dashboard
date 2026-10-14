<template>
  <div>
    <a-form-model-item class="mb-0" prop="durationStandard">
      <a-radio-group :value="durationStandard" @update:value="onStandardUpdate" @change="onStandardChange">
        <a-radio-button v-for="item in opts" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="showDuration" prop="duration">
      <duration-input :value="duration" @update:value="onDurationUpdate" />
    </a-form-model-item>
  </div>
</template>

<script>
import { getDurationLabel } from '@/utils/utils'
import createFormFieldDraftMixin from '@/mixins/createFormFieldDraft'
import { DRAFT_KIND } from '@/utils/createFormDraft'

const defaultOpts = ['none', '1h', '6h', '1d', '3d', '1w', '1m', 'custom']

export default {
  name: 'Duration',
  mixins: [createFormFieldDraftMixin],
  props: {
    formDraftKey: {
      type: String,
      default: '',
    },
    formDraftKind: {
      type: String,
      default: DRAFT_KIND.SELECTION,
    },
    /** 到期释放标准选项：none / 1h / custom ... */
    durationStandard: {
      type: String,
      default: 'none',
    },
    /** custom 时的时长 */
    duration: {
      type: String,
      default: '1h',
    },
    form: {
      type: Object,
    },
    /** 父级 a-form-model 受控对象（必传；字段仍用 v-model 绑定） */
    model: {
      type: Object,
      required: true,
    },
    useServerDuration: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:durationStandard', 'update:duration', 'change'],
  data () {
    return {
      opts: [],
      loading: false,
      showDuration: this.durationStandard === 'custom',
    }
  },
  watch: {
    durationStandard (v) {
      this.showDuration = v === 'custom'
    },
    opts: {
      handler (list) {
        if (Array.isArray(list) && list.length) {
          this.scheduleApplyDurationDraft()
        }
      },
    },
  },
  created () {
    this.getOpts()
  },
  methods: {
    onStandardUpdate (v) {
      this.$emit('update:durationStandard', v)
    },
    onStandardChange (e) {
      const val = e?.target ? e.target.value : e
      this.showDuration = val === 'custom'
      this.$emit('change', val)
    },
    onDurationUpdate (v) {
      this.$emit('update:duration', v)
    },
    sortOptions (options) {
      const opts = [...options]
      opts.sort((a, b) => {
        const getPriority = (key) => {
          if (key === 'none') return 0
          if (key === 'custom') return 999
          if (key.endsWith('h')) return 1
          if (key.endsWith('d')) return 2
          if (key.endsWith('w')) return 3
          if (key.endsWith('m')) return 4
          if (key.endsWith('y')) return 5
          return 6
        }
        const priorityA = getPriority(a)
        const priorityB = getPriority(b)
        if (priorityA !== priorityB) return priorityA - priorityB
        return (parseInt(a) || 0) - (parseInt(b) || 0)
      })
      return opts
    },
    async getOpts () {
      const opts = [...defaultOpts]
      if (this.useServerDuration) {
        try {
          this.loading = true
          const res = await new this.$Manager('scopedpolicybindings', 'v1').list({
            params: {
              category: 'server_duration',
              scope: this.$store.getters.scope,
              effective: true,
              ignoreErrorStatusCode: [403],
            },
          })
          if (res.data?.data?.length > 0) {
            const { policy = {} } = res.data.data[0]
            const { server_duration = [] } = policy
            if (server_duration.length > 0) {
              this.opts = this.sortOptions(server_duration).map(item => ({
                key: item,
                label: this.getLabel(item),
              }))
              if (!this.opts.some(item => item.key === this.durationStandard)) {
                const next = this.opts.some(item => item.key === this.duration)
                  ? this.duration
                  : this.opts[0].key
                this.$emit('update:durationStandard', next)
                this.showDuration = next === 'custom'
              }
            } else {
              this.opts = opts.map(item => ({ key: item, label: this.getLabel(item) }))
            }
          } else {
            this.opts = opts.map(item => ({ key: item, label: this.getLabel(item) }))
          }
        } catch (error) {
          console.log('error', error)
          this.opts = opts.map(item => ({ key: item, label: this.getLabel(item) }))
        } finally {
          this.loading = false
        }
      } else {
        this.opts = opts.map(item => ({ key: item, label: this.getLabel(item) }))
      }
    },
    scheduleApplyDurationDraft () {
      this.$nextTick(() => this.applyDurationDraft())
    },
    getLabel (item) {
      return getDurationLabel(item)
    },
    serializeFormFieldDraft () {
      if (this.durationStandard == null || this.durationStandard === '') return undefined
      if (this.durationStandard === 'custom') return null
      return { durationStandard: this.durationStandard }
    },
    resolveDurationStandardFromDraft (draft) {
      if (draft == null || draft === '') return undefined
      if (typeof draft === 'string') {
        return draft === 'custom' ? undefined : draft
      }
      if (typeof draft === 'object') {
        const std = draft.durationStandard
        if (std != null && std !== '' && std !== 'custom') return std
      }
      return undefined
    },
    applyDurationDraft () {
      if (!this.opts.length) return false
      const preferredStd = this.resolveDurationStandardFromDraft(this.readFormFieldDraft())
      if (preferredStd == null) return false
      if (!this.opts.some(item => item.key === preferredStd)) return false
      if (this.durationStandard === preferredStd || String(this.durationStandard) === String(preferredStd)) {
        return true
      }
      this.showDuration = false
      this.$emit('update:durationStandard', preferredStd)
      return true
    },
  },
}
</script>
