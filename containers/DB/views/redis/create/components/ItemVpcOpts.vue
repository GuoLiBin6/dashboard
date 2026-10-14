<template>
  <a-row :gutter="8">
    <a-col :span="12">
      <a-form-model-item>
        <a-select :value="fieldVal(fieldMap.vpc)" @change="vpc => { fieldSet(fieldMap.vpc, vpc); fetchQueryNetworks(vpc, true) }" :loading="vpcLoading" :placeholder="$t('db.text_261')" showSearch :filterOption="filterOption">
          <a-select-option  :key="item.id" :value="item.id" v-for="item in vpcOptions">
            <div class="d-flex">
              <span class="text-truncate flex-fill mr-2" :title="item.name">{{ item.name }}</span>
              <span style="color: #8492a6; font-size: 13px">{{$t('db.text_268', [ item.manager ])}}</span>
            </div>
          </a-select-option>
        </a-select>
      </a-form-model-item>
    </a-col>
    <a-col :span="12">
      <a-form-model-item>
        <a-select :value="fieldVal(fieldMap.network)" @change="networkId => { fieldSet(fieldMap.network, networkId); handleNetworkChange(networkId) }" :loading="networkLoading" :placeholder="$t('db.text_269')" showSearch :filterOption="filterOption">
          <a-select-option :key="item.id" :value="item.id" v-for="item in networkOptions">
            <div class="d-flex">
              <span class="text-truncate flex-fill mr-2" :title="item.name">{{ item.name }} ({{item.guest_ip_start}} - {{item.guest_ip_end}}）</span>
              <span style="color: #8492a6; font-size: 13px">{{$t('db.text_270', [ item.ports - item.ports_used ])}}</span>
            </div>
          </a-select-option>
        </a-select>
       </a-form-model-item>
    </a-col>
  </a-row>
</template>
<script>
import { Manager } from '@/utils/manager'
import { resolveFieldMeta } from '@/utils/common/ant'

export default {
  inject: ['form', 'scopeParams'],
  props: {
    /** a-form-model fd（必传或 inject form.fd） */
    model: {
      type: Object,
      default: null,
    },
    fieldMap: {
      type: Object,
      default: () => {
        return []
      },
    },
  },
  data () {
    return {
      vpcLoading: false,
      networkLoading: false,
      vpcOptions: [],
      networkOptions: [],
      cloudregion: undefined,
    }
  },
  computed: {
    boundFd () {
      return this.form?.fd || this.model || this.form
    },
  },
  created () {
    this.ensureFieldInitials(this.fieldMap, ['vpc', 'network'])
    this.vpcManager = new Manager('vpcs', 'v2')
    this.netWrokManager = new Manager('networks', 'v2')
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
    fdGet (name) {
      return this.boundFd?.[name]
    },
    fdSet (fields) {
      const m = this.boundFd
      if (!m || !fields) return
      Object.keys(fields).forEach((k) => {
        this.$set(m, k, fields[k])
      })
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

    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    handleNetworkChange (networkId) {
      if (this.networkOptions && this.networkOptions.length > 0) {
        for (let i = 0; i < this.networkOptions.length; i++) {
          const { _id, manager } = this.networkOptions[i]
          if (networkId === _id) {
            this.fdSet({ manager })
            break
          }
        }
      }
    },
    async fetchQueryVpcs (isUpdate) {
      const sku = this.fdGet('sku')
      const params = {
        limit: 0,
        usable: true,
        cloudregion_id: this.fdGet('region'),
        ...this.scopeParams,
      }
      if (sku) {
        if ((sku.cloudregion_id === this.cloudregion) && !isUpdate) {
          return false
        }
        params.cloudregion_id = sku.cloudregion_id
        params.provider = sku.provider
        this.cloudregion = sku.cloudregion_id
      }
      this.fdSet({
        vpc: undefined,
        network: undefined,
      })
      try {
        this.vpcLoading = true
        const { data = {} } = await this.vpcManager.list({ params })
        this.vpcOptions = data.data || []
        if (this.vpcOptions && this.vpcOptions.length > 0) {
          this.fdSet({
            vpc: this.vpcOptions[0].id,
          })
        }
        this.fetchQueryNetworks()
        this.vpcLoading = false
      } catch (err) {
        this.vpcLoading = false
        throw err
      }
    },
    async fetchQueryNetworks (vpc, update) {
      const params = {
        limit: 0,
        usable: true,
        vpc: vpc || this.fdGet('vpc'),
        ...this.scopeParams,
      }
      const sku = this.fdGet('sku')
      if (sku) {
        params.zone = sku.zone_id
      }
      this.fdSet({
        network: undefined,
      })
      try {
        this.networkLoading = true
        const { data = {} } = await this.netWrokManager.list({ params })
        this.networkOptions = data.data || []
        if (this.networkOptions && this.networkOptions.length > 0) {
          const { id, manager } = this.networkOptions[0]
          this.fdSet({
            network: id,
            manager: manager,
          })
        }
        this.networkLoading = false
      } catch (err) {
        this.networkLoading = false
        throw err
      }
    },
  },
}
</script>
