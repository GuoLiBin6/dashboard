<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <template v-if="params.type !== 'create'">
        <dialog-selected-tips :name="$t('dictionary.dns')" :count="params.data.length" :action="params.type === 'update' ? $t('network.text_130') : $t('network.text_155')" />
        <dialog-table :data="params.data" :columns="params.columns.slice(0, 4)" />
      </template>
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_156')" v-if="enableType('A/AAAA', 'CNAME', 'SRV')" :extra="$t('network.text_157')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_158')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_156')" v-if="enableType('PTR')" prop="ptrName">
          <template #extra>
            <div>{{$t('network.text_159')}}</div>
          </template>
          <a-input v-model:value="form.ptrName" :placeholder="$t('network.text_158')">
            <div slot="addonAfter">.in-addr.arpa</div>
          </a-input>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_160')">
          <a-radio-group @change="recordTypeChange" v-model:value="formMsg.recordType">
            <a-radio-button :key="n" :value="item" v-for="(item, n) in recordTypeOptions">{{item}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item>
          <span slot="label">{{$t('network.text_152')}}<a-tooltip class="item" effect="dark" placement="top">
                <icon type="info-circle" />
                <div slot="title">{{$t('network.text_161')}}<br />{{$t('network.text_162')}}<br />{{$t('network.text_163')}}<br />{{$t('network.text_164')}}</div>
              </a-tooltip>
          </span>
          <a-row :gutter="4" v-if="enableType('SRV')">
            <a-col :span="10" class="text-center">{{$t('network.text_156')}}</a-col>
            <a-col :span="4" class="text-center">{{$t('network.text_165')}}</a-col>
            <a-col :span="4" class="text-center">{{$t('network.text_166')}}</a-col>
            <a-col :span="4" class="text-center">{{$t('network.text_81')}}</a-col>
          </a-row>
          <a-row
            :gutter="4"
            :key="n"
            class="record-list mb-3"
            v-for="(obj, n) in recordList">
            <a-col :span="10" v-if="enableType('A/AAAA')">
              <a-form-model-item :prop="'key.' + n">
                <a-select :placeholder="$t('network.text_167')" v-model:value="form.key[n]">
                  <a-select-option
                    :key="i"
                    :value="item.value"
                    v-for="(item, i) in recordOptions">
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="10" v-if="enableType('A/AAAA', 'CNAME', 'PTR')">
              <a-form-model-item :prop="'record.' + n" :rules="recordFieldRules.record">
                <a-input :placeholder="computeText(obj, n)" v-model:value="form.record[n]" />
              </a-form-model-item>
            </a-col>
            <div v-if="enableType('SRV')">
              <a-col :span="10">
                <a-form-model-item :prop="'host.' + n" :rules="recordFieldRules.host">
                  <a-input :placeholder="computeText(obj, n)" v-model:value="form.host[n]" />
                </a-form-model-item>
              </a-col>
              <a-col :span="4">
                <a-form-model-item :prop="'port.' + n" :rules="recordFieldRules.port">
                  <a-input :max="65535" :min="1" type="number" v-model:value="form.port[n]" />
                </a-form-model-item>
              </a-col>
              <a-col :span="4">
                <a-form-model-item :prop="'weight.' + n" :rules="recordFieldRules.weight">
                  <a-input :min="0" type="number" v-model:value="form.weight[n]" />
                </a-form-model-item>
              </a-col>
              <a-col :span="4">
                <a-form-model-item :prop="'priority.' + n" :rules="recordFieldRules.priority">
                  <a-input :min="0" type="number" v-model:value="form.priority[n]" />
                </a-form-model-item>
              </a-col>
            </div>
            <a-button v-if="enableType('A/AAAA', 'SRV')" shape="circle" icon="minus" size="small" @click="() => removeItem(obj, n)" class="mt-2 ml-1" />
          </a-row>
          <div class="d-flex align-items-center" v-if="enableType('A/AAAA', 'SRV') && remain > 0">
            <a-button type="primary" shape="circle" icon="plus" size="small" @click="addItem" />
            <a-button type="link" @click="addItem">{{$t('network.text_168')}}</a-button>
            <span class="network-count-tips">{{$t('network.text_169')}}<span class="remain-num">{{ remain }}</span>{{$t('network.text_170')}}</span>
          </div>
        </a-form-model-item>
        <a-form-model-item prop="ttl">
          <span slot="label">
            TTL
              <a-tooltip class="item" effect="dark" placement="top">
                <icon type="info-circle" />
                <div slot="title">{{$t('network.text_171')}}</div>
              </a-tooltip>
          </span>
          <a-input-number
            v-model:value="form.ttl"
            :placeholder="$t('network.text_172')"
            :min="0"
            :max="86400" />{{$t('network.text_76')}}</a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { REGEXP } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
const { IPv4, IPv6, domain } = REGEXP
const MAX_ITEMS = 6
const RECORD_TYPE_MAP = {
  A: 'A/AAAA',
  AAAA: 'A/AAAA',
  CNAME: 'CNAME',
  PTR: 'PTR',
  SRV: 'SRV',
}

export default {
  name: 'DnsCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
        ptrName: undefined,
        ttl: this.params.type === 'create' ? 600 : this.params.data[0].ttl,
        key: ['A'],
        record: [''],
        host: [],
        port: [],
        weight: [],
        priority: [],
      },
      formMsg: {
        recordType: 'A/AAAA',
        cacheRecord: {},
      },
      recordFieldRules: {
        record: [
          { required: true, message: this.$t('network.text_175') },
        ],
        host: [
          { required: true, message: this.$t('network.text_158') },
          { validator: this.$validate('domain') },
        ],
        port: [
          { required: true, message: this.$t('network.text_176') },
        ],
        weight: [
          { required: true, message: this.$t('network.text_177') },
        ],
        priority: [
          { required: true, message: this.$t('network.text_117') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 4,
        },
      },
      recordOptions: [
        { value: 'A', label: 'A' },
        { value: 'AAAA', label: 'AAAA' },
      ],
      recordTypeOptions: ['A/AAAA', 'CNAME', 'PTR', 'SRV'],
      recordList: [{ key: 'A', record: '' }],
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
    remain () {
      return MAX_ITEMS - this.recordList.length
    },
    rules () {
      const rules = {
        ttl: [
          { required: true, message: this.$t('network.text_174') },
        ],
      }
      if (this.enableType('PTR')) {
        rules.ptrName = [
          { required: true, message: this.$t('network.text_173') },
          { validator: this.$validate('IPv4') },
        ]
      } else if (this.enableType('A/AAAA', 'CNAME', 'SRV')) {
        rules.name = [
          { required: true, message: this.$t('network.text_173') },
          { validator: this.checkName },
        ]
      }
      return rules
    },
  },
  created () {
    this.dnsM = new this.$Manager('dnsrecords')
    this.dialogOpen()
  },
  methods: {
    checkName (rule, value, callback) {
      if (!value) {
        return callback(new Error(this.$t('network.text_158')))
      }
      if (IPv4.regexp.test(value) || !domain.regexp.test(value)) {
        return callback(new Error(this.$t('network.text_178')))
      }

      if (this.formMsg.recordType === 'SRV') {
        const parts = value.split('.')
        if (parts.length < 3) {
          return callback(new Error(this.$t('network.text_179')))
        }
        for (let i = 0; i < parts.length; i++) {
          if (i < 2 && (parts[i].length < 2 || parts[i][0] !== '_')) {
            return callback(new Error(this.$t('network.text_180')))
          } else if (i >= 2 && parts[i].length === 0) {
            return callback(new Error(this.$t('network.text_180')))
          }
        }
      }
      callback()
    },
    dialogOpen () {
      if (this.params.type === 'update' || this.params.type === 'clone') {
        this._updateFormValue(this.params.data[0])
      }
    },
    syncFormArraysFromRecordList () {
      this.form.key = this.recordList.map(item => item.key)
      this.form.record = this.recordList.map(item => item.record || '')
      this.form.host = this.recordList.map(item => item.host || '')
      this.form.port = this.recordList.map(item => item.port !== undefined ? item.port : 1)
      this.form.weight = this.recordList.map(item => item.weight !== undefined ? item.weight : 0)
      this.form.priority = this.recordList.map(item => item.priority !== undefined ? item.priority : 0)
    },
    _updateFormValue (val) {
      const { recordList, recordType } = this._classify(val.records)
      this.recordList = recordList
      this.formMsg.recordType = recordType
      this.syncFormArraysFromRecordList()
      if (this.params.type === 'update') {
        if (recordType === 'PTR') {
          this.form.ptrName = val.name
        } else {
          this.form.name = val.name
        }
      }
      this.form.ttl = val.ttl
    },
    _classify (recordStr) {
      const initArr = recordStr.split(',')
      const recordList = initArr.map(keyValue => {
        const arr = keyValue.split(':')
        const key = arr[0]
        if (key === 'SRV') {
          return {
            key,
            host: arr[1],
            port: arr[2],
            weight: arr[3],
            priority: arr[4],
          }
        } else {
          const record = keyValue
            .split(':')
            .slice(1)
            .join(':')
          return { key, record }
        }
      })
      const key = recordList[0].key
      return {
        recordType: RECORD_TYPE_MAP[key],
        recordList,
      }
    },
    enableType (...arr) {
      const T = this.formMsg.recordType
      return Array.prototype.includes.call(arr, T)
    },
    recordTypeChange (e) {
      const type = e.target.value
      switch (type) {
        case 'A/AAAA':
          this.recordList = this.formMsg.cacheRecord[type] || [
            { key: 'A', record: '' },
          ]
          break
        case 'CNAME':
          this.recordList = this.formMsg.cacheRecord[type] || [
            { key: 'CNAME', record: '' },
          ]
          break
        case 'PTR':
          this.recordList = this.formMsg.cacheRecord[type] || [
            { key: 'PTR', record: '' },
          ]
          break
        case 'SRV':
          this.recordList = this.formMsg.cacheRecord[type] || [
            { key: 'SRV', host: '', port: 1, weight: 0, priority: 0 },
          ]
          break
      }
      this.syncFormArraysFromRecordList()
      this.$nextTick(() => {
        if (type === 'SRV') {
          this.$refs.formRef && this.$refs.formRef.validateField('name')
        }
      })
    },
    addItem () {
      if (this.formMsg.recordType === 'A/AAAA') {
        this.recordList.push({ key: 'A', record: '' })
        this.form.key.push('A')
        this.form.record.push('')
      } else if (this.formMsg.recordType === 'SRV') {
        this.recordList.push({
          key: 'SRV',
          host: '',
          port: 1,
          weight: 0,
          priority: 0,
        })
        this.form.host.push('')
        this.form.port.push(1)
        this.form.weight.push(0)
        this.form.priority.push(0)
      }
    },
    removeItem (obj, n) {
      this.recordList.splice(n, 1)
      if (this.enableType('A/AAAA')) {
        this.form.key.splice(n, 1)
        this.form.record.splice(n, 1)
      } else if (this.enableType('SRV')) {
        this.form.host.splice(n, 1)
        this.form.port.splice(n, 1)
        this.form.weight.splice(n, 1)
        this.form.priority.splice(n, 1)
      }
    },
    computeText (obj, n) {
      const key = this.form.key[n]
      if (key === 'A') {
        return this.$t('network.text_181')
      }
      if (key === 'AAAA') {
        return this.$t('network.text_182')
      }
      if (this.form.host && this.form.host.length) {
        return this.$t('network.text_158')
      }
      if (this.formMsg.recordType === 'A/AAAA') {
        return this.$t('network.text_181')
      }
      return this.$t('network.text_175')
    },
    doCreate (data) {
      if (this.params.type === 'create') {
        return this.dnsM.create({ data })
      } else if (this.params.type === 'update') {
        return this.dnsM.update({ id: this.params.data[0].id, data })
      } else if (this.params.type === 'clone') {
        return this.dnsM.create({ data })
      }
    },
    genData (values) {
      let newValues = {}
      const recordList = []
      if (values.key && values.key.length) {
        values.key.map((item, index) => {
          const ops = {
            key: item,
            record: values.record[index],
          }
          recordList.push(ops)
        })
      }
      if (values.record && !values.key.length) {
        values.record.map((item) => {
          const ops = {
            record: item,
          }
          recordList.push(ops)
        })
      }
      if (values.host && values.host.length) {
        values.host.map((item, index) => {
          const ops = {
            host: item,
            port: values.port[index],
            weight: values.weight[index],
            priority: values.priority[index],
          }
          recordList.push(ops)
        })
      }
      newValues = {
        name: values.name ? values.name : values.ptrName,
        ttl: values.ttl,
        is_public: true,
      }
      const addParams = (recordTypeArr, callback) => recordTypeArr.forEach(callback)
      if (this.formMsg.recordType === 'A/AAAA') {
        const aType = recordList.filter(v => v.key === 'A')
        const aaaaType = recordList.filter(
          v => v.key === 'AAAA',
        )
        addParams(aType, (obj, i) => {
          newValues[`A.${i}`] = obj.record
        })
        addParams(aaaaType, (obj, i) => {
          newValues[`AAAA.${i}`] = obj.record
        })
      } else if (this.formMsg.recordType === 'CNAME') {
        newValues.CNAME = recordList[0].record
      } else if (this.formMsg.recordType === 'PTR') {
        newValues.name = `${newValues.ptrName}.in-addr.arpa`
        newValues.PTR = recordList[0].record
      } else if (this.formMsg.recordType === 'SRV') {
        addParams(recordList, (obj, i) => {
          newValues[`SRV.${i}`] = `${obj.host}:${obj.port}:${obj.weight}:${obj.priority}`
        })
      }
      if (values.key && values.key.length) this._validform(recordList)
      return newValues
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        const newValues = this.genData(values)
        await this.doCreate(newValues)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
    _validform (values) {
      let validformdata = false
      const itemValid = values.every(val => {
        if (val.key === 'A') {
          return IPv4.regexp.test(val.record)
        } else if (val.key === 'AAAA') {
          return IPv6.regexp.test(val.record)
        } else {
          return true
        }
      })
      if (!itemValid) {
        this.$message.error(this.$t('network.text_183'))
      }
      validformdata = itemValid
      return validformdata
    },
  },
}
</script>
