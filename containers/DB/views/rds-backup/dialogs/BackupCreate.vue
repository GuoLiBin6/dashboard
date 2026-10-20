<template>
  <base-dialog @cancel="cancelDialog" :width="900">
    <div slot="header">{{$t('db.text_215')}}</div>
    <a-form-model ref="formRef" slot="body" :model="form" :rules="rules" class="mt-3">
      <a-form-model-item :label="$t('db.text_60')" prop="generate_name">
        <a-input v-model:value="form.generate_name" :placeholder="$t('db.text_216')" />
        <name-repeated v-slot:extra res="dbinstancebackups" :name="form.generate_name" />
      </a-form-model-item>
        <a-form-model-item :label="$t('db.text_217')" v-if="!params.rdsItem" prop="dbinstance">
        <a-select v-model:value="form.dbinstance" :placeholder="$t('db.text_218')" :loading="rdsListLoading">
          <a-select-option :key="item.id" v-for="item in rdsList">{{item.name}}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_219')" prop="description">
        <a-textarea :autosize="{ minRows: 2, maxRows: 6 }" v-model:value="form.description" :placeholder="$t('db.text_220')" />
      </a-form-model-item>
    </a-form-model>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import NameRepeated from '@/sections/NameRepeated'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'

export default {
  name: 'RDSBackupCreate',
  components: {
    NameRepeated,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    return {
      loading: false,
      form: {
        generate_name: undefined,
        description: undefined,
        dbinstance: undefined,
      },
      rdsListLoading: false,
      rdsList: [],
    }
  },
  computed: {
    rules () {
      const rules = {
        generate_name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('serverName') },
        ],
        description: [
          { max: 200 },
        ],
      }
      if (!this.params.rdsItem) {
        rules.dbinstance = [
          { required: true, message: this.$t('db.text_136') },
        ]
      }
      return rules
    },
  },
  created () {
    if (!this.params.rdsItem) {
      this.fetchQueryRDSList()
    }
  },
  methods: {
    async fetchQueryRDSList () {
      const manager = new this.$Manager('dbinstances', 'v2')
      this.rdsListLoading = true
      try {
        const { data } = await manager.list({
          params: {
            scope: this.$store.getters.scope,
            limit: 0,
            status: 'running',
          },
        })
        this.rdsList = data.data
      } catch (err) {
        throw err
      } finally {
        this.rdsListLoading = false
      }
    },
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = { ...this.form }
        if (this.params.rdsItem) {
          values.dbinstance_id = this.params.rdsItem.id
          values.dbinstance = this.params.rdsItem.id
        }
        await this.params.list.onManager('create', {
          managerArgs: {
            data: values,
          },
        })
        this.cancelDialog()
      } catch (err) {
        throw err
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
