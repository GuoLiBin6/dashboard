<template>
  <div>
    <a-divider v-if="!allSuccess" orientation="left" class="mt-5 mb-3">
      {{ type === 'host' ? $t('cloudenv.text_175') : $t('cloudenv.text_176') }}
    </a-divider>
    <a-alert v-if="list.length > 0" class="mb-3 mt-3" :type="allSuccess? 'success' : 'warning'" show-icon>
      <template #message v-if="type === 'host'">
        {{allSuccess ? $t('cloudenv.text_177') :  $t('cloudenv.text_178', [noSuitableIps.join(' 、 '), noSuitableIps.length])}}
      </template>
      <template #message v-if="type === 'guest'">
        {{allSuccess ? $t('cloudenv.text_179') : $t('cloudenv.text_180', [noSuitableIps.join(' 、 '), noSuitableIps.length]) }}
      </template>
    </a-alert>
    <a-form-item :label="$t('cloudenv.text_181')" v-if="!allSuccess">
      <a-radio-group v-if="type !== 'host'" v-model:value="isCreate" button-style="solid">
        <a-radio-button :value="true">{{$t('cloudenv.text_182')}}</a-radio-button>
        <a-radio-button :value="false">{{$t('cloudenv.text_183')}}</a-radio-button>
      </a-radio-group>
      <div v-show="isCreate">
        <a-row :gutter="8" v-for="k in netKeys" :key="k">
          <a-col :span="4" :xxl="4" :xl="9" :xs="9">
            <a-form-item>
              <a-input
                :addon-before="$t('db.text_60')"
                :value="rowValue(k, 'name')"
                @change="e => setRowValue(k, 'name', e.target.value)"
                :placeholder="$t('cloudenv.text_184')" />
            </a-form-item>
          </a-col>
          <a-col :span="4" :xxl="4" :xl="6" :xs="6">
            <a-form-item>
              <a-input
                :addon-before="$t('network.text_607')"
                :value="rowValue(k, 'guest_ip_start')"
                @change="e => { setRowValue(k, 'guest_ip_start', e.target.value); handleIpChange() }"
                :placeholder="$t('cloudenv.text_185')" />
            </a-form-item>
          </a-col>
          <a-col :span="4" :xxl="4" :xl="6" :xs="6">
            <a-form-item>
              <a-input
                :addon-before="$t('network.text_608')"
                :value="rowValue(k, 'guest_ip_end')"
                @change="e => { setRowValue(k, 'guest_ip_end', e.target.value); handleIpChange() }"
                :placeholder="$t('cloudenv.text_186')" />
            </a-form-item>
          </a-col>
          <a-col :span="3" :xxl="3" :xl="3" :xs="3">
            <a-form-item>
              <a-select
                class="w-100"
                :value="rowValue(k, 'guest_ip_mask')"
                @change="val => setRowValue(k, 'guest_ip_mask', val)"
                :placeholder="$t('network.text_595')"
                dropdownClassName="oc-select-dropdown">
                <a-select-option v-for="item in netMaskOptions" :key="item.value" :value="item.value">
                  <span class="text-color-secondary option-prefix">{{$t('common_600')}}: </span>{{item.value}}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="4" :xxl="4" :xl="6" :xs="6">
            <a-form-item>
              <a-input
                :addon-before="$t('network.text_610')"
                :value="rowValue(k, 'guest_gateway')"
                @change="e => setRowValue(k, 'guest_gateway', e.target.value)"
                :placeholder="$t('cloudenv.text_187')" />
            </a-form-item>
          </a-col>
          <a-col :span="3" :xxl="3" :xl="6" :xs="6">
            <a-form-item>
              <a-input
                addon-before="VLAN ID"
                :value="rowValue(k, 'vlan', 'vlan_id')"
                @change="e => setRowValue(k, 'vlan', e.target.value, 'vlan_id')"
                placeholder="VLAN ID" />
            </a-form-item>
          </a-col>
          <a-col :span="2" :xxl="2" :xl="4" :xs="4">
            <a-button @click="handleRemove(k)" shape="circle" icon="minus" size="small" class="mt-2 ml-2" />
          </a-col>
        </a-row>
        <div class="d-flex align-items-center">
          <a-button type="primary" shape="circle" icon="plus" size="small" @click="handleAdd" />
          <a-button type="link" @click="handleAdd">{{$t('cloudenv.text_188')}}</a-button>
        </div>
      </div>
      <div v-show="!isCreate" class="mt-2">
        <a-alert :message="$t('cloudenv.text_189')" type="warning" show-icon />
      </div>
    </a-form-item>
  </div>
</template>

<script>
import { uuid } from '@/utils/utils'
import { isWithinRange } from '@/utils/validate'

export default {
  name: 'PrepareNetsForm',
  props: {
    type: {
      type: String,
      default: 'host',
    },
    prepareNetData: {
      type: Object,
      required: true,
    },
    form: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      loading: false,
      netInit: {},
      noSuitableIps: [],
      netKeys: [],
      isCreate: true,
      netMaskOptions: [
        { label: '16', value: '16' },
        { label: '17', value: '17' },
        { label: '18', value: '18' },
        { label: '19', value: '19' },
        { label: '20', value: '20' },
        { label: '21', value: '21' },
        { label: '22', value: '22' },
        { label: '23', value: '23' },
        { label: '24', value: '24' },
        { label: '25', value: '25' },
        { label: '26', value: '26' },
        { label: '27', value: '27' },
        { label: '28', value: '28' },
        { label: '29', value: '29' },
        { label: '30', value: '30' },
      ],
      options: {
        name: {
          initialValue: undefined,
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_190') },
            { validator: this.$validate('resourceName') },
          ],
        },
        guest_ip_start: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_191') },
            { validator: this.$validate('IPv4') },
          ],
        },
        guest_ip_end: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_192') },
            { validator: this.$validate('IPv4') },
          ],
        },
        guest_ip_mask: {
          initialValue: '24',
        },
        guest_gateway: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
          rules: [
            { required: true, message: this.$t('cloudenv.text_193') },
            { validator: this.$validate('IPv4') },
            { validator: this.validateGateway },
          ],
        },
        vlan: {
          validateTrigger: ['change', 'blur'],
          validateFirst: true,
        },
      },
    }
  },
  computed: {
    suggestedNetworks () {
      const _ = this.prepareNetData[`${this.type}_suggested_networks`]
      return _ && _.length > 0 ? _ : []
    },
    list () {
      if (this.prepareNetData && this.prepareNetData[`${this.type}s`] && this.prepareNetData[`${this.type}s`].length > 0) {
        return this.prepareNetData[`${this.type}s`]
      }
      return []
    },
    allSuccess () {
      return this.list.length > 0 && this.noSuitableIps.length === 0
    },
  },
  watch: {
    list (value) {
      if (value.length > 0 && !Object.keys(this.netInit).length) {
        this.initNets()
      }
    },
    isCreate (val) {
      this.syncMetaFields()
    },
    netKeys: {
      handler () {
        this.syncMetaFields()
      },
      deep: true,
    },
  },
  created () {
    this.registerMetaFields()
    this.initNets()
    this.isCreate = this.list && this.list.length > 0
    this.$nextTick(() => {
      this.syncMetaFields()
    })
  },
  mounted () {
    this.noSuitableIps = this.getNoSuitableIps()
  },
  methods: {
    fieldPath (k, id) {
      return `${k}.${id}`
    },
    registerMetaFields () {},
    registerRowFields (k) {
      const fd = this.form.fd
      const row = {}
      Object.keys(this.options).forEach((id) => {
        const initialValue = this.netInit[k] ? (id === 'vlan' ? this.netInit[k].vlan_id : this.netInit[k][id]) : this.options[id].initialValue
        const field = this.fieldPath(k, id)
        row[id] = initialValue
        if (fd && fd[field] === undefined) {
          this.$set(fd, field, initialValue)
        }
      })
      if (fd && !fd[k]) {
        this.$set(fd, k, row)
      }
    },
    syncMetaFields () {
      const fd = this.form.fd
      if (fd) {
        this.$set(fd, 'keys', this.netKeys)
        this.$set(fd, 'isCreate', this.isCreate)
      }
    },
    rowValue (k, id, initialValueKey) {
      const fd = this.form.fd
      const field = this.fieldPath(k, id)
      if (fd) {
        if (fd[field] !== undefined) return fd[field]
        if (fd[k] && fd[k][id] !== undefined) return fd[k][id]
      }
      if (initialValueKey) {
        return this.netInit[k] ? this.netInit[k][initialValueKey] : undefined
      }
      return this.netInit[k] ? this.netInit[k][id] : this.options[id]?.initialValue
    },
    setRowValue (k, id, val, initialValueKey) {
      const fd = this.form.fd
      const field = this.fieldPath(k, id)
      if (fd) {
        this.$set(fd, field, val)
        const row = { ...(fd[k] || {}), [id]: val }
        if (initialValueKey) {
          row[initialValueKey] = val
        }
        this.$set(fd, k, row)
      }
    },
    getNoSuitableIps () {
      const ips = []
      for (let i = 0; i < this.list.length; i++) {
        const item = this.list[i]
        const { ip_nets } = item
        let isSuitableNetwork = false
        if (ip_nets && ip_nets.length) {
          isSuitableNetwork = ip_nets.every(o => o.suitable_network)
        }
        if (!item.suitable_network && !isSuitableNetwork) {
          ips.push(...item.ips)
        }
      }
      return ips
    },
    initNets () {
      const keys = []
      if (this.suggestedNetworks && this.suggestedNetworks.length > 0) {
        this.suggestedNetworks.forEach(net => {
          const key = uuid()
          keys.push(key)
          this.netInit[key] = net
          this.registerRowFields(key)
        })
      }
      this.netKeys = keys
      this.$nextTick(() => this.syncMetaFields())
    },
    setSuitable () {
      const values = { ...(this.form.fd || {}) }
      if (this.list && this.list.length > 0) {
        this.list.forEach(item => {
          for (let i = 0; i < item.ips.length; i++) {
            const ip = item.ips[i]
            let isSuitable = false
            for (let j = 0; j < this.netKeys.length; j++) {
              const k = this.netKeys[j]
              const row = values[k] || {}
              const { guest_ip_start, guest_ip_end } = row
              if (isWithinRange(ip, guest_ip_start, guest_ip_end)) {
                isSuitable = true
                break
              } else if (item.ip_nets[i].suitable_network) {
                isSuitable = true
                break
              }
            }
            item.isSuitable = isSuitable
          }
        })
      }
    },
    async handleIpChange () {
      await this.$nextTick()
      this.setSuitable()
    },
    handleAdd () {
      const key = uuid()
      this.netKeys = this.netKeys.concat(key)
      this.registerRowFields(key)
      this.$nextTick(() => this.syncMetaFields())
    },
    handleRemove (k) {
      this.netKeys = this.netKeys.filter(_ => _ !== k)
      this.$nextTick(() => {
        this.syncMetaFields()
        this.setSuitable()
      })
    },
    validateGateway (rule, value, callback) {
      const ipItems = String(value || '').split('.')
      const msg = this.$t('cloudenv.text_230')
      if (ipItems[ipItems.length - 1] === '0') {
        callback(msg)
      } else {
        callback()
      }
    },
  },
}
</script>
