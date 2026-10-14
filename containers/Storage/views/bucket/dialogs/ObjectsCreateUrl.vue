<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('storage.text_103')" v-if="isPrivate" prop="expire_seconds">
          <a-input class="w-50" @change="getUrl" v-model:value="form.expire_seconds" :placeholder="$t('storage.text_104')">
            <span slot="addonAfter">{{$t('storage.text_105')}}</span>
          </a-input>
          <span slot="extra">{{$t('storage.text_106')}}</span>
        </a-form-model-item>
        <a-form-model-item label="URL">
           <a-textarea :value="url || $t('storage.text_107')" :disabled="true" autosize />
           <a style="font-size: 12px" v-clipboard:copy="url">{{$t('storage.text_108')}}<copy v-if="url" class="ml-1" :message="url" /></a>
        </a-form-model-item>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="cancelDialog" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { formItemLayout } from '@Storage/constants/index.js'
import { objectsModel } from '@Storage/views/bucket/utils/controller.js'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ObjectsCreateUrlDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      formItemLayout,
      fileList: [],
      url: '',
      form: {
        expire_seconds: 7200,
      },
      rules: {
        expire_seconds: [
          { type: 'integer', message: this.$t('storage.text_104'), transform: (v) => parseFloat(v) },
        ],
      },
    }
  },
  computed: {
    isPrivate () {
      return this.params.data[0].acl === 'private'
    },
  },
  mounted () {
    this.$nextTick(() => {
      this.getUrl()
    })
  },
  methods: {
    async getUrl (e) {
      try {
        if (this.$refs.formRef) {
          await this.$refs.formRef.validate()
        }
        let seconds = 7200
        if (e && e.target) {
          seconds = parseInt(e.target.value) || 0
        } else if (this.form.expire_seconds != null) {
          seconds = parseInt(this.form.expire_seconds) || 0
        }
        const { data, resId, accessUrl } = this.params
        const row = data && data.length > 0 ? data[0] : {}
        const url = await objectsModel.getUrl(Object.assign({}, row, { expire_seconds: seconds }), resId, accessUrl)
        this.url = url
      } catch (err) {
        throw err
      }
    },
  },
}
</script>
