<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_709', [$t('dictionary.instancegroup')])}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_297', [$t('dictionary.project')])">
          <domain-project :form="form" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_228')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_694')" :extra="forceDispersionExtra" prop="force_dispersion">
          <a-radio-group v-model:value="form.force_dispersion">
            <a-radio-button :value="true">{{$t('compute.text_695')}}</a-radio-button>
            <a-radio-button :value="false">{{$t('compute.text_696')}}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('compute.text_697')" :extra="$t('compute.text_710')" prop="granularity">
          <a-input-number :min="1" :max="10" :parser="Math.round" v-model:value="form.granularity" />
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
import { isRequired } from '@/utils/validate'
import i18n from '@/locales'
import DomainProject from '@/sections/DomainProject/model'

export default {
  name: 'InstanceGroupCreateDialog',
  components: {
    DomainProject,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        domain: undefined,
        project: undefined,
        name: undefined,
        description: undefined,
        force_dispersion: true,
        granularity: 1,
      },
      rules: {
        domain: [
          { validator: isRequired(), message: i18n.t('rules.domain'), trigger: 'change' },
        ],
        project: [
          { validator: isRequired(), message: i18n.t('rules.project'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('compute.text_210') },
          { validator: this.$validate('resourceName') },
        ],
        granularity: [
          { required: true, message: this.$t('compute.text_711') },
          { type: 'number', min: 1, max: 10, message: this.$t('compute.text_712') },
        ],
      },
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    forceDispersionExtra () {
      let s = this.$t('compute.text_713')
      if (!this.form.force_dispersion) {
        s = this.$t('compute.text_714')
      }
      return s
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { project, domain, ...rest } = this.form
        await this.params.onManager('create', {
          managerArgs: {
            data: {
              ...rest,
              project_domain: (domain && domain.key) || this.userInfo.projectDomainId,
              project_id: (project && project.key) || this.userInfo.projectId,
            },
          },
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
