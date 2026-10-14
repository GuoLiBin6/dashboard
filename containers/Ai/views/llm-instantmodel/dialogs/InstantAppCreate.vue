<template>
  <base-dialog :width="900" @cancel="cancelDialog">
    <div slot="header">{{ $t('common.create') }}</div>
    <div slot="body">
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout" hideRequiredMark>
        <a-form-model-item :label="$t('aice.project')">
          <domain-project :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.name')" prop="name">
          <a-input v-model:value="form.name" placeholder="com.ss.android.ugc.aweme-23.0.1" />
          <template v-slot:extra>
            <name-repeated res="instant_apps" :name="form.name" :default-text="$t('aice.name_repeat_extra')" />
          </template>
        </a-form-model-item>
        <a-form-model-item :label="$t('aice.mounted_apps.package')" prop="package">
          <a-input v-model:value="form.package" placeholder="com.ss.android.ugc.aweme" />
        </a-form-model-item>
        <a-form-model-item :label="$t('aice.mounted_apps.version')" prop="version">
          <a-input v-model:value="form.version" placeholder="23.0.1" />
        </a-form-model-item>
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
import DomainProject from '@/sections/DomainProject/model'
import NameRepeated from '@/sections/NameRepeated'
import { isRequired } from '@/utils/validate'

export default {
  name: 'InstantAppCreateDialog',
  components: {
    DomainProject,
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        domain: undefined,
        project: undefined,
        name: '',
        package: '',
        version: '',
        mounts: '',
        image_id: undefined,
      },
      rules: {
        domain: [
          { validator: isRequired(), message: this.$t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: this.$t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('common.tips.input', [this.$t('common.name')]) },
        ],
        package: [
          { required: true, message: this.$t('common.tips.input', [this.$t('aice.mounted_apps.package')]) },
        ],
        version: [
          { required: true, message: this.$t('common.tips.input', [this.$t('aice.mounted_apps.version')]) },
        ],
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
          generate_name: this.form.name,
          package: this.form.package,
          version: this.form.version,
          mounts: mountPaths,
          image_id: this.form.image_id,
          project_id: this.form.project?.key || this.userInfo.projectId,
        }
        manager.create({
          data,
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
