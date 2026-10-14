<template>
  <div>
    <a-tabs hideAdd v-model="active" type="editable-card" @edit="onEdit">
      <a-tab-pane v-for="(pane, i) in panes" :key="pane.key" :closable="panes.length > 1">
        <template v-slot:tab>
          <a-badge :dot="showBadge(pane)" :offset="[(panes.length > 1 ? 24 : 10), -5]">
            <span>{{$t('k8s.text_114', [i+1])}}</span>
          </a-badge>
        </template>
        <spec-container-form
          :ref="`form_${pane.key}`"
          :pane-key="pane.key"
          :cluster="cluster"
          :namespace="namespace"
          :form="form"
          :model="model || form.fd" />
      </a-tab-pane>
      <template v-slot:tabBarExtraContent>
        <a-button type="link" @click="add">{{$t('k8s.text_115')}}</a-button>
      </template>
    </a-tabs>
  </div>
</template>

<script>
import SpecContainerForm from '@K8S/sections/SpecContainer/Form'
import { uuid } from '@/utils/utils'

export default {
  name: 'K8SSpecContainers',
  components: {
    SpecContainerForm,
  },
  props: {
    cluster: String,
    namespace: String,
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model：与 field 动态 key 对齐（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
    },
    errPanes: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    const key = uuid()
    return {
      active: key,
      panes: [
        { key },
      ],
    }
  },
  created () {
    this.syncPanes()
  },
  methods: {
    syncPanes () {
      this.$emit('update:panes', this.panes)
    },
    showBadge (pane) {
      return this.errPanes.includes(pane.key)
    },
    add () {
      const key = uuid()
      this.panes.push({
        key,
      })
      this.active = key
      this.syncPanes()
    },
    onEdit (targetKey, action) {
      if (action === 'remove') {
        const index = this.panes.findIndex(val => val.key === targetKey)
        this.panes.splice(index, 1)
        if (this.active === targetKey) {
          this.active = this.panes[0].key
        }
        this.syncPanes()
      }
    },
    async validate () {
      for (const pane of this.panes) {
        const formRef = this.$refs[`form_${pane.key}`]
        const formComp = Array.isArray(formRef) ? formRef[0] : formRef
        if (typeof formComp?.validate === 'function') {
          await formComp.validate()
        }
      }
      return true
    },
  },
}
</script>
