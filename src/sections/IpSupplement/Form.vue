<template>
  <div
    :style="{ width: `${width}px` }">
    <a-alert class="mb-2" type="warning">
      <template #message>
        {{ $t('help.ipSupplement') }}
        <div v-if="!localNics || localNics.length === 0">{{ $t('help.ipSupplementTip') }}</div>
      </template>
    </a-alert>
    <a-form-item :label="nicLabel(nic)" v-for="(nic, i) in localNics" :key="i" v-bind="formLayout">
      <div class="d-flex">
      <base-select
        class="w-100 mr-2"
        resource="wires"
        v-model:value="localNics[i].wire"
        :need-params="true"
        :is-default-select="true"
        :auto-load-default-select="true"
        :params="{ ...wireParamsC(nic) }"
        :select-props="{ allowClear: false }"
        :min-width="'100px'" />
      <base-select
        class="w-100 mr-2"
        resource="networks"
        v-model:value="localNics[i].net"
        v-model:item="localNics[i].network"
        :show-sync="true"
        :need-params="true"
        :is-default-select="true"
        :params="{ ...networkParamsC(nic) }"
        :select-props="{ allowClear: false }"
        :min-width="'200px'" />
      <ip-select :value="nic.ip" :network="nic.network" @change="e => ipChange(e, i)" />
      </div>
      <template v-if="i === 0" #extra>{{$t('compute.text_196')}}<help-link :href="`/network/create?vpc=default&wire=${nic.wire}&domain=${domain}&project=${project}&type=idc`">{{$t('compute.perform_create')}}</help-link></template>
    </a-form-item>
    <div class="text-right">
      <a-button type="primary" :loading="loading" v-if="localNics && localNics.length > 0" @click="handleSubmit">{{$t('common.ok')}}</a-button>
      <a-button class="ml-3" @click.stop.prevent="cancel">{{$t('common.cancel')}}</a-button>
    </div>
  </div>
</template>

<script>
import IpSelect from '@Compute/sections/ServerNetwork/IpSelect.vue'

function createLocalNics (nics = []) {
  return nics.map(nic => ({
    ...nic,
    wire: nic.wire || undefined,
    net: nic.net || undefined,
    network: nic.network || {},
    ip: nic.ip || '',
  }))
}

export default {
  name: 'IpSupplementEditForm',
  components: {
    IpSelect,
  },
  props: {
    width: {
      type: Number,
      default: 820,
    },
    formLayout: {
      type: Object,
      default: () => ({
        wrapperCol: { span: 20 },
        labelCol: { span: 4 },
      }),
    },
    label: {
      type: String,
      default: 'IP',
    },
    defaultValue: {
      type: String,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    nics: {
      type: Array,
      default: () => [],
    },
    host: {
      type: String,
      default: '',
    },
    domain: {
      type: String,
      default: '',
    },
    project: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      localNics: createLocalNics(this.nics),
    }
  },
  computed: {
    placeholder () {
      if (this.label) return `${this.$t('common.placeholder')}${this.label}`
      return this.$t('common.placeholder')
    },
  },
  watch: {
    nics: {
      handler (val) {
        this.localNics = createLocalNics(val)
      },
      deep: true,
    },
  },
  methods: {
    wireParamsC (nic) {
      return {
        limit: 0,
        host: this.host,
        filter: [
          `name.equals('${nic.dswitch}')`,
          `name.startswith('${nic.dswitch}-')`,
        ],
        filter_any: true,
        project_domain: this.domain,
      }
    },
    networkParamsC (nic) {
      if (!nic.wire) {
        return {}
      }
      return {
        limit: 0,
        wire: nic.wire,
        project_domain: this.domain,
        project: this.project,
      }
    },
    nicLabel (nic) {
      return `${this.$t('common.ip_supplement.nic_label')} MAC ${nic.mac} ${this.$t('common.ip_supplement.network_label')} "${nic.dswitch}"`
    },
    ipChange (val, i) {
      this.localNics[i].ip = val
    },
    cancel () {
      this.$emit('cancel')
    },
    async validateIp (ip) {
      const trimmed = (ip || '').trim()
      if (!trimmed) {
        throw new Error(`${this.$t('common.placeholder')}${this.label}`)
      }
      return new Promise((resolve, reject) => {
        this.$validate('IPv4')(null, trimmed, err => {
          if (err) reject(err)
          else resolve(trimmed)
        })
      })
    },
    async handleSubmit () {
      try {
        const values = {}
        for (let i = 0; i < this.localNics.length; i++) {
          values[`input[${i}]`] = await this.validateIp(this.localNics[i].ip)
        }
        this.$emit('submit', values)
      } catch (err) {
        if (err?.message) {
          this.$message.error(err.message)
        }
      }
    },
  },
}
</script>
