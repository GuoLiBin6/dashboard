<template>
  <base-dialog @cancel="cancelDialog">
    <div slot="header">{{$t('compute.text_1012')}}</div>
    <div slot="body">
      <dialog-selected-tips :name="$t('dictionary.secgroup')" :count="params.data.length" :action="$t('compute.text_1013')" />
      <dialog-table :data="params.data" :columns="params.columns.slice(0, 3)" />
      <a-form-model
        ref="formRef"
        :model="form"
        :rules="rules">
        <a-form-model-item :label="$t('compute.text_1014')" prop="name">
          <a-select v-model:value="form.name" mode="multiple">
            <a-select-option v-for="item in secgroupOps" :key="item.id" :value="item.id">
              {{item.name}}
            </a-select-option>
          </a-select>
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
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'

export default {
  name: 'ConcatSecgroupDialog',
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        name: undefined,
      },
      rules: {
        name: [
          { required: true, message: this.$t('compute.text_1015') },
        ],
      },
      secgroupOps: [],
    }
  },
  computed: {
    scope () {
      return this.$store.getters.scope
    },
  },
  created () {
    this.remoteMethod()
  },
  methods: {
    remoteMethod () {
      const params = {
        details: true,
        equals: this.params.data[0].id,
        limit: 0,
        scope: this.scope,
      }
      new this.$Manager('secgroups').list({ params })
        .then(({ data: { data = [] } }) => {
          this.secgroupOps = data.filter(val => val.id !== this.params.data[0].id)
        })
    },
    doConcat () {
      return new this.$Manager('secgroups').performAction({
        id: this.params.data[0].id,
        action: 'merge',
        data: {
          secgroups: this.form.name,
        },
      })
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        await this.doConcat()
        this.cancelDialog()
        this.params.refresh()
      } catch (error) {
        // validate or submit failed
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
