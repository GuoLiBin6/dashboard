<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{$t('network.text_26')}}</template>
    <template #body>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_211')" prop="network">
          <template v-if="hasNetwork">
            <div>
              <span>{{ networkDesc }}</span>
              <span class="text-color-help">{{ $t('common.text00001') }}：{{ params.network.ports - params.network.ports_used }}</span>
            </div>
          </template>
          <template v-else>
            <base-select
              v-model:value="form.network"
              :remote="true"
              needParams
              resource="networks"
              :params="networkParams"
              :remote-fn="q => ({ filter: `name.contains(${q})` })"
              :select-props="{ placeholder: $t('network.text_212') }" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_213')" required>
          <ip-address
            :model="form"
            :checkIp="checkIp" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_641')" prop="notes">
          <a-textarea
            v-model:value="form.notes"
            :placeholder="$t('network.text_643')"
            :autosize="{ minRows: 2, maxRows: 6 }" />
        </a-form-model-item>
      </a-form-model>
    </template>
    <template #footer>
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </template>
  </base-dialog>
</template>

<script>
import * as R from 'ramda'
import { mapGetters } from 'vuex'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import IpAddress from '../components/IpAddress'

export default {
  name: 'ReservedIpCreateDialog',
  components: {
    IpAddress,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        network: undefined,
        notes: undefined,
        networkIps: {},
      },
      formItemLayout: {
        wrapperCol: {
          span: 19,
        },
        labelCol: {
          span: 5,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    rules () {
      const rules = {
        notes: [
          { required: true, message: this.$t('network.text_643') },
        ],
      }
      if (!this.hasNetwork) {
        rules.network = [
          { required: true, message: this.$t('network.text_212') },
        ]
      }
      return rules
    },
    networkParams () {
      return {
        scope: this.$store.getters.scope,
        limit: 20,
      }
    },
    hasNetwork () {
      return !R.isEmpty(this.params.network) && !R.isNil(this.params.network)
    },
    networkDesc () {
      const netInfo = []
      if (this.params.network.guest_ip_start && this.params.network.guest_ip_end) {
        netInfo.push(this.params.network.guest_ip_start + '/' + this.params.network.guest_ip_mask + '-' + this.params.network.guest_ip_end + '/' + this.params.network.guest_ip_mask)
      }
      if (this.params.network.guest_ip6_start && this.params.network.guest_ip6_end) {
        netInfo.push(this.params.network.guest_ip6_start + '/' + this.params.network.guest_ip6_mask + '-' + this.params.network.guest_ip6_end + '/' + this.params.network.guest_ip6_mask)
      }
      netInfo.push('vlan=' + this.params.network.vlan_id)
      return this.params.network.name + '(' + netInfo.join(',') + ')'
    },
  },
  methods: {
    checkIp (i) {
      return async (rule, value, callback) => {
        if (!value) return callback()
        const params = {
          search: value,
        }
        try {
          const data = await new this.$Manager('reservedips').list({ params })
          if (data.data.data.length >= 1) {
            return callback(new Error(this.$t('network.text_645')))
          }
          const ipsVal = Object.values(this.form.networkIps || {})
          const ipsKey = Object.keys(this.form.networkIps || {})
          if (ipsVal.indexOf(value) !== -1 && ipsKey[ipsVal.indexOf(value)] !== i) {
            return callback(new Error(this.$t('network.text_644')))
          }
          return callback()
        } catch {
          return callback()
        }
      }
    },
    doCreate (data) {
      return new this.$Manager('networks').performAction({
        id: data.network,
        action: 'reserve-ip',
        data: {
          ips: Object.values(data.networkIps).filter(v => !!v),
          notes: data.notes,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          ...this.form,
          network: this.hasNetwork ? this.params.network.id : this.form.network,
        }
        await this.doCreate(values)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
