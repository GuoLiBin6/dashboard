<template>
  <base-dialog @cancel="cancelDialog">
    <template #header>{{params.title}}</template>
    <template #body>
      <dialog-selected-tips :name="$t('dictionary.network')" :count="params.data.length" :action="params.title" />
      <dialog-table class="mb-2" :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" :rules="rules">
        <a-form-model-item
          v-for="(item, i) in ipList"
          :key="item.key"
          :label="i === 0 ? $t('network.text_213') : ''"
          v-bind="i === 0 ? undefined : formItemLayoutWithOutLabel"
          :prop="'ipData.' + item.key"
          :rules="ipRules">
          <a-input
            v-model:value="form.ipData[item.key]"
            :placeholder="$t('network.text_217')"
            style="width: 60%; margin-right: 8px" />
          <a-button
            shape="circle"
            icon="minus"
            size="small"
            v-if="ipList.length > 1"
            @click="decrease(i)"
            class="mt-2 ml-2" />
        </a-form-model-item>
        <a-form-model-item v-bind="formItemLayoutWithOutLabel" style="position:relative; top: -14px">
          <div class="d-flex align-items-center">
            <a-button type="primary" shape="circle" icon="plus" size="small" @click="addIP" />
            <a-button type="link" @click="addIP">{{$t('network.text_640')}}</a-button>
          </div>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_641')" prop="notes">
          <a-textarea v-model:value="form.notes" :placeholder="$t('network.text_643')" :rows="2" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { uuid } from '@/utils/utils'
import validateForm, { validate } from '@/utils/validate'

export default {
  name: 'NetworkReversedIPDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const firstKey = uuid()
    return {
      ipList: [{ key: firstKey }],
      loading: false,
      scope: this.$store.getters.scope,
      form: {
        ipData: {
          [firstKey]: undefined,
        },
        notes: undefined,
      },
      rules: {
        notes: [
          { required: true, message: this.$t('network.text_643') },
          { max: 200, message: this.$t('network.text_642') },
        ],
      },
      formItemLayoutWithOutLabel: {
        wrapperCol: {
          span: 19, offset: 5,
        },
      },
    }
  },
  computed: {
    ipRules () {
      return [
        {
          required: true, message: this.$t('network.text_646'),
        },
        { validator: validateForm(['IPv4', 'IPv6'], true, 'some'), message: this.$t('network.text_647') },
        { validator: this.ipBlur, trigger: ['change'] },
      ]
    },
  },
  methods: {
    async ipBlur (rule, value, _callback) {
      const ips = Object.values(this.form.ipData || {})
      if (ips.filter(ip => ip === value).length >= 2) {
        return _callback(this.$t('network.text_644'))
      }
      const manager = new this.$Manager('reservedips', 'v2')
      try {
        const { data } = await manager.list({
          params: {
            search: value,
            network: this.params.data[0].id,
          },
        })
        if (data && data.length > 0) return _callback(this.$t('network.text_645'))
      } catch {
        _callback()
      }
    },
    ipToInt (ip) {
      const REG = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
      const result = REG.exec(ip)
      if (!result) return -1
      const ret = (parseInt(result[1]) << 24 |
        parseInt(result[2]) << 16 |
        parseInt(result[3]) << 8 |
        parseInt(result[4])) >>> 0
      return ret
    },
    intToIp (ipInt) {
      return [
        (ipInt >>> 24) & 0xFF,
        (ipInt >>> 16) & 0xFF,
        (ipInt >>> 8) & 0xFF,
        ipInt & 0xFF,
      ].join('.')
    },
    getNextIp (ip) {
      if (!ip) return ''
      const ipResult = validate(ip, 'IPv4')
      if (ipResult === false || ipResult.result === false) {
        return ''
      }
      const ipInt = this.ipToInt(ip)
      if (ipInt === -1) return ''
      const nextInt = ipInt + 1
      if (nextInt > 0xFFFFFFFF) return ''
      return this.intToIp(nextInt)
    },
    addIP () {
      const key = uuid()
      let nextIp = ''
      if (this.ipList.length > 0) {
        const lastIndex = this.ipList.length - 1
        const lastItem = this.ipList[lastIndex]
        const lastFieldValue = this.form.ipData[lastItem.key]
        if (lastFieldValue) {
          nextIp = this.getNextIp(lastFieldValue)
        }
      }
      this.ipList.push({
        key,
      })
      this.$set(this.form.ipData, key, nextIp || undefined)
    },
    decrease (index) {
      const removed = this.ipList.splice(index, 1)
      if (removed[0]) {
        this.$delete(this.form.ipData, removed[0].key)
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.params.onManager('performAction', {
          id: this.params.data[0].id,
          managerArgs: {
            action: 'reserve-ip',
            data: {
              ips: Object.values(this.form.ipData),
              notes: this.form.notes,
            },
          },
        })
        this.cancelDialog()
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
