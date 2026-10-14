<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{this.params.title}}</div>
    <div slot="body">
      <dialog-selected-tips :count="params.data.length" :action="this.params.title" :name="$t('storage.text_18')" />
      <dialog-table :data="params.data" :columns="columns" />
      <a-form-model ref="formRef" :model="form" :rules="rules" v-bind="formItemLayout">
        <a-form-model-item :label="$t('storage.text_59')" prop="size_bytes">
          <a-input class="w-50" name="size_bytes" v-model:value="form.size_bytes" @blur="handelBlur">
            <a-select slot="addonAfter" style="width: 80px" v-model:value="form.size_bytes_unit">
              <a-select-option v-for="item in sizeUnitOpts" :key="item.value" :value="item.value">{{item.label}}</a-select-option>
            </a-select>
          </a-input>
           <span slot="extra">{{$t('storage.text_127')}}</span>
        </a-form-model-item>
         <a-form-model-item :label="$t('storage.text_128')" prop="object_count">
          <a-input class="w-50" name="object_count" v-model:value="form.object_count" @blur="handelBlur">
            <a-select slot="addonAfter" type="number" style="width: 80px" v-model:value="form.object_count_unit">
              <a-select-option v-for="item in unitOpts" :key="item.value" :value="item.value">{{item.label}}</a-select-option>
            </a-select>
          </a-input>
          <span slot="extra">{{$t('storage.text_127')}}</span>
        </a-form-model-item>
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
import { sizestrC } from '@/utils/utils'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'BucketUpdateBucketLimitDialog',
  components: {
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { data } = this.params
    // eslint-disable-next-line camelcase
    const { size_bytes_limit = 0, object_cnt_limit = 0 } = data.length === 1 ? data[0] : {}
    return {
      loading: false,
      formItemLayout,
      form: {
        // eslint-disable-next-line camelcase
        size_bytes: Math.round(size_bytes_limit / (1024 * 1024 * 1024)),
        size_bytes_unit: Math.pow(1024, 3),
        object_count: Math.round(object_cnt_limit),
        object_count_unit: 1,
      },
      rules: {
        size_bytes: [
          { required: true, message: this.$t('storage.text_136') },
        ],
        object_count: [
          { required: true, message: this.$t('storage.text_137') },
        ],
      },
      sizeUnitOpts: [
        { value: Math.pow(1024, 3), label: 'GB' },
        { value: Math.pow(1024, 4), label: 'TB' },
        { value: Math.pow(1024, 5), label: 'PB' },
        { value: Math.pow(1024, 6), label: 'EB' },
      ],
      unitOpts: [
        { value: 1, label: this.$t('storage.text_129') },
        { value: 10, label: this.$t('storage.text_130') },
        { value: 100, label: this.$t('storage.text_131') },
        { value: 1000, label: this.$t('storage.text_132') },
        { value: 10000, label: this.$t('storage.text_133') },
      ],
    }
  },
  computed: {
    columns () {
      return [
        this.params.columns[0],
        {
          field: 'size_bytes_limit',
          title: this.$t('storage.text_134'),
          width: 120,
          formatter: ({ row }) => {
            return sizestrC(row.size_bytes_limit, 'B', 1024)
          },
        },
        {
          field: 'object_cnt_limit',
          title: this.$t('storage.text_135'),
          width: 120,
          formatter: ({ row }) => {
            return row.object_cnt_limit
          },
        },
      ]
    },
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        // eslint-disable-next-line camelcase
        const { size_bytes, size_bytes_unit, object_count, object_count_unit } = this.form
        const values = {
          limit: {
            size_bytes: parseInt(size_bytes) * parseInt(size_bytes_unit),
            object_count: parseInt(object_count) * parseInt(object_count_unit),
          },
        }
        const { data } = this.params
        await this.params.onManager('batchPerformAction', {
          id: data.map(item => item.id),
          steadyStatus: ['ready', 'create_fail', 'deleted', 'delete_fail'],
          managerArgs: {
            action: 'limit',
            data: values,
          },
        })
        this.params.refresh()
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
    handelBlur ({ target }) {
      const { value, name } = target
      if (!/^\d+$/.test(value)) {
        this.form[name] = 0
      }
    },
  },
}
</script>
