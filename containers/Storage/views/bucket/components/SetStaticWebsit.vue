<template>
  <div>
    <page-header :title="$t('storage.text_183')" />
    <page-body>
      <dialog-selected-tips :name="$t('storage.text_18')" :count="1" :action="$t('storage.text_183')" />
      <dialog-table class="mb-2" :data="currentItem" :columns="bucketColumns" />
      <a-divider />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('storage.text_41')" prop="status">
          <a-switch
            v-model:checked="form.status"
            :checked-children="$t('storage.text_184')"
            :un-checked-children="$t('storage.text_185')"
            @change="handleStatusChange" />
        </a-form-model-item>
        <template v-if="form.status">
          <a-form-model-item :label="$t('storage.text_186')" prop="index" :extra="$t('storage.text_187')">
            <a-input v-model:value="form.index" />
          </a-form-model-item>
          <a-form-model-item :label="$t('storage.text_188')" prop="error_document" :extra="$t('storage.text_189')">
            <a-input v-model:value="form.error_document" />
          </a-form-model-item>
        </template>
      </a-form-model>
    </page-body>
    <page-footer>
      <template #right>
        <div>
          <a-button class="mr-2" type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
          <a-button @click="handleCancel">{{ $t('dialog.cancel') }}</a-button>
        </div>
      </template>
    </page-footer>
  </div>
</template>

<script>
import { getNameDescriptionTableColumn, getStatusTableColumn } from '@/utils/common/tableColumn'

export default {
  name: 'SetStaticWebsit',
  data () {
    return {
      loading: false,
      form: {
        status: !!this.$route.query.url,
        index: this.$route.query.index || '',
        error_document: this.$route.query.error_document || '',
      },
      rules: {
        index: [
          { required: true, message: this.$t('storage.text_190'), trigger: 'blur' },
        ],
        error_document: [
          { required: true, message: this.$t('storage.text_190'), trigger: 'blur' },
        ],
      },
      currentItem: [],
      bucketColumns: [
        getNameDescriptionTableColumn(),
        getStatusTableColumn({ statusModule: 'bucket' }),
        {
          field: 'storage_class',
          title: this.$t('storage.text_38'),
          width: 120,
          formatter: ({ row }) => {
            return row.storage_class || '-'
          },
        },
      ],
    }
  },
  async created () {
    const { data: { data } } = await this.fetchBucketData(this.$route.query.id)
    this.currentItem = data
  },
  methods: {
    fetchBucketData (id) {
      return new this.$Manager('buckets').list({
        params: {
          id,
          batchGet: true,
        },
      })
    },
    doSet (data) {
      return new this.$Manager('buckets').performAction({
        id: this.$route.query.id,
        action: 'set-website',
        data: {
          ...data,
          protocol: 'http',
        },
      })
    },
    doDelete () {
      return new this.$Manager('buckets').performAction({
        id: this.$route.query.id,
        action: 'delete-website',
      })
    },
    handleStatusChange (val) {
      this.form.status = val
    },
    handleCancel () {
      this.$router.back()
    },
    async handleConfirm () {
      this.loading = true
      try {
        if (this.form.status) {
          await this.$refs.formRef.validate()
          await this.doSet({
            index: this.form.index,
            error_document: this.form.error_document,
          })
        } else {
          await this.doDelete()
        }
        this.loading = false
        this.$message.success(this.$t('storage.text_191'))
        this.$router.push('/bucket')
      } catch (err) {
        this.loading = false
      }
    },
  },
}
</script>
