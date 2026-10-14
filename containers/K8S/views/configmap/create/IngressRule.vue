<template>
  <div>
    <a-card v-for="item in ruleList" class="mb-3" :key="item.key">
      <a-form-item>
        <a-input :value="fieldVal(fieldMap.host(item.key))" @update:value="v => fieldSet(fieldMap.host(item.key), v)" :placeholder="$t('k8s.text_205')" />
      </a-form-item>
      <a-card class="mb-2" v-for="val in item.routes" :key="val.k">
        <a-row :gutter="1">
          <a-col :span="16">
            <a-form-item>
              <base-select
                :value="fieldVal(fieldMap.services(item.key).serviceName(val.k))"
                @change="v => fieldSet(fieldMap.services(item.key).serviceName(val.k), v)"
                resource="k8s_services"
                version="v1"
                :need-params="true"
                filterable
                :params="serviceParams"
                id-key="name"
                v-model:item="val.service"
                :select-props="{  placeholder: $t('k8s.text_206') }" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item>
              <a-select :value="fieldVal(fieldMap.services(item.key).servicePort(val.k))" @change="v => fieldSet(fieldMap.services(item.key).servicePort(val.k), v)" :placeholder="$t('k8s.text_207')">
                <a-select-option v-for="v in genPortOpts(val.service)" :key="v.port" :value="v.port">{{ v.port }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-input :value="fieldVal(fieldMap.services(item.key).servicePath(val.k))" @update:value="v => fieldSet(fieldMap.services(item.key).servicePath(val.k), v)" :placeholder="$t('k8s.text_208')" />
        </a-form-item>
      </a-card>
      <a-button class="mt-2" type="primary" icon="plus" @click="addRoute(item)">{{$t('k8s.text_209')}}</a-button>
    </a-card>
    <a-button type="primary" icon="plus" @click="addRule">{{$t('k8s.text_210')}}</a-button>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  name: 'IngressCreateRouterRules',
  props: {
    /** a-form-model fd（必传或 inject form.fd） */
    model: {
      type: Object,
      default: null,
    },
    fieldMap: {
      type: Object,
      required: true,
    },
    cluster: {
      type: String,
    },
    namespace: {
      type: String,
    },
  },
  data () {
    const key = uuid()
    return {
      ruleList: [{
        key,
        routes: [
          { k: uuid(), service: {} },
        ],
      }],
    }
  },
  computed: {
    boundFd () {
      return this.model || this.form?.fd || this.form
    },
    serviceParams () {
      if (this.namespace && this.cluster) {
        return {
          namespace: this.namespace,
          cluster: this.cluster,
          scope: this.$store.getters.scope,
          limit: 0,
          details: true,
          admin: this.$store.getters.isAdminMode,
        }
      }
      return {}
    },
  },
  mounted () {
    this.registerRuleFields()
  },
  methods: {
    fieldName (fieldTuple) {
      return resolveFieldMeta(fieldTuple)?.name
    },
    fieldVal (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return undefined
      const { name, ...opts } = meta
      const m = this.boundFd
      const v = m ? m[name] : undefined
      return v !== undefined ? v : opts.initialValue
    },
    fieldSet (fieldTuple, value) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name, ...opts } = meta
      const m = this.boundFd
      if (!m) return
      if (m[name] === undefined && opts.initialValue !== undefined && value === undefined) {
        this.$set(m, name, opts.initialValue)
        return
      }
      this.$set(m, name, value)
    },
    ensureFieldInitials (fieldMap, keys) {
      const list = keys || Object.keys(fieldMap || {})
      list.forEach((key) => {
        const fieldDef = fieldMap[key]
        const meta = resolveFieldMeta(fieldDef)
        if (!meta) return
        const { name, ...opts } = meta
        if (this.boundFd && this.boundFd[name] === undefined && opts.initialValue !== undefined) {
          this.$set(this.boundFd, name, opts.initialValue)
        }
      })
    },
    ensureOneField (fieldTuple) {
      const meta = resolveFieldMeta(fieldTuple)
      if (!meta) return
      const { name, ...opts } = meta
      if (this.boundFd && this.boundFd[name] === undefined && opts.initialValue !== undefined) {
        this.$set(this.boundFd, name, opts.initialValue)
      }
    },

    registerRuleFields () {
      this.ruleList.forEach(item => {
        this.ensureOneField(this.fieldMap.host(item.key))
        item.routes.forEach(val => {
          const svc = this.fieldMap.services(item.key)
          this.ensureOneField(svc.serviceName(val.k))
          this.ensureOneField(svc.servicePort(val.k))
          this.ensureOneField(svc.servicePath(val.k))
        })
      })
    },
    addRule () {
      const key = uuid()
      this.ruleList.push({
        key,
        routes: [
          { k: uuid(), ports: [] },
        ],
      })
      this.$nextTick(() => this.registerRuleFields())
    },
    addRoute (item) {
      item.routes.push({ k: uuid(), ports: [] })
      this.$nextTick(() => this.registerRuleFields())
    },
    genPortOpts (service) {
      if (service && service.internalEndpoint && service.internalEndpoint.ports) {
        return service.internalEndpoint.ports.filter(val => val.protocol && val.protocol.toLowerCase() === 'tcp')
      }
      return []
    },
  },
}
</script>
