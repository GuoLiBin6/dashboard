<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        class="mt-3"
        ref="formRef"
        :model="form"
        :rules="rules"
        v-bind="formItemLayout">
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.domain')])" v-if="$store.getters.isAdminMode" prop="project_domain">
          <domain-select v-model:value="form.project_domain" @change="handleDomainChange" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_717')" prop="zoneType">
          <a-select
            v-model:value="form.zoneType" @change="zoneTypeChangeHandle">
            <a-select-option v-for="v in options.zoneTypes" :value="v.value" :key="v.value">
              <div>{{ v.label }}<span class="ml-2">{{ v.desc }}</span></div>
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_156')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_157')" />
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
import DomainSelect from '@/sections/DomainSelect'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { validate } from '@/utils/validate'
import { zoneTypes } from '../constants'

export default {
  name: 'DnsZoneCreateDialog',
  components: {
    DomainSelect,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const projectDomainId = this.$store.getters.userInfo.projectDomainId
    const zoneType = zoneTypes[0].value
    return {
      loading: false,
      project_domain: projectDomainId,
      options: {
        zoneTypes,
      },
      form: {
        project_domain: projectDomainId,
        zoneType,
        name: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('network.text_157') },
          { validator: this.checkDomainHandle },
        ],
        zoneType: [
          { required: true, message: this.$t('network.text_717') },
        ],
      },
      formItemLayout: {
        wrapperCol: {
          span: 21,
        },
        labelCol: {
          span: 3,
        },
      },
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope']),
  },
  methods: {
    doCreate (data) {
      return new this.$Manager('dns_zones').create({ data })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const { name, project_domain, zoneType } = this.form
        const data = {
          name,
          project_domain_id: project_domain,
          zone_type: zoneType,
        }
        await this.doCreate(data)
        this.loading = false
        this.params.refresh && this.params.refresh()
        this.cancelDialog()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
    handleDomainChange (val) {
      this.project_domain = val
      this.form.project_domain = val
    },
    checkDomainHandle (rule, value, callback) {
      if (this.form.zoneType === 'PublicZone') {
        if (validate(value, 'domain') === false || validate(value, 'domain').result === false) {
          callback(new Error(this.$t('network.text_178')))
        }
      }
      callback()
    },
    zoneTypeChangeHandle () {
      this.$nextTick(() => {
        this.$refs.formRef.validateField('name')
      })
    },
  },
}
</script>
