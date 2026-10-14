<template>
  <div class="server-password">
    <a-form-model-item class="mb-2" :prop="loginTypeProp">
      <a-radio-group v-model:value="form[loginTypeProp]" :disabled="disabled" @change="loginTypeChange">
        <a-radio-button v-for="item of loginTypeMap" :value="item.key" :key="item.key" :disabled="disabledLoginTypes.includes(item.key)">
          {{ item.label }}
          <help-tooltip v-if="['image', 'keypair'].includes(item.key)" :name="`${item.key}Password`" class="ml-2" />
        </a-radio-button>
      </a-radio-group>
    </a-form-model-item>
    <a-form-model-item v-if="(loginTypeMap && loginTypeMap.keypair) && form[loginTypeProp] === loginTypeMap.keypair.key" class="mb-0" :prop="keypairProp">
      <template #extra>
        {{$t('compute.text_201')}}<help-link :href="href">{{$t('compute.text_202')}}</help-link>
      </template>
      <base-select
        class="w-50"
        v-model:value="form[keypairProp]"
        resource="keypairs"
        :isDefaultSelect="true"
        :showSync="true"
        :select-props="{ allowClear: true, placeholder: $t('compute.text_203') }" />
    </a-form-model-item>
    <a-form-model-item v-if="(loginTypeMap && loginTypeMap.password) && form[loginTypeProp] === loginTypeMap.password.key" class="mb-0" :prop="passwordProp">
      <a-input-password
        class="w-50"
        v-model:value="form[passwordProp]"
        :placeholder="$t('compute.text_204')" />
    </a-form-model-item>
  </div>
</template>

<script>
import * as R from 'ramda'
import { LOGIN_TYPES_MAP } from '@Compute/constants'
import { passwordValidator } from '@/utils/validate'
import i18n from '@/locales'

export const PASSWORD_RULES = [
  { required: true, message: i18n.t('compute.text_204') },
  { validator: passwordValidator },
]

export default {
  name: 'ServerPassword',
  props: {
    loginTypes: {
      type: Array,
    },
    form: {
      type: Object,
      required: true,
    },
    loginTypeProp: {
      type: String,
      default: 'loginType',
    },
    keypairProp: {
      type: String,
      default: 'keypair',
    },
    passwordProp: {
      type: String,
      default: 'password',
    },
    initialLoginType: {
      type: String,
      default: LOGIN_TYPES_MAP.random.key,
    },
    isSnapshotImageType: {
      type: Boolean,
      default: false,
    },
    disabledLoginTypes: {
      type: Array,
      default: () => ([]),
    },
  },
  data () {
    return {
      disabled: false,
    }
  },
  computed: {
    loginTypeMap () {
      if (this.loginTypes && this.loginTypes.length > 0) {
        const map = {}
        for (const k in LOGIN_TYPES_MAP) {
          if (this.loginTypes.includes(k)) {
            map[k] = LOGIN_TYPES_MAP[k]
          }
        }
        return map
      }
      return LOGIN_TYPES_MAP
    },
    href () {
      return this.$router.resolve('/keypair').href
    },
  },
  watch: {
    isSnapshotImageType (val) {
      if (val) {
        this.disabled = true
        const v = LOGIN_TYPES_MAP.image.key
        this.form[this.loginTypeProp] = v
      } else {
        this.disabled = false
      }
    },
    loginTypeMap: {
      immediate: true,
      handler (val, oldv) {
        if (oldv !== undefined && R.equals(val, oldv)) return
        this.setLoginType()
      },
    },
  },
  methods: {
    loginTypeChange (e) {
      const v = e && e.target ? e.target.value : e
      this.form[this.loginTypeProp] = v
      this.$emit('change', v)
    },
    setLoginType () {
      if (!this.loginTypeMap || R.isEmpty(this.loginTypeMap)) return
      const keys = Object.keys(this.loginTypeMap)
      let vmLoginType = this.form[this.loginTypeProp] || this.initialLoginType
      if (!keys.includes(vmLoginType) || this.isSnapshotImageType) {
        if (keys.includes(LOGIN_TYPES_MAP.image.key)) {
          vmLoginType = LOGIN_TYPES_MAP.image.key
        } else {
          vmLoginType = keys[0]
        }
      }
      this.form[this.loginTypeProp] = vmLoginType
    },
  },
}
</script>
