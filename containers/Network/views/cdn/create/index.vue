<template>
  <div>
    <page-header :title="$t('common_628', [$t('dictionary.cdn_domain')])" />
    <page-body>
      <a-form-model
        ref="formRef"
        :model="form.fd"
        :rules="rules"
        class="mt-3"
        v-bind="formItemLayout"
        hideRequiredMark>
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" prop="project">
          <domain-project
            :form="form.fd"
            :form-layout="formItemLayout"
            :labelInValue="true" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.cloudprovider')" prop="cloudprovider">
          <base-select
            resource="cloudproviders"
            v-model:value="form.fd.cloudprovider"
            :params="params.cloudprovider"
            :isDefaultSelect="true"
            :showSync="true"
            :select-props="{ placeholder: $t('compute.text_149') }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.accelerated_domain')" prop="accelerated_domain">
          <a-input v-model:value="form.fd.accelerated_domain" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.area')" prop="area">
          <a-radio-group v-model:value="form.fd.area">
            <a-radio-button v-for="item in areaOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.service_type')" prop="service_type">
          <a-select v-model:value="form.fd.service_type">
            <a-select-option v-for="item in serviceTypeOpts" :key="item.key">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.origin_types')" prop="origin_type">
          <a-radio-group v-model:value="form.fd.origin_type">
            <a-radio-button v-for="item in originTypeOpts" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.cdn.source_protocol')" prop="origin_protocol">
          <a-radio-group v-model:value="form.fd.origin_protocol">
            <a-radio-button v-for="item in originProtocols" :value="item.key" :key="item.key">{{ item.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item
          v-for="(k, index) in form.fd.keys"
          :key="k"
          v-bind="index === 0 ? formItemLayout : formItemLayoutWithOutLabel"
          :label="index === 0 ? $t('network.cdn.source_origin') : ''"
          :required="false">
          <a-row :gutter="6">
            <a-col :span="8">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`origin.${k}`"
                :rules="originRules">
                <a-input v-model:value="form.fd.origin[k]" :placeholder="$t('network.cdn.origin')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="8">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`port.${k}`">
                <a-input v-model:value="form.fd.port[k]" :placeholder="$t('network.text_165')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="7">
              <a-form-model-item
                :wrapperCol="{ span: 24 }"
                class="mb-0 mr-1"
                :prop="`priority.${k}`"
                :rules="priorityRules">
                <a-input v-model:value="form.fd.priority[k]" :placeholder="$t('network.text_166')" />
              </a-form-model-item>
            </a-col>
            <a-col :span="1">
              <a-button v-if="index === 0" type="primary" shape="circle" icon="plus" size="small" @click="add" />
              <a-button v-else shape="circle" icon="minus" size="small" @click="remove(k)" />
            </a-col>
          </a-row>
        </a-form-model-item>
      </a-form-model>
    </page-body>
    <page-footer>
      <div slot="right">
        <a-button class="mr-3" type="primary" @click="handleConfirm" :loading="loading">
          {{$t('compute.text_907')}}
        </a-button>
        <a-button @click="handleCancel">{{$t('compute.text_908')}}</a-button>
      </div>
    </page-footer>
  </div>
</template>

<script>
import { validate, isRequired } from '@/utils/validate'
import { Manager } from '@/utils/manager'
import DomainProject from '@/sections/DomainProject/model'
import { AREAS, SERVICE_TYPES, ORIGIN_TYPES, ORIGIN_PROTOCOLS } from '../constants'

let id = 0
export default {
  name: 'CdnCreate',
  components: {
    DomainProject,
  },
  data () {
    return {
      areaOpts: AREAS,
      serviceTypeOpts: SERVICE_TYPES,
      originTypeOpts: ORIGIN_TYPES,
      originProtocols: ORIGIN_PROTOCOLS,
      loading: false,
      form: {
        fd: {
          domain: undefined,
          project: undefined,
          cloudprovider: undefined,
          accelerated_domain: '',
          area: 'mainland',
          service_type: 'web',
          origin_type: 'domain',
          origin_protocol: 'http',
          keys: [id],
          origin: { [id]: undefined },
          port: { [id]: undefined },
          priority: { [id]: undefined },
        },
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('dictionary.project'), trigger: 'change' },
        ],
        cloudprovider: [
          { required: true, message: this.$t('network.text_689') },
        ],
        accelerated_domain: [
          { required: true, message: this.$t('common.tips.input', [this.$t('network.cdn.accelerated_domain')]) },
          { validator: this.checkDomainHandle },
        ],
        area: [
          { required: true, message: this.$t('network.cdn.area_require_message') },
        ],
      },
      originRules: [
        { required: true, message: this.$t('network.cdn.origin_require_message') },
        { validator: this.validateIpOrDomain },
        { validator: this.validateOriginRepeat },
      ],
      priorityRules: [
        { validator: this.validatePriority },
      ],
      params: {
        domain: {
          scope: this.$store.getters.scope,
          limit: 0,
        },
        cloudprovider: {
          scope: this.$store.getters.scope,
          brand: 'Qcloud',
        },
      },
      formItemLayout: {
        wrapperCol: {
          md: { span: 18 },
          xl: { span: 20 },
          xxl: { span: 22 },
        },
        labelCol: {
          md: { span: 6 },
          xl: { span: 4 },
          xxl: { span: 2 },
        },
      },
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          md: { span: 18, offset: 6 },
          xl: { span: 20, offset: 4 },
          xxl: { span: 22, offset: 2 },
        },
      },
    }
  },
  methods: {
    handleCancel () {
      this.goBack()
    },
    generateValues (values) {
      const data = {
        domain: values.domain.key,
        tenant: values.project.key,
        cloudprovider_id: values.cloudprovider,
        name: values.accelerated_domain,
        area: values.area,
        service_type: values.service_type,
      }
      const origins = []
      values.keys.forEach(key => {
        origins.push({
          origin: values.origin[key],
          port: values.port[key],
          priority: values.priority[key],
          protocol: values.origin_protocol,
          type: this.getType(values.origin[key]),
        })
      })
      data.origins = origins
      return data
    },
    async handleConfirm () {
      const manager = new Manager('cdn_domains')
      try {
        await this.$refs.formRef.validate()
        this.loading = true
        await manager.create({
          data: Object.assign({}, this.generateValues(this.form.fd)),
        })
        this.goBack()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    checkDomainHandle (rule, value, callback) {
      if (validate(value, 'domain') === false || validate(value, 'domain').result === false) {
        callback(new Error(this.$t('network.text_178')))
      }
      callback()
    },
    add () {
      const newKey = ++id
      this.form.fd.keys = this.form.fd.keys.concat(newKey)
      this.$set(this.form.fd.origin, newKey, undefined)
      this.$set(this.form.fd.port, newKey, undefined)
      this.$set(this.form.fd.priority, newKey, undefined)
      this.$nextTick(() => {
        this.$refs.formRef.validateField(
          this.form.fd.keys.map(k => [`origin.${k}`, `priority.${k}`]).flat(),
        )
      })
    },
    remove (k) {
      const keys = this.form.fd.keys
      if (keys.length === 1) {
        return
      }
      this.form.fd.keys = keys.filter(key => key !== k)
      this.$delete(this.form.fd.origin, k)
      this.$delete(this.form.fd.port, k)
      this.$delete(this.form.fd.priority, k)
      this.$nextTick(() => {
        this.$refs.formRef.validateField(
          this.form.fd.keys.map(key => [`origin.${key}`, `priority.${key}`]).flat(),
        )
      })
    },
    goBack () {
      this.$router.push({
        name: 'CdnList',
      })
    },
    validateOriginRepeat (rule, value, callback) {
      this.$nextTick(() => {
        const origins = Object.values(this.form.fd.origin || {}).filter(v => v !== undefined && v !== '')
        const isRepeat = origins.filter(item => item === value).length > 1

        if (value && origins.length > 1 && isRepeat) {
          // eslint-disable-next-line standard/no-callback-literal
          callback(this.$t('network.cdn.origin_repeat_validate'))
        } else {
          callback()
        }
      })
    },
    validatePriority (rule, value, callback) {
      this.$nextTick(() => {
        const prioritys = Object.values(this.form.fd.priority || {}).filter(v => v !== undefined && v !== '')
        if (value && prioritys.length === 1) {
          // eslint-disable-next-line standard/no-callback-literal
          callback(this.$t('network.cdn.priority_validate'))
        } else {
          callback()
        }
      })
    },
    validateIpOrDomain (rule, value, callback) {
      if (/^[a-zA-Z]/.test(value)) {
        return this.$validate('domain')(rule, value, callback)
      } else if (/^[0-9]/.test(value)) {
        return this.$validate('IPv4')(rule, value, callback)
      }
      callback()
    },
    getType (value) {
      if (/^[0-9]/.test(value) && validate(value, 'IPv4')) {
        return 'ip'
      } else if (/^[a-zA-Z]/.test(value) && validate(value, 'domain')) {
        return 'domain'
      }
      return ''
    },
  },
}
</script>

<style>

</style>
