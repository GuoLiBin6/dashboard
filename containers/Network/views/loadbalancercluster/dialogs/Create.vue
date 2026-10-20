<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{params.title}}</div>
    <div slot="body">
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('network.text_199')" class="mb-0" prop="cloudregion">
          <cloudregion-zone
            :model="form"
            :zone-params="resParams.zone"
            :cloudregion-params="resParams.region"
            filterBrandResource="loadbalancer_engine" />
        </a-form-model-item>
        <a-form-model-item :label="$t('network.text_21')" prop="name">
          <a-input v-model:value="form.name" :placeholder="$t('network.text_44')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.description')" prop="description">
          <a-textarea :auto-size="{ minRows: 1, maxRows: 3 }" v-model:value="form.description" :placeholder="$t('common_367')" />
        </a-form-model-item>
        <a-form-model-item :label="$t('common.text00012')" class="mb-0" prop="__meta__">
          <tag
            :value="form.__meta__"
            @change="v => form.__meta__ = v"
            :allowNoValue="false" />
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
import CloudregionZone from '@/sections/CloudregionZone/model'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import Tag from '@/sections/Tag'
import validateForm, { isRequired } from '@/utils/validate'

export default {
  name: 'LoadbalancerclusterCreateDialog',
  components: {
    CloudregionZone,
    Tag,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        cloudregion: undefined,
        zone: undefined,
        name: undefined,
        description: undefined,
        __meta__: {},
      },
      rules: {
        cloudregion: [
          { validator: isRequired(), message: this.$t('network.text_286'), trigger: 'change' },
        ],
        zone: [
          { validator: isRequired(), message: this.$t('network.text_287'), trigger: 'change' },
        ],
        name: [
          { required: true, message: this.$t('network.text_116') },
          { validator: this.$validate('resourceName') },
        ],
        __meta__: [
          { validator: validateForm('tagName') },
        ],
      },
      resParams: {
        zone: {},
        region: {
          usable: true,
          is_on_premise: true,
          scope: this.$store.getters.scope,
        },
      },
    }
  },
  methods: {
    doCreate (data) {
      const params = {
        name: data.name,
        description: data.description,
        cloudregion_id: data.cloudregion.key,
        zone: data.zone.key,
        zoneData: {
          id: data.zone.key,
          name: data.zone.label,
          regionId: data.cloudregion.key,
        },
        __meta__: data.__meta__,
      }
      return new this.$Manager('loadbalancerclusters').create({
        data: params,
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doCreate(this.form)
        this.loading = false
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        this.loading = false
      }
    },
  },
}
</script>
