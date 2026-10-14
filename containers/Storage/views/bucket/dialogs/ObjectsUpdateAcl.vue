<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="this.params.title" :name="params.name || $t('dictionary.bucket')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model ref="formRef" :model="form" v-bind="formItemLayout">
        <a-spin :spinning="getAclsLoading">
          <a-form-model-item :label="$t('storage.text_93')" prop="acl">
            <a-radio-group v-model:value="form.acl">
              <a-radio-button v-for="k in acls" :key="k" :value="k">{{$t('storageAclTypes')[k]}}</a-radio-button>
            </a-radio-group>
            <div slot="extra">
              <div v-for="k in acls" :key="k">
                {{$t('storageAclExtras')[k]}}<br />
              </div>
          </div>
          </a-form-model-item>
        </a-spin>
      </a-form-model>
    </div>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t("dialog.ok") }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { formItemLayout } from '@Storage/constants/index.js'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ObjectsUpdateAclDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      getAclsLoading: false,
      formItemLayout,
      fileList: [],
      acls: [],
      form: {
        acl: this.params.data[0].acl,
      },
    }
  },
  created () {
    this.queryAcls()
  },
  methods: {
    async queryAcls () {
      this.getAclsLoading = true
      const { bucket, type = 'bucket' } = this.params
      try {
        const ret = await new this.$Manager('cloudproviders', 'v2').getSpecific({
          id: bucket.manager_id,
          spec: 'canned-acls',
        })
        if (ret && ret.data) {
          this.acls = ret.data[`${type}_canned_acls`]
        }
      } catch (err) {
        throw err
      } finally {
        this.getAclsLoading = false
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { acl } = this.form
        const { bucket, data } = this.params
        const key = data.map(({ key }) => key).filter((t) => !!t)
        const params = {
          acl,
        }
        if (key && key.length > 0) {
          params.key = key
        }
        await new this.$Manager('buckets', 'v2').performAction({
          id: bucket.id,
          action: 'acl',
          data: params,
        })
        data.forEach(item => {
          item.acl = acl
        })
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
