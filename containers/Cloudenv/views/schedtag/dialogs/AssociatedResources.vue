<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{ $t('cloudenv.text_454') }}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.schedtag')" :count="params.data.length" :action="$t('cloudenv.text_454')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <loader loading v-if="!(bindedResourcesLoaded && resourcesInitLoaded)" />
      <a-form-model
        ref="formRef"
        :model="form"
        hideRequiredMark
        v-show="bindedResourcesLoaded && resourcesInitLoaded">
        <a-form-model-item :label="$t('cloudenv.text_384')" prop="resource_type">
          <a-radio-group v-model:value="form.resource_type">
            <a-radio-button
              :value="resType.key"
              :key="resType.key">{{ resType.label }}</a-radio-button>
          </a-radio-group>
        </a-form-model-item>
        <a-form-model-item :label="$t('cloudenv.text_469')" prop="resource">
          <base-select
            v-model:value="form.resource"
            :resource="resource"
            version="v1"
            remote
            :params="resourceParams"
            :mapper="mapperResources"
            v-model:initLoaded="resourcesInitLoaded"
            :select-props="{ allowClear: true, placeholder: $t('cloudenv.text_284', [$t('cloudenv.text_454')]), mode: 'multiple' }"
            :remote-fn="q => ({ filter: `name.contains(${q})` })">
            <template v-slot:optionTemplate="{ options }">
              <a-select-option v-for="item in options" :key="item.id" :value="item.id" :disabled="item.__disabled">
                <div class="d-flex">
                  <span class="text-truncate flex-fill">{{ item.access_ip ? `${item.name}(${item.access_ip})` : item.name }}</span>
                </div>
              </a-select-option>
            </template>
          </base-select>
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
import * as R from 'ramda'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import { RES_TYPES } from '../utils'

export default {
  name: 'AssociatedResourcesDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      bindedResources: [],
      bindedResourcesLoaded: false,
      resourcesInitLoaded: false,
      form: {
        resource_type: this.params.data[0].resource_type || '',
        resource: [],
      },
    }
  },
  computed: {
    ...mapGetters(['scope']),
    selectedItem () {
      return this.params.data && this.params.data[0]
    },
    resType () {
      return {
        key: this.selectedItem.resource_type,
        label: RES_TYPES[this.selectedItem.resource_type],
      }
    },
    resource () {
      return this.selectedItem.resource_type
    },
    resourceParams () {
      return {
        scope: this.scope,
      }
    },
  },
  created () {
    this.fetchBindedResources()
  },
  methods: {
    mapperResources (data) {
      let newData = [...data, ...this.bindedResources]
      newData = R.uniqBy(item => item.id, newData)
      return newData
    },
    async fetchBindedResources () {
      try {
        const { data: { data = [] } } = await new this.$Manager('schedtags').get({
          id: `${this.params.data[0].id}/${this.resource}`,
        })
        this.bindedResources = data.map(v => {
          const field = this.resource.substring(0, this.resource.length - 1)
          return {
            id: v[`${field}_id`],
            name: v[field],
          }
        })
        this.$nextTick(() => {
          this.form.resource = this.bindedResources.map(v => v.id)
        })
        this.bindedResourcesLoaded = true
      } catch (error) {
        throw error
      }
    },
    doSubmit (values) {
      this.params.onManager('performAction', {
        id: this.params.data[0].id,
        managerArgs: {
          action: 'set-resource',
          data: {
            resource_ids: values.resource,
          },
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doSubmit(this.form)
        this.cancelDialog()
        this.$message.success(this.$t('cloudenv.text_381'))
      } catch (error) {
        // validation or API error
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
