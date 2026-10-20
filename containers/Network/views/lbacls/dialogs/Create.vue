<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.project')])" v-if="params.type === 'create'">
          <domain-project :form="form" :labelInValue="false" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_291')" v-if="params.type === 'create'" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" v-if="params.type === 'create'" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item prop="acl_entries">
          <span slot="label">{{$t('network.text_292')}}<a-tooltip>
              <div slot="title">{{$t('network.text_293')}}<br />{{$t('network.text_294')}}<br />{{$t('network.text_295')}}<br />{{$t('network.text_296')}}<br />{{$t('network.text_297')}}</div>
              <icon type="info-circle" />
            </a-tooltip>
          </span>
          <a-textarea v-model:value="form.acl_entries"
            :placeholder="$t('network.text_298')"
            rows="8" />
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
import { mapGetters } from 'vuex'
import { REGEXP } from '@/utils/validate'
import DomainProject from '@/sections/DomainProject/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import i18n from '@/locales'

const ipsValidate = (rule, value, cb) => {
  const pureIps = value.split(/[\s\n]/).filter(v => !!v).map(str => str.trim())
  const noRepeatIps = Array.from(new Set(pureIps))
  const isRepeat = noRepeatIps.length !== pureIps.length
  let descValid = true
  const valid = pureIps.every(ipComment => {
    const [ip, comment = ''] = ipComment.split('|').filter(v => !!v && v !== '|')
    if (comment.length > 16) descValid = false
    if (ip.includes('/')) {
      const [ipStr] = ip.split('/')
      if (REGEXP.IPv4.regexp.test(ipStr) && REGEXP.cidr.regexp.test(ip)) {
        return true
      } else {
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
      cb(new Error(i18n.t('network.text_299')))
    } else {
      if (!descValid) return cb(new Error(i18n.t('network.text_300')))
      cb()
    }
  } else {
    cb(new Error(i18n.t('network.text_301')))
  }
}

const parseAclEntries = (str) => {
  if (!str) return []
  const cidrs = str.split(/[\s\n]/).filter(v => !!v)
  return cidrs.map(s => {
    const [cidr, comment = ''] = s.split('|')
    return {
      cidr,
      comment,
    }
  })
}

export default {
  name: 'LbaclsCreateDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const userInfo = this.$store.getters.userInfo
    let aclEntriesInitial = ''
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
        domain: userInfo.projectDomainId,
        project: userInfo.projectId,
        name: undefined,
        description: undefined,
        acl_entries: aclEntriesInitial,
      },
      rules: {
        domain: [
          { required: true, message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { required: true, message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('serverName') },
        ],
        acl_entries: [
          { required: true, message: this.$t('network.text_302') },
          { validator: ipsValidate },
        ],
      },
      aclEntries: parseAclEntries(aclEntriesInitial),
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'isDomainMode', 'userInfo', 'l3PermissionEnable']),
  },
  watch: {
    'form.acl_entries' (str) {
      this.aclEntries = parseAclEntries(str)
    },
  },
  methods: {
    doCreate (data) {
      if (this.isAdminMode) {
        data.admin = true
      } else {
        delete data.domain
      }
      return this.params.onManager('create', {
        managerArgs: {
          data: {
            ...data,
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
            ...data,
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
        const values = { ...this.form }
        if (this.params.type === 'create') {
          await this.doCreate(values)
        } else {
          await this.doUpdate(values)
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
