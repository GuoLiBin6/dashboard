<template>
    <base-dialog @cancel="cancelDialog">
        <div slot="header">{{params.title}}</div>
        <a-form-model ref="formRef" slot="body" :model="form" :rules="rules" class="mt-3" v-bind="formItemLayout">
          <template v-if="params.data && params.data.length > 0">
            <dialog-selected-tips :name="$t('dictionary.elasticcaches')" :count="params.data.length" :action="params.title" />
            <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
          </template>
          <a-form-model-item :label="$t('db.text_60')" prop="name">
            <template v-if="params.data && params.data.length > 0">
              {{params.data[0].name}}
            </template>
            <a-input v-else :placeholder="$t('validator.dbName')" v-model:value="form.name" />
          </a-form-model-item>
          <a-form-model-item :label="$t('db.text_294')" prop="ip_list">
            <a-textarea :placeholder="$t('db.text_295')"
              :autosize="{ minRows: 4, maxRows: 7 }"
              v-model:value="form.ip_list" />
              <div style="line-height:20px;color:#999">{{$t('db.text_296')}}<b style="color:#666">{{remainIpCount}}</b>{{$t('db.text_297')}}</div>
          </a-form-model-item>
        </a-form-model>
         <div slot="footer">
            <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
            <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
         </div>
    </base-dialog>
</template>

<script>
import validateForm, { REGEXP } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'RedisWhiteListFormDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      title: this.$t('db.text_41'),
      form: {
        name: initialValues.name,
        ip_list: initialValues.ip_list,
      },
      rules: {
        name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('dbName') },
        ],
        ip_list: [
          { required: true, message: this.$t('db.text_298') },
          { validator: this.validateIps },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 20 },
        labelCol: { span: 4 },
      },
      ipsLength: 0,
    }
  },
  computed: {
    remainIpCount () {
      return 20 - this.ipsLength
    },
  },
  created () {
    const { allIPList } = this.params
    this.ipsLength = allIPList.length
  },
  methods: {
    validateIps (rule, value, _callback) {
      const REG_IP = REGEXP.IPv4.regexp
      const REG_NUM = /\d/
      if (value) {
        const ips = value.split(',')
        const alreadyipList = [...this.params.allIPList]
        const itselfIpList = this.params.data ? this.params.data[0].ip_list.split(',') : []
        for (let i = 0; i < alreadyipList.length; i++) {
          for (let j = 0; j < itselfIpList.length; j++) {
            const sameIndex = alreadyipList.indexOf(itselfIpList[j])
            if (sameIndex > -1) {
              alreadyipList.splice(sameIndex, 1)
            }
          }
        }
        const ipsLength = ips.length
        if (ipsLength >= 20) {
          return _callback(this.$t('db.text_299'))
        }
        for (let i = 0; i < ipsLength; i++) {
          const _item = ips[i]
          const [_ip, _u] = _item.split('/')
          if (_ip && !REG_IP.test(_ip)) {
            return _callback(this.$t('db.text_300', [_item]))
          }
          if (_u && !REG_NUM.test(_u)) {
            return _callback(this.$t('db.text_301', [_u]))
          }
          if (ips.indexOf(_item) !== i) {
            return _callback(this.$t('db.text_302', [_item]))
          }
        }
        for (let i = 0; i < alreadyipList.length; i++) {
          for (let j = 0; j < ipsLength; j++) {
            if (alreadyipList.indexOf(ips[j]) > -1) {
              return _callback(this.$t('db.text_302', [ips[j]]))
            }
          }
        }
        this.ipsLength = ipsLength
      }
      _callback()
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (this.params.data && this.params.data.length > 0) {
          const params = {
            ...values,
            elasticcache: this.params.redisItem.id,
          }
          if (params.name === this.params.data[0].name) {
            delete params.name
          }
          await this.params.list.onManager('update', {
            steadyStatus: this.params.steadyStatus,
            id: this.params.data[0].id,
            managerArgs: {
              data: params,
            },
          })
        } else {
          await this.params.list.onManager('create', {
            steadyStatus: this.params.steadyStatus,
            managerArgs: {
              data: {
                ...values,
                elasticcache: this.params.redisItem.id,
              },
            },
          })
        }
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
