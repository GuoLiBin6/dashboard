<template>
  <div>
    <div v-if="showUsernameInput && loginDomain" class="login-domain-title d-flex justify-content-center align-items-center">
      <div class="selected-user-wrap d-flex justify-content-center flex-wrap p-1 align-items-center">
        <div class="selected-user-name">{{ $t('auth.current.domain') }}: {{ loginDomain }}</div>
        <div class="ml-2 d-flex">
          <a-popover v-model:open="showSetDomainPopover" :title="$t('auth.set.current.domain')" trigger="click">
            <a-tooltip :title="$t('auth.click.set.current.domain')">
              <a-button type="link">
                <template #icon><icon type="edit" /></template>
              </a-button>
            </a-tooltip>
            <template #content>
              <edit-form :width="450" :formRules="domainInputRules" :defaultValue="loginDomain" :label="$t('common.login_domain')" @submit="submitLoginDomain" @cancel="showSetDomainPopover = false" />
            </template>
          </a-popover>
        </div>
      </div>
    </div>
    <template v-if="!showUsernameInput">
      <div class="selected-user-wrap text-center mb-4">
        <div class="selected-user-content" @click="$router.replace({ path: '/auth/login/chooser', query: { rf: $route.query.rf } })">
          <div class="mr-2 name-icon">{{ firstNameWord }}</div>
          <div class="selected-user-name">{{ displayUserName }}</div>
          <div class="ml-2 d-flex align-items-center">
            <svg aria-hidden="true" fill="currentColor" focusable="false" width="18px" height="18px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12,16.41 5.29,9.71 6.71,8.29 12,13.59 17.29,8.29 18.71,9.71" /></svg>
          </div>
        </div>
      </div>
    </template>
    <a-form
      ref="form"
      :model="fd"
      :rules="rules"
      @finish="handleLogin"
      @finishFailed="handleLoginFailed">
      <!-- 用户名 -->
      <template v-if="showUsernameInput">
        <a-form-item name="username">
          <a-input v-model:value="fd.username" :placeholder="placeholderOpts.username" :autocomplete="isForgetLoginUser?'off':'on'">
            <template #prefix>
              <icon type="user" style="color: rgba(0, 0, 0, .35)" />
            </template>
          </a-input>
        </a-form-item>
      </template>
      <!-- 密码 -->
      <a-form-item v-if="isForgetLoginUser" name="password">
        <a-input type="text" style="display: none" />
        <a-input :type="inputType" v-model:value="fd.password" :placeholder="placeholderOpts.password" autocomplete="new-password" :readonly="passwordReadonly" @focus="inputFocus" @blur="inputBlur">
          <template #prefix>
            <icon type="password" style="color: rgba(0, 0, 0, .35)" />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item v-else name="password">
        <a-input-password v-model:value="fd.password" :placeholder="placeholderOpts.password">
          <template #prefix>
            <icon type="password" style="color: rgba(0, 0, 0, .35)" />
          </template>
        </a-input-password>
      </a-form-item>
      <!-- 域 -->
      <template v-if="showDomainSelect && regions.domains">
        <a-form-item name="domain">
          <a-select v-model:value="fd.domain" :placeholder="placeholderOpts.domain">
            <a-select-option
              v-for="item in regions.domains"
              :key="item"
              :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
      </template>
      <!-- 区域 -->
      <template v-if="showRegionSelect">
        <a-form-item name="region">
          <a-select v-model:value="fd.region" :placeholder="placeholderOpts.region">
            <a-select-option
              v-for="item in regions.regions"
              :key="item"
              :value="item">{{ item }}</a-select-option>
          </a-select>
        </a-form-item>
      </template>
      <!-- 验证码 -->
      <template v-if="showCaptchaInput">
        <a-form-item name="captcha" class="captcha-form-item">
          <a-input v-model:value="fd.captcha" :placeholder="placeholderOpts.captcha">
            <template #prefix>
              <icon type="res-iamsecurityalerts" style="color: rgba(0, 0, 0, .35)" />
            </template>
            <template #suffix>
              <div class="captcha-suffix d-flex align-items-center justify-content-end">
                <icon v-show="captchaLoading" type="loading" spin />
                <img v-show="!captchaLoading && captchaImg" :src="captchaImg" alt="captcha" @click="fetchCaptcha" />
              </div>
            </template>
          </a-input>
        </a-form-item>
      </template>
      <!-- 确定按钮 -->
      <a-form-item class="mb-0">
        <a-button
          type="primary"
          html-type="submit"
          :loading="submiting"
          block>{{ $t('auth.login.submit') }}</a-button>
      </a-form-item>
      <!-- 额外操作 -->
      <a-form-item class="mb-0 login-extra-actions">
        <div class="d-flex justify-content-between login-link">
          <div class="flex-shrink-1 flex-grow-1 text-left">
            <template v-if="hasLoggedUsers">
              <a class="week-link-button login-chooser-link" @click="$router.replace({ path: '/auth/login/chooser', query: { rf: $route.query.rf, domain: $route.query.domain } })">
                <icon type="usergroup" />
                {{ $t('auth.chooser') }}
              </a>
            </template>
          </div>
          <div class="flex-shrink-1 flex-grow-1 text-right">
            <template v-if="showDomainChooser && showUsernameInput && !loginDomain">
              <a-popover v-model:open="showSetDomainPopover" :title="$t('auth.set.current.domain')" trigger="click">
                <a class="week-link-button">{{ $t('common.switch_login_domain') }}</a>
                <template #content>
                  <edit-form :width="450" :formRules="domainInputRules" :defaultValue="loginDomain" :label="$t('common.login_domain')" @submit="submitLoginDomain" @cancel="showSetDomainPopover = false" />
                </template>
              </a-popover>
            </template>
          </div>
        </div>
      </a-form-item>
      <a-form-item class="mb-0">
        <div class="d-flex justify-content-between login-link">
          <div class="flex-shrink-1 flex-grow-1 text-left">
            <slot name="actions-left" />
          </div>
          <div class="flex-shrink-1 flex-grow-1 text-right">
            <slot name="actions-right" />
          </div>
        </div>
      </a-form-item>
    </a-form>
    <!-- 第三方登录 -->
    <div class="flex-shrink-0 flex-grow-0">
      <template v-if="showUsernameInput && idps.length > 0">
        <div class="fast-login-wrap">
          <div class="fast-login-title d-flex justify-content-center align-items-center"><span class="mr-2" />{{ $t('auth.login.fast.login.title') }}<span class="ml-2" /></div>
          <div class="d-flex justify-content-center flex-wrap p-1">
            <div class="fast-login-items" :key="idx" v-for="(item, idx) of idps">
              <a-tooltip placement="top">
                <template #title>
                  {{ $t(`idpTmplTitles.${item.template || item.driver}`) + '/' + item.name }}
                </template>
                <a
                  href="javascript:;"
                  class="fast-login-item d-flex align-items-center justify-content-center ml-2 mr-2"
                  @click.prevent="handleClickIdp(item)">
                  <img :src="getIcon(item)" alt="" />
                </a>
              </a-tooltip>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import * as R from 'ramda'
import { mapState } from 'vuex'
import { Base64 } from 'js-base64'
import { aesEncrypt } from '@/utils/crypto'
import { setLoginDomain, getLoginDomain } from '@/utils/common/cookie'
// import { removeQueryKeys } from '@/utils/utils'
import EditForm from '@/components/Edit/Form'
import { setSsoIdpIdInCookie, removeSsoIdpIdInCookie } from '@/utils/auth'
import CaptchaMixin from '@/mixins/captcha'

function normalizeLoginUsername (val) {
  if (!val || typeof val !== 'string') return ''
  // 兼容一些场景把用户名拼成 "id/<id>/<username>" 或 "<id>/<username>"
  const v = val.trim()
  if (v.startsWith('id/')) {
    const rest = v.slice(3)
    const segs = rest.split('/').filter(Boolean)
    return segs[segs.length - 1] || ''
  }
  const segs = v.split('/').filter(Boolean)
  if (segs.length >= 2) return segs[segs.length - 1]
  return v
}

export default {
  name: 'LoginChallenge',
  components: {
    EditForm,
  },
  mixins: [CaptchaMixin],
  props: {
    placeholder: Object,
    formDataMapper: Function,
    formRules: {
      type: Object,
      default: () => ({}),
    },
    hiddenDomainSelect: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    const routeUsername = normalizeLoginUsername(this.$route.query.username)
    return {
      placeholderOpts: {
        username: this.$t('auth.username.placeholder'),
        password: this.$t('auth.password.placeholder'),
        captcha: this.$t('auth.captcha.placeholder'),
        domain: this.$t('auth.domain.placeholder'),
        region: this.$t('auth.region.placeholder'),
        ...this.placeholder,
      },
      fd: {
        username: routeUsername,
        password: '',
        captcha: '',
        domain: undefined,
        region: undefined,
      },
      rules: R.mergeDeepWith(R.concat, {
        username: [
          { required: true, message: this.$t('auth.username.validate') },
        ],
        password: [
          { required: true, message: this.$t('auth.password.validate') },
        ],
        captcha: [
          { required: true, min: 4, max: 4, message: this.$t('auth.captcha.validate'), trigger: 'change' },
          { validator: this.validateCaptcha, trigger: 'submit' },
        ],
        domain: [
          { required: true, message: this.$t('auth.domain.validate') },
        ],
        region: [
          { required: true, message: this.$t('auth.region.validate') },
        ],
      }, this.formRules),
      showDomainSelect: false,
      captchaLoading: false,
      captchaImg: '',
      submiting: false,
      showUsernameInput: !routeUsername,
      showSetDomainPopover: false,
      loginDomain: '',
      domainInputRules: [
        { required: false, message: `${this.$t('common.placeholder')} ${this.$t('common.login_domain')}` },
      ],
      passwordReadonly: true,
      inputType: 'text',
    }
  },
  computed: {
    ...mapState('auth', {
      regions: state => state.regions,
      loggedUsers: state => state.loggedUsers,
    }),
    isForgetLoginUser () {
      return this.regions.is_forget_login_user
    },
    idps () {
      return this.regions.idps || []
    },
    showRegionSelect () {
      return this.regions.regions.length > 1
    },
    showCaptchaInput () {
      return this.regions.captcha === true
    },
    showDomainChooser () {
      return !this.regions.return_full_domains
    },
    firstNameWord () {
      const username = normalizeLoginUsername(this.$route.query.username)
      const word = (this.$route.query.displayname || username || '').split('')[0]
      return word && word.toUpperCase()
    },
    hasLoggedUsers () {
      const data = Object.entries(this.loggedUsers)
      return data.length > 0 && !this.isForgetLoginUser
    },
    displayUserName () {
      const user = this.fd.username
      const domain = this.fd.domain ? this.fd.domain : this.loginDomain
      if (user === domain) {
        return user
      } else {
        return `${user} - ${domain}`
      }
    },
  },
  watch: {
    showCaptchaInput: {
      handler (val) {
        if (val === true) {
          this.fetchCaptcha()
        }
      },
      immediate: true,
    },
  },
  created () {
    if (this.$route.query.domain) {
      this.loginDomain = this.$route.query.domain
    } else if (getLoginDomain()) {
      this.loginDomain = getLoginDomain()
    }
    if (this.$route.query.fd_domain) {
      this.fd.domain = this.$route.query.fd_domain
    }
  },
  methods: {
    // 获取验证码图片
    async fetchCaptcha () {
      this.captchaLoading = true
      try {
        const response = await this.$http('/v1/auth/captcha', {
          responseType: 'arraybuffer',
          params: {
            epochstr: +new Date(),
          },
        })
        const contentType = response?.headers?.['content-type'] || 'image/png'
        if (!String(contentType).startsWith('image/')) {
          try {
            const text = new TextDecoder('utf-8').decode(new Uint8Array(response.data))
            // eslint-disable-next-line no-console
            console.error('[captcha] invalid content-type:', contentType, text.slice(0, 200))
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[captcha] invalid content-type:', contentType)
          }
          this.captchaImg = ''
          return
        }
        const bytes = new Uint8Array(response.data)
        const blob = new Blob([bytes], { type: contentType })
        this.captchaImg = URL.createObjectURL(blob)
        this.fd.captcha = ''
        this.initCaptchaTimer && this.initCaptchaTimer()
      } catch (error) {
        throw error
      } finally {
        this.captchaLoading = false
      }
    },
    // 校验验证码
    async validateCaptcha (rule, value, callback) {
      try {
        const response = await this.$http.post('/v1/auth/captcha', { captcha: value })
        if (response.data.vali) {
          return callback()
        }
        return callback(this.$t('auth.captcha.validate.fial'))
      } catch (error) {
        callback(this.$t('auth.captcha.validate.fial'))
        this.fetchCaptcha()
        throw error
      }
    },
    // 表单校验失败（含并发校验导致的 outOfDate）
    handleLoginFailed (errorInfo) {
      // 校验过程中 model 变更会得到 outOfDate 且无字段错误，重试一次提交
      if (errorInfo && errorInfo.outOfDate && !(errorInfo.errorFields && errorInfo.errorFields.length)) {
        this.$nextTick(() => {
          const form = this.$refs.form
          if (form && typeof form.validate === 'function') {
            form.validate().then(() => this.handleLogin()).catch(() => {
              this.submiting = false
            })
          } else {
            this.submiting = false
          }
        })
        return
      }
      this.submiting = false
    },
    // 点击登录事件（由 a-form @finish 触发，此时已通过校验）
    async handleLogin () {
      this.submiting = true
      try {
        // ------------ 拼接请求所需数据 start ------------
        const data = {}
        // 检查parent是否要处理表单数据
        const fd = this.formDataMapper ? this.formDataMapper({ ...this.fd }) : { ...this.fd }
        data.username = fd.username
        data.password = Base64.encode(fd.password)
        if (this.regions.encrypt_passwd) {
          data.password = aesEncrypt(fd.password)
        }
        // 与原逻辑保持一致：只有在有值时才传 captcha，由前端校验 + 后端共同兜底
        if (fd.captcha) data.captcha = fd.captcha
        if (fd.region) {
          data.region = fd.region
          this.$store.commit('SET_REGION', data.region)
        }
        if (fd.domain) data.domain = fd.domain
        if (!data.domain && this.loginDomain) {
          data.domain = this.loginDomain
        }
        // ------------ 拼接请求所需数据 end ------------
        await this.$store.commit('auth/SET_LOGIN_FORM_DATA', data)
        await this.$store.dispatch('auth/login', data)
        await this.$emit('after-login')
        await this.$store.dispatch('auth/onAfterLogin')
        // ---- save login domain ---- //
        if (this.loginDomain && this.showDomainChooser) {
          setLoginDomain(this.loginDomain)
        }
        removeSsoIdpIdInCookie()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[login] handleLogin error', error)
        // 仅 domain 冲突（409）时清 domain 并切回用户名输入；普通失败保持已选账号态
        if (error.response && error.response.status === 409 && !this.hiddenDomainSelect) {
          if (this.fd.domain) {
            this.fd.domain = ''
          }
          this.showDomainSelect = true
          this.showUsernameInput = true
        }
        this.fetchCaptcha()
        this.submiting = false
        // 这里不再向外抛出错误，避免触发全局兜底 Dialog（BaseDialog 默认 header/body/footer）
      }
    },
    getIcon (idp) {
      const { template, driver } = idp
      const key = (template || driver).toLocaleLowerCase()
      const iconMap = import.meta.glob('/src/assets/images/idp-icons/round/*.png', { eager: true, import: 'default' })
      const path = `/src/assets/images/idp-icons/round/${key}.png`
      return iconMap[path] || ''
    },
    handleClickIdp (idpItem) {
      if (this.loginDomain && this.showDomainChooser) {
        setLoginDomain(this.loginDomain)
      }
      const { origin, search } = window.location
      const { id } = idpItem
      setSsoIdpIdInCookie(id)
      window.location.href = `${origin}/api/v1/auth/sso/redirect/${id}${search || ''}`
    },
    submitLoginDomain (value) {
      this.showSetDomainPopover = false
      this.changeDomain(value.input)
    },
    changeDomain (domain) {
      const params = { ...this.$route.query }
      if (domain) {
        params.domain = domain
      } else {
        delete params.domain
      }
      this.loginDomain = domain
      this.$store.dispatch('auth/getRegions', params)
      // 保留当前登录页路径（账号输入/选择账号/手机号），避免乱跳
      this.$router.replace({ path: this.$route.path, query: params })
    },
    inputFocus (item) {
      this.passwordReadonly = false
      this.inputType = 'password'
    },
    inputBlur (item) {
      this.passwordReadonly = true
    },
  },
}
</script>

<style lang="less" scoped>
.captcha-suffix {
  height: 28px;
  width: 98px;
  > img {
    width: 100%;
  }
}
.captcha-form-item {
  :deep(.ant-input-affix-wrapper .ant-input-suffix) {
    padding-right: 0px !important;
  }
}

/* a-input-password 的小眼睛：确保可 hover/可点击（避免被样式覆盖导致 pointer-events 失效） */
:deep(.ant-input-affix-wrapper .ant-input-password-icon) {
  cursor: pointer !important;
  pointer-events: auto !important;
}
:deep(.ant-input-affix-wrapper .ant-input-suffix) {
  pointer-events: auto !important;
}
:deep(.ant-input-affix-wrapper .ant-input-password-icon:hover) {
  color: rgba(0, 0, 0, 0.65) !important;
}
.selected-user-wrap {
  height: 32px;
}
.selected-user-content {
  align-items: center;
  border: 1px solid #d9d9d9;
  color: #3c4043;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: .25px;
  max-width: 100%;
  border-radius: 16px;
  padding: 5px 7px 5px 5px;
  .selected-user-name {
    direction: ltr;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &:hover {
    background: rgba(60,64,67,0.039);
  }
}
.name-icon {
  color: #fff;
  height: 22px;
  width: 22px;
  text-align: center;
  line-height: 22px;
  border-radius: 50%;
  background-color: var(--ant-color-primary, #1890ff);
  font-size: 12px;
}
.login-domain-title {
  color: #999;
  > div {
    width: 100%;
    height: 1px;
    margin-bottom: 50px;
  }
}
.login-link {
  line-height: 23px;
}

.login-extra-actions {
  margin-top: 12px;
}

.login-chooser-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  height: auto;
  padding: 6px 10px;
  margin: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
  transition: color 0.15s ease, background-color 0.15s ease;

  :deep(.oc-icon),
  :deep(svg) {
    font-size: 14px;
    width: 1em;
    height: 1em;
  }

  &:hover {
    color: #111827 !important;
    background: #f3f4f6;
  }
}

/* 去掉浏览器自动填充的浅蓝/淡黄底色 */
:deep(input.ant-input:-webkit-autofill),
:deep(input.ant-input:-webkit-autofill:hover),
:deep(input.ant-input:-webkit-autofill:focus),
:deep(input.ant-input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: rgba(0, 0, 0, 0.88) !important;
  caret-color: rgba(0, 0, 0, 0.88);
  transition: background-color 99999s ease-out 0s;
}
</style>
