<template>
  <div>
    <a-form-item :label="$t('k8s.text_41')">
      <a-input :placeholder="$t('k8s.text_60')" :value="fieldVal('name')" @update:value="v => fieldSet('name', v)" />
    </a-form-item>
    <a-form-item :label="$t('k8s.repo.image.source')">
      <a-radio-group :value="source" @change="handleSourceChange">
        <a-radio-button value="custom">{{ $t('k8s.repo.image.custom') }}</a-radio-button>
        <a-radio-button value="registry">{{ $t('k8s.repo.image.registry') }}</a-radio-button>
        <a-radio-button value="container_image">{{ $t('k8s.repo.image.container_image') }}</a-radio-button>
      </a-radio-group>
    </a-form-item>
    <a-form-item v-if="source === 'custom'" :label="$t('k8s.text_97')">
      <a-input :placeholder="$t('k8s.text_98')" :value="fieldVal('image')" @update:value="v => fieldSet('image', v)" />
    </a-form-item>
    <a-form-item v-else-if="source === 'registry'" :label="$t('k8s.text_97')">
      <mirror-registry :value="fieldVal('registryImage')" @change="v => fieldSet('registryImage', v)" />
    </a-form-item>
    <a-form-item v-else :label="$t('k8s.text_97')">
      <a-select
        :value="fieldVal('containerImageId')"
        @change="handleContainerImageChange"
        showSearch
        :filterOption="filterOption"
        :loading="containerImageLoading"
        :placeholder="$t('common.tips.select', [$t('k8s.repo.image.container_image')])"
        allowClear>
        <a-select-option
          v-for="img in containerImages"
          :key="img.value"
          :value="img.value"
          :label="img.label">
          <div>{{ img.label }}</div>
          <div style="font-size: 12px; color: #999;">{{ img.ref }}</div>
        </a-select-option>
      </a-select>
      <a-input v-show="false" :value="fieldVal('image')" @update:value="v => fieldSet('image', v)" />
      <div v-if="!containerImageLoading && containerImages.length === 0" class="mt-2">
        <a-alert type="info" show-icon>
          <template slot="message">
            {{ $t('k8s.repo.image.container_image.empty_tip') }}
            <router-link to="/container_image">{{ $t('k8s.repo.image.container_image.manage') }}</router-link>
          </template>
        </a-alert>
      </div>
    </a-form-item>
    <a-form-item label="CPU">
      <a-input :placeholder="$t('k8s.text_99')" type="number" :value="fieldVal('cpu')" @update:value="v => fieldSet('cpu', v)" :addonAfter="$t('k8s.text_100')" :min="1" @blur="e => formatInput(e, 'cpu')" />
    </a-form-item>
    <a-form-item :label="$t('k8s.text_101')">
      <a-input :placeholder="$t('k8s.text_102')" type="number" :value="fieldVal('memory')" @update:value="v => fieldSet('memory', v)" addonAfter="G" :min="1" @blur="e => formatInput(e, 'memory')" />
    </a-form-item>
    <a-form-item :label="$t('k8s.text_103')">
      <a-input :placeholder="$t('k8s.text_104')" :value="fieldVal('command')" @update:value="v => fieldSet('command', v)" />
    </a-form-item>
    <a-form-item :label="$t('k8s.text_105')">
      <a-input :placeholder="$t('k8s.text_106')" :value="fieldVal('arg')" @update:value="v => fieldSet('arg', v)" />
    </a-form-item>
    <a-form-item :label="$t('k8s.text_107')">
      <labels
        :fields="volumeMountFields"
        :title="$t('k8s.text_10')"
        :keyLabel="$t('k8s.text_10')"
        :valueLabel="$t('k8s.text_108')"
        :keyPlaceholder="$t('k8s.text_109')"
        :valuePlaceholder="$t('k8s.text_110')"
        :keyBaseSelectProps="keyBaseSelectProps"
        :model="model || form.fd" />
    </a-form-item>
    <a-form-item :label="$t('k8s.text_111')">
      <labels
        :fields="envFields"
        :title="$t('k8s.text_112')"
        :keyLabel="$t('k8s.text_112')"
        :model="model || form.fd" />
    </a-form-item>
    <a-form-item label="">
      <a-checkbox :checked="fieldVal('privileged')" @change="e => fieldSet('privileged', e.target.checked)">{{$t('k8s.text_113')}}</a-checkbox>
    </a-form-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import Labels from '@K8S/sections/Labels'
import MirrorRegistry from '@K8S/sections/MirrorRegistry'
import { getBracketValue, setBracketValue } from '@/utils/bracketModel'
import {
  containerScalarField,
  CONTAINER_SCALAR_INITIAL,
  containerEnvFields,
  containerVolumeMountFields,
  containerScalarRules,
} from './fields'

export default {
  name: 'K8SSpecContainerForm',
  components: {
    Labels,
    MirrorRegistry,
  },
  props: {
    paneKey: {
      type: String,
      required: true,
    },
    cluster: String,
    namespace: String,
    form: {
      type: Object,
      default: null,
    },
    model: {
      type: Object,
      default: null,
    },
  },
  data () {
    return {
      source: CONTAINER_SCALAR_INITIAL.source,
      containerImageLoading: false,
      containerImages: [],
    }
  },
  computed: {
    keyBaseSelectProps () {
      const params = {}
      if (this.cluster) {
        params.scope = this.$store.getters.scope
        params.unused = true
        params.cluster = this.cluster
        if (this.namespace) params.namespace = this.namespace
      }
      return {
        resource: 'persistentvolumeclaims',
        version: 'v1',
        params,
        needParams: true,
      }
    },
    envFields () {
      return containerEnvFields(this.paneKey)
    },
    volumeMountFields () {
      return containerVolumeMountFields(this.paneKey)
    },
  },
  watch: {
    source (val) {
      if (val === 'container_image' && this.containerImages.length === 0) {
        this.fetchContainerImages()
      }
    },
  },
  created () {
    const keys = ['name', 'image', 'registryImage', 'containerImageId', 'cpu', 'memory', 'command', 'arg', 'privileged', 'source']
    keys.forEach(k => {
      const name = containerScalarField(k, this.paneKey)
      if (!name) return
      const initial = CONTAINER_SCALAR_INITIAL[k]
      if (getBracketValue(this.model, name) === undefined && initial !== undefined) {
        setBracketValue(this, this.model, name, initial)
      }
    })
    const savedSource = this.fieldVal('source')
    if (savedSource) this.source = savedSource
    this.fieldSet('source', this.source)
  },
  methods: {
    scalarName (field) {
      return containerScalarField(field, this.paneKey)
    },
    fieldVal (field) {
      const key = this.scalarName(field)
      if (!key) return undefined
      const v = getBracketValue(this.model, key)
      if (v !== undefined) return v
      return CONTAINER_SCALAR_INITIAL[field]
    },
    fieldSet (field, value) {
      const key = this.scalarName(field)
      if (key) setBracketValue(this, this.model, key, value)
    },
    async validate () {
      const keys = ['name', 'image', 'registryImage', 'containerImageId']
      for (const k of keys) {
        const rules = containerScalarRules(this, k)
        const value = this.fieldVal(k)
        for (const rule of rules) {
          await this.runFieldRule(rule, value)
        }
      }
      return true
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
    filterOption (input, option) {
      const label = option.componentOptions?.propsData?.label || ''
      return label.toLowerCase().indexOf((input || '').toLowerCase()) >= 0
    },
    async fetchContainerImages () {
      try {
        this.containerImageLoading = true
        const manager = new this.$Manager('container_images', 'v1')
        const result = await manager.list({
          params: {
            details: true,
            limit: 100,
            scope: this.$store.getters.scope,
          },
        })
        const dataArr = result.data.data || []
        this.containerImages = dataArr.map(item => ({
          label: item.name || `${item.image_name}:${item.image_label}`,
          value: item.id,
          ref: `${item.image_name}:${item.image_label}`,
        }))
      } catch (error) {
        throw error
      } finally {
        this.containerImageLoading = false
      }
    },
    handleContainerImageChange (id) {
      this.fieldSet('containerImageId', id)
      const img = this.containerImages.find(item => item.value === id)
      this.fieldSet('image', img ? img.ref : undefined)
    },
    formatInput (e, field) {
      const val = Number(e.target.value)
      if (R.is(Number, val) && !Number.isNaN(val) && val >= 0) {
        return
      }
      this.fieldSet(field, 1)
    },
    handleSourceChange (e) {
      this.source = e.target.value
      this.fieldSet('source', this.source)
      this.fieldSet('image', undefined)
      this.fieldSet('registryImage', undefined)
      this.fieldSet('containerImageId', undefined)
    },
  },
}
</script>
