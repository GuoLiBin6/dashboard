<template>
  <div>
    <a-card v-for="item in ruleList" class="mb-3" :key="item.key">
      <a-form-item>
        <a-input :value="fieldVal(ingressRuleField.host(item.key))" @update:value="v => fieldSet(ingressRuleField.host(item.key), v)" :placeholder="$t('k8s.text_205')" />
      </a-form-item>
      <a-card class="mb-2" v-for="(val, i) in item.routes" :key="val.k">
        <a-row :gutter="1">
          <a-col :span="16">
            <a-form-item>
              <base-select
                :value="fieldVal(ingressRuleField.serviceName(item.key, val.k))"
                @change="v => fieldSet(ingressRuleField.serviceName(item.key, val.k), v)"
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
              <a-select :value="fieldVal(ingressRuleField.servicePort(item.key, val.k))" @change="v => fieldSet(ingressRuleField.servicePort(item.key, val.k), v)" :placeholder="$t('k8s.text_207')">
                <a-select-option v-for="v in genPortOpts(val.service)" :key="v.port" :value="v.port">{{ v.port }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item>
          <a-input :value="fieldVal(ingressRuleField.servicePath(item.key, val.k))" @update:value="v => fieldSet(ingressRuleField.servicePath(item.key, val.k), v)" :placeholder="$t('k8s.text_208')" />
        </a-form-item>
        <a class="ml-2 error-color" @click="remvoeRoute(item.routes, i)" v-if="item.routes.length > 1">{{$t('k8s.text_201')}}</a>
      </a-card>
      <a-button class="mt-2" type="primary" icon="plus" @click="addRoute(item)">{{$t('k8s.text_209')}}</a-button>
      <a-button class="ml-2" type="danger" @click="removeRule(item)" v-if="ruleList.length > 1">{{$t('k8s.text_201')}}</a-button>
    </a-card>
    <a-button type="primary" icon="plus" @click="addRule">{{$t('k8s.text_210')}}</a-button>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import {
  ingressRuleField,
  ingressHostRules,
  ingressServiceNameRules,
  ingressServicePathRules,
  ingressServicePortRules,
} from './fields'

export default {
  name: 'IngressCreateRouterRules',
  props: {
    form: {
      type: Object,
      default: null,
    },
    /** a-form-model：与动态 key 对齐的受控对象（通常为 form.fd） */
    model: {
      type: Object,
      default: null,
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
      ingressRuleField,
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
  methods: {
    fieldVal (name) {
      if (!name || !this.boundFd) return undefined
      return getBracketValue(this.boundFd, name)
    },
    fieldSet (name, value) {
      if (!name || !this.boundFd) return
      setBracketValue(this, this.boundFd, name, value)
    },
    addRule () {
      const key = uuid()
      this.ruleList.push({
        key,
        routes: [
          { k: uuid(), ports: [] },
        ],
      })
    },
    removeRule (item) {
      const index = this.ruleList.findIndex(val => val.key === item.key)
      this.ruleList.splice(index, 1)
    },
    addRoute (item) {
      item.routes.push({ k: uuid(), ports: [] })
    },
    remvoeRoute (item, i) {
      item.splice(i, 1)
    },
    genPortOpts (service) {
      if (service && service.internalEndpoint && service.internalEndpoint.ports) {
        return service.internalEndpoint.ports.filter(val => val.protocol && val.protocol.toLowerCase() === 'tcp')
      }
      return []
    },
    runFieldRule (rule, value) {
      return new Promise((resolve, reject) => {
        if (rule.required) {
          const empty = value === undefined || value === null || value === '' ||
            (Array.isArray(value) && !value.length)
          if (empty) {
            reject(new Error(rule.message || 'required'))
            return
          }
        }
        if (typeof rule.validator === 'function') {
          rule.validator(rule, value, (err) => {
            if (err) reject(err instanceof Error ? err : new Error(String(err)))
            else resolve()
          })
          return
        }
        resolve()
      })
    },
    async runRules (rules, value) {
      for (const rule of rules || []) {
        await this.runFieldRule(rule, value)
      }
    },
    async validate () {
      for (const item of this.ruleList) {
        await this.runRules(ingressHostRules(), this.fieldVal(ingressRuleField.host(item.key)))
        for (const val of item.routes) {
          const i = item.key
          const j = val.k
          await this.runRules(ingressServiceNameRules(), this.fieldVal(ingressRuleField.serviceName(i, j)))
          await this.runRules(ingressServicePortRules(), this.fieldVal(ingressRuleField.servicePort(i, j)))
          await this.runRules(ingressServicePathRules(), this.fieldVal(ingressRuleField.servicePath(i, j)))
        }
      }
      return true
    },
  },
}
</script>
