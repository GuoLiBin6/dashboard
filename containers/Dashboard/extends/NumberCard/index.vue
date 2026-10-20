<template>
  <component
    ref="usage"
    :is="type"
    :type="type"
    v-model:visible="visible"
    :options="options"
    @update="update"
    :params="params"
    :edit="edit">
    <a-form-model-item
      :label="$t('dashboard.text_24')">
      <a-radio-group v-model:value="type">
        <a-radio-button v-for="item in typeOpts" :key="item.key" :value="item.key">{{ item.label }}</a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <template v-slot:actions="{ handleEdit }"><slot name="actions" :handleEdit="handleEdit" /></template>
  </component>
</template>

<script>
import { hasSetupKey } from '@/utils/auth'
import Server from './components/Server'
import K8s from './components/K8s'

export default {
  name: 'NumberCard',
  components: {
    Server,
    K8s,
  },
  props: {
    options: {
      type: Object,
      required: true,
    },
    params: Object,
    edit: Boolean,
  },
  data () {
    const typeOps = []
    if (hasSetupKey(['onestack', 'openstack', 'dstack', 'zstack', 'public', 'vmware', 'bill'])) {
      typeOps.push({ key: 'server', label: this.$t('dashboard.text_25') })
    }
    if (hasSetupKey(['k8s'])) {
      typeOps.push({ key: 'k8s', label: this.$t('dashboard.text_26') })
    }
    return {
      type: (this.params && this.params.type) || 'server',
      typeOpts: typeOps,
      visible: false,
    }
  },
  watch: {
    visible (v) {
      if (!v) { // 当关闭抽屉的时候重置type
        this.type = (this.params && this.params.type) || 'server'
      }
    },
  },
  methods: {
    update (...ret) {
      this.$emit('update', ...ret)
    },
    refresh () {
      return this.$refs.usage.refresh()
    },
  },
}
</script>
