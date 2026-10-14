<template>
  <base-dialog @cancel="cancelDialog" :width="900">
    <div slot="header">{{params.title}}</div>
    <a-form-model ref="formRef" slot="body" :model="form.fd" :rules="rules" class="mt-3" v-bind="formItemLayout">
      <a-form-model-item :label="$t('db.text_232')" prop="name">
        <a-input :placeholder="$t('validator.dbName')" v-model:value="form.fd.name" />
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_233')" prop="character_set">
        <a-select allowClear showSearch :placeholder="$t('db.text_234')" v-model:value="form.fd.character_set">
          <a-select-option
            v-for="item in CHARACTER_SET"
            :key="item"
            :value="item">{{ item }}</a-select-option>
        </a-select>
      </a-form-model-item>
      <a-form-model-item :label="$t('db.text_188')" v-if="this.params.rdsItem.brand !== 'Google'">
        <database-privileges :rdsItem="params.rdsItem" />
      </a-form-model-item>
    </a-form-model>
    <div slot="footer">
      <a-button type="primary" @click="handleConfirm" :loading="loading">{{ $t('dialog.ok') }}</a-button>
      <a-button @click="cancelDialog">{{ $t('dialog.cancel') }}</a-button>
    </div>
  </base-dialog>
</template>

<script>
import { RDS_ACCOUNT_PRIVILEGES } from '@DB/constants'
import DialogMixin from '@/mixins/dialog'
import WindowsMixin from '@/mixins/windows'
import validateForm from '@/utils/validate'
import DatabasePrivileges from '../components/DatabasePrivileges'
const CHARACTER_SET = ['utf8', 'gbk', 'latin1', 'utf8mb4', 'euckr', 'armscii8', 'ascii', 'big5', 'binary', 'cp1250', 'cp1251', 'cp1256', 'cp1257', 'cp850', 'cp852', 'cp866', 'cp932', 'dec8', 'eucjpms', 'gb2312', 'geostd8', 'greek', 'hebrew', 'hp8', 'keybcs2', 'koi8r', 'koi8u', 'latin2', 'latin5', 'latin7', 'macce', 'macroman', 'sjis', 'swe7', 'tis620', 'ucs2', 'ujis', 'utf16', 'utf16le', 'utf32']
export default {
  name: 'RDSDatabaseCreateDialog',
  components: {
    DatabasePrivileges,
  },
  mixins: [DialogMixin, WindowsMixin],
  data () {
    const { initialValues = {} } = this.params
    return {
      loading: false,
      CHARACTER_SET,
      privileges: RDS_ACCOUNT_PRIVILEGES,
      form: {
        fd: {
          name: initialValues.name,
          character_set: 'utf8',
        },
      },
      rules: {
        name: [
          { required: true, message: this.$t('db.text_136') },
          { validator: validateForm('dbName') },
        ],
        character_set: [
          { required: true, message: this.$t('db.text_234') },
        ],
      },
      formItemLayout: {
        wrapperCol: { span: 20 },
        labelCol: { span: 4 },
      },
    }
  },
  provide () {
    return {
      form: this.form,
    }
  },
  methods: {
    async handleConfirm () {
      this.loading = true
      try {
        await this.$refs.formRef.validate()
        const values = {
          ...this.form.fd,
        }
        const params = {
          ...values,
          dbinstance: this.params.rdsItem.id,
        }
        await this.params.onManager('create', {
          managerArgs: {
            data: params,
          },
        })
        this.loading = false
        this.cancelDialog()
      } catch (error) {
        this.loading = false
        throw error
      }
    },
  },
}
</script>
