<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_202')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_727')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('compute.text_728')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea v-model:value="form.description" :auto-size="{ minRows: 1, maxRows: 3 }" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_1379')" prop="createType" :extra="extra">
          <a-radio-group v-model:value="form.createType" @change="handleCreateTypeChange">
            <a-radio-button value="new">
              {{ $t('compute.text_1380') }}
            </a-radio-button>
            <a-radio-button value="old">
              {{ $t('compute.text_1381') }}
            </a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_725')" prop="public_key" v-if="form.createType === 'old'">
          <a-textarea v-model:value="form.public_key" :placeholder="$t('compute.text_729')" :rows="4" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common_56')" prop="scheme" v-if="form.createType !== 'old'">
          <a-radio-group v-model:value="form.scheme">
            <a-radio-button value="RSA">RSA</a-radio-button>
            <a-radio-button value="ECDSA">ECDSA</a-radio-button>
            <a-radio-button value="ED25519">ED25519</a-radio-button>
          </a-radio-group>
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
import debounce from 'lodash/debounce'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'CreateKeyPairDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const publicKeyNameDuplicate = debounce((rule, value, callback) => {
      const manager = new this.$Manager('keypairs')
      manager.list({
        params: { filter: `name.equals(${value})` },
      }).then((res) => {
        const len = res.data.data.length
        if (len === 0) {
          callback()
        } else {
          callback(this.$t('compute.text_730'))
        }
      }).catch(() => {
        callback()
      })
    }, 500)
    return {
      loading: false,
      form: {
        name: '',
        description: '',
        createType: 'new',
        public_key: '',
        scheme: 'RSA',
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_728') },
          { validator: this.$validate('secretKeyName') },
          { validator: publicKeyNameDuplicate },
        ],
        public_key: [
          { required: true, message: this.$t('compute.text_729') },
          { validator: this.$validate('publicKey') },
        ],
        scheme: [
          { required: true },
        ],
      },
      extra: this.$t('compute.keypair_create_method'),
    }
  },
  methods: {
    fake_click (obj) {
      const ev = document.createEvent('MouseEvents')
      ev.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      obj.dispatchEvent(ev)
    },
    download (name, data) {
      const urlObject = window.URL || window.webkitURL || window
      const downloadData = new Blob([data])
      const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
      save_link.href = urlObject.createObjectURL(downloadData)
      save_link.download = name
      this.fake_click(save_link)
    },
    handleCreateTypeChange (e) {
      const type = e?.target ? e.target.value : e
      if (type === 'new') {
        this.extra = this.$t('compute.keypair_create_method')
      } else {
        this.extra = ''
      }
    },
    doCreate (data) {
      return this.params.onManager('create', {
        managerArgs: {
          data,
        },
      })
    },
    doDownload (data, id) {
      return this.params.onManager('get', {
        managerArgs: {
          id: id + '/privatekey',
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        delete values.createType
        const { data } = await this.doCreate(values)
        if (this.form.createType === 'new') {
          const { data: ret } = await this.doDownload(values, data.id)
          this.download(`${ret.name}.pem`, ret.private_key)
        }
        this.cancelDialog()
      } catch (error) {
        // validate / create failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
