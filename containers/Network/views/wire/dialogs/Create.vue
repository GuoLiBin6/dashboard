<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('network.text_696')}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_205', [$t('dictionary.domain')])" v-if="$store.getters.isAdminMode" prop="project_domain">
          <domain-select v-model:value="form.project_domain" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('validator.resourceName')"  />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item label="VPC" :validateStatus="vpcValidateStatus" :help="vpcHelp" :required="true">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-model-item prop="area" class="mb-0">
                <a-select
                  v-model:value="form.area"
                  @change="handleAreaChange"
                  :placeholder="$t('network.text_199')">
                  <a-select-option v-for="item in areas" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">{{ $t('network.text_199') }}:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
            <a-col :span="12">
              <a-form-model-item prop="vpc" class="mb-0">
                <a-select
                  v-model:value="form.vpc"
                  placeholder="VPC">
                  <a-select-option v-for="item in vpcs" :value="item.value" :key="item.value">
                    <span class="text-color-secondary option-prefix">VPC:</span>
                    {{item.label}}
                  </a-select-option>
                </a-select>
              </a-form-model-item>
            </a-col>
          </a-row>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_24')" prop="zone">
          <a-select
            show-search
            :filterOption="filterOption"
            v-model:value="form.zone"
            :placeholder="$t('network.text_24')">
            <a-select-option v-for="item in zones" :value="item.value" :key="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_195')" prop="bandwidth">
          <a-select
            v-model:value="form.bandwidth"
            :placeholder="$t('network.text_697')">
            <a-select-option v-for="item in bandwidthOptions" :value="item.value" :key="item.value">
              {{item.label}}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.__meta__"
            @change="v => form.__meta__ = v" />
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
import DomainSelect from '@/sections/DomainSelect'
import Tag from '@/sections/Tag'
import validateForm from '@/utils/validate'
import { BAND_WIDTH_OPTION } from '../../../constants'
export default {
  name: 'WireCreateDialog',
  components: {
    DomainSelect,
    Tag,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const validateName = (rule, value, callback) => {
      if (this.$route.query.id) {
        callback()
      }
      const wiresManager = new this.$Manager('wires')
      wiresManager.list({
        params: {
          filter: 'name.equals(' + value + ')',
        },
      })
        .then((res) => {
          const data = res.data.data
          if (data.length === 0) {
            callback()
          }
          callback(new Error(this.$t('network.text_698')))
        })
    }
    return {
      loading: false,
      vpcValidateStatus: '',
      vpcHelp: '',
      form: {
        project_domain: this.$store.getters.userInfo.projectDomainId,
        name: '',
        description: undefined,
        area: undefined,
        vpc: undefined,
        zone: undefined,
        bandwidth: undefined,
        __meta__: {},
      },
      rules: {
        area: [
          { required: true, message: this.$t('network.text_286') },
        ],
        vpc: [
          { required: true, message: this.$t('network.text_274') },
        ],
        zone: [
          { required: true, message: this.$t('network.text_24') },
        ],
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
          { validator: validateName, trigger: ['blur'] },
        ],
        bandwidth: [
          { required: true, message: this.$t('network.text_699') },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      areas: [],
      vpcs: [],
      zones: [],
      bandwidthOptions: BAND_WIDTH_OPTION,
    }
  },
  computed: {
    ...mapGetters(['isAdminMode', 'scope', 'userInfo']),
  },
  created () {
    this.fetchAreas()
    this.fetchZones()
  },
  methods: {
    fetchAreas () {
      const manager = new this.$Manager('cloudregions')
      manager.list({
        params: {
          is_on_premise: true,
        },
      }).then((res) => {
        this.areas = res.data.data.map((item) => {
          return {
            label: this._$t(item),
            value: item.id,
          }
        })
        if (this.areas.length) {
          const defaultValue = this.areas[0].value
          this.form.area = defaultValue
          this.handleAreaChange(defaultValue)
        }
      })
    },
    fetchVpcs (area) {
      const manager = new this.$Manager('vpcs')
      const params = {
        cloudregion_id: area,
      }
      if (this.isAdminMode) {
        params.project_domain = this.userInfo.domain.id
      } else {
        params.scope = this.scope
      }
      manager.list({ params }).then((res) => {
        this.vpcs = res.data.data.map((item) => {
          return {
            label: item.name,
            value: item.id,
          }
        })
        if (area === 'default') this.vpcs = this.vpcs.filter(({ value }) => value === 'default')
        if (this.vpcs.length) {
          this.form.vpc = this.vpcs[0].value
        }
      })
    },
    fetchZones () {
      const manager = new this.$Manager('zones')
      manager.list({
        params: {
          is_on_premise: true,
        },
      }).then((res) => {
        this.loadZoneOptions(res.data.data)
      })
    },
    loadZoneOptions (data) {
      const results = []
      for (let i = 0; i < data.length; i++) {
        const zone = data[i]
        let name = this._$t(zone)
        if (zone.name_cn) {
          name += '(' + zone.name_cn + ')'
        }
        results.push({ label: name, value: zone.id })
      }
      this.zones = results
    },
    handleAreaChange (e) {
      this.fetchVpcs(e)
    },
    doCreate (data) {
      const params = {
        project_domain: data.project_domain,
        name: data.name,
        description: data.description,
        zone_id: data.zone,
        vpc_id: data.vpc,
        bandwidth: data.bandwidth,
        __meta__: data.__meta__,
      }
      return this.params.onManager('create', {
        managerArgs: {
          data: params,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (!this.form.area) {
          this.vpcValidateStatus = 'error'
          this.vpcHelp = this.$t('network.text_286')
          this.loading = false
          return
        } else if (!this.form.vpc) {
          this.vpcValidateStatus = 'error'
          this.vpcHelp = this.$t('network.text_274')
          this.loading = false
          return
        }
        this.vpcValidateStatus = ''
        this.vpcHelp = ''
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
      }
    },
    filterOption (input, option) {
      const lastIdx = option.componentOptions.children.length - 1
      return (
        option.componentOptions.children[lastIdx].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
  },
}
</script>
