<template>
  <div class="policy-schedtag">
    <div class="d-flex align-items-start mb-2" v-for="(item, i) in schedtagPolicyList" :key="item.key">
      <schedtag-policy
        :model="model"
        class="w-50"
        :item-key="item.key"
        schedtag-root="policySchedtagSchedtags"
        policy-root="policySchedtagPolicys"
        :schedtag-params="{ ...schedtagParams, $t: `schedtag-${i}` }"
        :schedtag-rules="[{ required: true, message: $t('compute.text_123') }]"
        :policy-rules="[{ required: true, message: $t('common_256') }]"
        :policyReactInSchedtag="false"
        @change="onItemFieldChange" />
      <a-button shape="circle" icon="minus" size="small" @click="decrease(item.key, i)" class="mt-2 ml-2" />
    </div>
    <a-button type="primary" shape="circle" icon="plus" size="small" @click="add" />
    <a-button type="link" @click="add">{{$t('add_schedpolicy')}}</a-button>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { SCHEDTAG_POLICY_OPTIONS } from '@/constants'
import SchedtagPolicy from '@/sections/SchedtagPolicy'

const SCHEDTAG_ROOT = 'policySchedtagSchedtags'
const POLICY_ROOT = 'policySchedtagPolicys'

function normalizeSchedtagItem (item) {
  if (!item || typeof item !== 'object') return null
  const id = typeof item.id === 'object'
    ? (item.id?.key || item.id?.id)
    : (item.id || item.schedtag)
  const policy = item.strategy || item.policy
  if (!id && !policy) return null
  return { id, policy }
}

export default {
  name: 'PolicySchedtag',
  components: {
    SchedtagPolicy,
  },
  props: {
    schedtagParams: {
      type: Object,
      required: true,
    },
    form: {
      type: Object,
    },
    model: {
      type: Object,
      required: true,
    },
    initSchedtags: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      schedtagPolicyList: [],
      policyOpts: SCHEDTAG_POLICY_OPTIONS,
      schedtagsApplied: false,
    }
  },
  watch: {
    schedtagParams () {
      if (!this.schedtagsApplied) return
      this.$nextTick(() => {
        setTimeout(() => this.applySchedtagFieldsValue(), 300)
      })
    },
    initSchedtags: {
      deep: true,
      handler (val) {
        if (this.schedtagsApplied) return
        if (Array.isArray(val) && val.length) {
          this.initData(val)
        }
      },
    },
  },
  created () {
    ;[SCHEDTAG_ROOT, POLICY_ROOT].forEach(root => this.ensureMap(root))
    if (Array.isArray(this.initSchedtags) && this.initSchedtags.length) {
      this.initData(this.initSchedtags)
    } else {
      this.add()
    }
  },
  methods: {
    ensureMap (root) {
      if (!this.model[root] || typeof this.model[root] !== 'object') {
        this.$set(this.model, root, {})
      }
    },
    mapGet (root, key) {
      return this.model?.[root]?.[key]
    },
    mapSet (root, key, val) {
      this.ensureMap(root)
      if (val === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.model[root], key)) {
          this.$delete(this.model[root], key)
        }
        return
      }
      this.$set(this.model[root], key, val)
    },
    clearMapsForKey (key) {
      if (!key) return
      ;[SCHEDTAG_ROOT, POLICY_ROOT].forEach((root) => {
        if (this.model[root] && Object.prototype.hasOwnProperty.call(this.model[root], key)) {
          this.$delete(this.model[root], key)
        }
      })
    },
    initData (data) {
      if (!Array.isArray(data) || !data.length) return
      const list = data.map(item => {
        const normalized = normalizeSchedtagItem(item)
        if (!normalized) return null
        return {
          key: uuid(),
          schedtag: normalized.id,
          policy: normalized.policy,
        }
      }).filter(Boolean)
      if (!list.length) return
      this.schedtagPolicyList = list
      this.schedtagsApplied = true
      this.$nextTick(() => {
        this.applySchedtagFieldsValue()
        setTimeout(() => this.applySchedtagFieldsValue(), 800)
        setTimeout(() => this.applySchedtagFieldsValue(), 2000)
      })
    },
    applySchedtagFieldsValue () {
      if (!this.schedtagPolicyList.length) return
      this.schedtagPolicyList.forEach(item => {
        if (!item.schedtag && !item.policy) return
        if (item.schedtag) this.mapSet(SCHEDTAG_ROOT, item.key, item.schedtag)
        if (item.policy) this.mapSet(POLICY_ROOT, item.key, item.policy)
      })
      this.$emit('change')
    },
    add () {
      const uid = uuid()
      ;[SCHEDTAG_ROOT, POLICY_ROOT].forEach(root => this.ensureMap(root))
      this.schedtagPolicyList.push({
        key: uid,
      })
      this.$emit('change')
    },
    decrease (uid, index) {
      this.clearMapsForKey(uid)
      this.schedtagPolicyList.splice(index, 1)
      this.$emit('change')
    },
    onItemFieldChange () {
      if (!this.schedtagPolicyList.length) {
        this.$emit('change')
        return
      }
      this.schedtagPolicyList.forEach((item) => {
        const schedtag = this.mapGet(SCHEDTAG_ROOT, item.key)
        const policy = this.mapGet(POLICY_ROOT, item.key)
        if (schedtag) item.schedtag = typeof schedtag === 'object' ? (schedtag.key || schedtag.id) : schedtag
        if (policy) item.policy = typeof policy === 'object' ? (policy.key || policy.id) : policy
      })
      this.$emit('change')
    },
    /** SchedtagPolicy Form.Item 已绑 rules，由父 formRef.validate 展示红字 */
    async validate () {
      return true
    },
  },
}
</script>
