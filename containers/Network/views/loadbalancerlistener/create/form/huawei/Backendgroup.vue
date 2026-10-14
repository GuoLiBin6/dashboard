<template>
  <a-form-model :model="form.fd" class="mt-3" v-bind="formItemLayout">
    <a-form-item :label="$t('network.text_139')">
      <base-select
        isDefaultSelect
        ref="backendgroupsRef"
        showSync
        :value="backendGroupValue"
        resource="loadbalancerbackendgroups"
        :params="backendgroupParams"
        v-model:item="backendgroup"
        @change="onBackendGroupChange"
        :select-props="{ placeholder: $t('network.text_394') }" />
        <div slot="extra">{{$t('network.text_395')}}<a @click="openBackendgroupsCreate">{{$t('network.text_26')}}</a></div>
    </a-form-item>
    <a-form-item :label="$t('network.text_140')" ::extra="backendgroup.name ? $t('network.text_396', [backendgroup.name]) : ''">
      <table-lite-grid size="mini" border :columns="backendColumns" :data="backendList" />
    </a-form-item>
  </a-form-model>
</template>

<script>
import WindowsMixin from '@/mixins/windows'
import ListMixin from '@/mixins/list'
import { resolveFieldMeta } from '@/utils/common/ant'
import mixin from '../mixins/formStepItem'
export default {
  name: 'LBListenerCreateBackendgroup',
  mixins: [mixin, WindowsMixin, ListMixin],
  data () {
    const meta = resolveFieldMeta(this.fieldMap?.backend_group, 'backend_group') || {}
    return {
      backendGroupValue: meta.initialValue,
    }
  },
  created () {
    const meta = resolveFieldMeta(this.fieldMap.backend_group, 'backend_group')
    if (!meta) return
    if (!this.form.registered) this.form.registered = new Set()
    this.form.registered.add(meta.name)
    if (!this.form.fieldOpts) this.form.fieldOpts = {}
    const { name, ...opts } = meta
    this.form.fieldOpts[name] = opts
  },
  mounted () {
    const name = resolveFieldMeta(this.fieldMap.backend_group, 'backend_group')?.name || 'backend_group'
    const v = this.form.fd[name]
    if (v !== undefined) this.backendGroupValue = v
    if (this.backendGroupValue !== undefined) {
      this.$set(this.form.fd, name, this.backendGroupValue)
    }
  },
  methods: {
    onBackendGroupChange (bgId) {
      this.backendGroupValue = bgId
      const name = resolveFieldMeta(this.fieldMap.backend_group, 'backend_group')?.name || 'backend_group'
      this.$set(this.form.fd, name, bgId)
      this.fetchBackendList(bgId)
    },
  },
}
</script>
