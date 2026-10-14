<template>
  <base-dialog :width="900" @cancel="cancelDialog">
    <div slot="header">{{ $t('common.update') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('aice.mounted_apps')" :count="params.data.length" :action="action" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item :label="$t('aice.mounted_apps.mounts')" prop="mounts">
          <a-textarea v-model:value="form.mounts" :placeholder="mountsExample" :auto-size="{ minRows: 3, maxRows: 5 }" />
        </a-form-model-item>
        <a-form-model-item :label="$t('aice.template')" prop="image_id">
          <base-select
            v-model:value="form.image_id"
            resource="images"
            :params="templateParams"
            filterable
            :selectProps="{ placeholder: $t('common.tips.select', [$t('aice.template')]) }" />
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'PhoneImageUpdateDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const row = this.params.data[0] || {}
    return {
      loading: false,
      form: {
        mounts: (row.mounts || []).join('\n'),
        image_id: row.image_id,
      },
      rules: {
        mounts: [
          { required: true, message: this.$t('common.tips.input', [this.$t('aice.mounted_apps.mounts')]) },
        ],
        image_id: [
          { required: true, message: this.$t('common.tips.input', [this.$t('aice.template')]) },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 20,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    columns () {
      const showFields = ['name', 'package', 'version', 'image']
      return this.params.columns.filter((item) => { return showFields.includes(item.field) })
    },
    mountsExample () {
      return '/data/app/~~AiggKR4DW03_Ue4jSG2YmQ==\n/data/data/com.ss.android.ugc.aweme\n/data/media/0/Android/data/com.ss.android.ugc.aweme'
    },
    templateParams () {
      const ret = {
        scope: this.scope,
        'disk_formats.0': 'tgz',
        details: false,
      }
      return ret
    },
  },
  methods: {
    async handleConfirm () {
      try {
        await this.$refs.formRef.validate()
        const manager = new this.$Manager('instant_apps', '')
        const mountPaths = this.form.mounts.split('\n')
        const data = {
          mounts: mountPaths,
          image_id: this.form.image_id,
        }
        manager.update({
          id: this.params.data[0].id,
          data: data,
        })
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
      this.params.callback && this.params.callback()
      this.cancelDialog()
      this.params.refresh && this.params.refresh()
    },
  },
}
</script>
