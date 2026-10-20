<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_291')" v-if="params.type === 'create'" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item prop="acl_entries">
          <span slot="label">{{$t('network.text_292')}}<a-tooltip>
              <div slot="title">{{$t('network.text_293')}}<br />{{$t('network.text_294')}}<br />{{$t('network.text_295')}}<br />{{$t('network.text_296')}}<br />{{$t('network.text_297')}}</div>
              <icon type="info-circle" />
            </a-tooltip>
          </span>
          <a-textarea v-model:value="form.acl_entries"
            :placeholder="$t('network.text_298')"
            rows="8"
            @change="onAclEntriesChange" />
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { REGEXP } from '@/utils/validate'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

const ipsValidate = (rule, value, cb) => {
  const pureIps = value.split(/[\s\n]/).filter(v => !!v).map(str => str.trim())
  const noRepeatIps = Array.from(new Set(pureIps))
  const isRepeat = noRepeatIps.length !== pureIps.length
  let descValid = true
  const valid = pureIps.every(ipComment => {
    const [ip, comment = ''] = ipComment.split('|').filter(v => !!v && v !== '|')
    if (comment.length > 16) descValid = false
    if (ip.includes('/')) {
      let [ipStr, max] = ip.split('/')
      max = Number(max)
      if (REGEXP.IPv4.regexp.test(ipStr) && max < 256) {
        const ipStrArr = ipStr.split('.')
        const ipStrLast = ipStrArr[ipStrArr.length - 1]
        if (+ipStrLast >= 0 && +ipStrLast < max) {
          return true
        }
        return false
      }
    } else {
      if (REGEXP.IPv4.regexp.test(ip)) {
        return true
      }
      return false
    }
  })
  if (valid) {
    if (isRepeat) {
      cb(new Error(this.$t('network.text_299')))
    } else {
      if (!descValid) cb(new Error(this.$t('network.text_300')))
      cb()
    }
  } else {
    cb(new Error(this.$t('network.text_301')))
  }
}

export default {
  name: 'LbaclsCreateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    let aclEntriesInitial
    if (this.params.type === 'update') {
      aclEntriesInitial = this.params.data[0].acl_entries.map(v => {
        if (v.comment) {
          return `${v.cidr}|${v.comment}`
        }
        return v.cidr
      }).join(`
`)
    }
    return {
      loading: false,
      form: {
        name: undefined,
        acl_entries: aclEntriesInitial,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('serverName') },
        ],
        acl_entries: [
          { required: true, message: this.$t('network.text_302') },
          { validator: ipsValidate },
        ],
      },
      aclEntries: [],
    }
  },
  created () {
    if (this.form.acl_entries) {
      this.onAclEntriesChange({ target: { value: this.form.acl_entries } })
    }
  },
  methods: {
    onAclEntriesChange (e) {
      const str = (e && e.target) ? e.target.value : (e || this.form.acl_entries || '')
      const cidrs = str.split(/[\s\n]/).filter(v => !!v)
      this.aclEntries = cidrs.map(s => {
        const [cidr, comment = ''] = s.split('|')
        return {
          cidr,
          comment,
        }
      })
    },
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: {
          data: {
            name: data.name,
            acl_entries: this.aclEntries,
          },
        },
      })
    },
    doUpdate (data) {
      return this.params.onManager('update', {
        id: this.params.data[0].id,
        managerArgs: {
          data: {
            name: data.name,
            acl_entries: this.aclEntries,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        this.onAclEntriesChange(this.form.acl_entries)
        if (this.params.type === 'create') {
          await this.doCreate(this.form)
        } else {
          await this.doUpdate(this.form)
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
