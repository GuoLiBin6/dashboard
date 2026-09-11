<template>
  <div class="h-100 w-100 auth-layout">
    <!-- auth layout header -->
    <div class="w-100 position-fixed border-bottom primary-color-border header">
      <div class="container">
        <div class="auth-header d-flex align-items-center">
          <div class="auth-header-left flex-shrink-0 flex-grow-0">
            <img v-if="safeLoginLogo" class="auth-header-logo" :src="safeLoginLogo" />
          </div>
          <!-- 多语言切换按钮 -->
          <div v-if="!languages.length || languages.length > 1" class="auth-header-right flex-fill d-flex justify-content-end">
            <a-dropdown :trigger="['click']" overlayClassName="auth-lang-dropdown">
              <div class="auth-lang-trigger oc-pointer">
                <icon type="global" class="auth-lang-trigger-icon" />
                <span class="ml-2">{{ languageText }}</span>
              </div>
              <template #overlay>
                <a-menu @click="handleChangeLanguage" class="auth-lang-menu">
                  <a-menu-item v-if="!languages.length || languages.includes('zh-CN')" key="zh-CN">
                    <div class="lang-item">
                      <span class="lang-item__label">简体中文</span>
                      <icon v-show="language === 'zh-CN'" type="check-circle" class="lang-item__check" />
                    </div>
                  </a-menu-item>
                  <a-menu-item v-if="!languages.length || languages.includes('en')" key="en">
                    <div class="lang-item">
                      <span class="lang-item__label">English</span>
                      <icon v-show="language === 'en'" type="check-circle" class="lang-item__check" />
                    </div>
                  </a-menu-item>
                  <a-menu-item v-if="!languages.length || languages.includes('ja-JP')" key="ja-JP">
                    <div class="lang-item">
                      <span class="lang-item__label">日本語</span>
                      <icon v-show="language === 'ja-JP'" type="check-circle" class="lang-item__check" />
                    </div>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </div>
    <div class="w-100 position-fixed auth-top-alert">
      <div class="container">
        <top-alert />
      </div>
    </div>
    <!-- auth layout content -->
    <div class="w-100 h-100 content d-flex overflow-auto">
      <div class="container" style="margin: auto">
        <div class="container-wrap d-flex align-items-center justify-content-center w-100">
          <template v-if="!statusLoaded">
            <div>{{ $t('common.text00111') }}</div>
          </template>
          <template v-else-if="ticketLogging">
            <div>{{ $t('auth.logging') }}</div>
          </template>
          <template v-else>
            <router-view class="content-wrap" />
          </template>
        </div>
      </div>
    </div>
    <!-- auth layout footer -->
    <div class="position-fixed w-100 text-center text-color-help footer">
      <p class="text-color-help m-0 p-0">{{ copyright }}</p>
      <template v-if="!isChrome">
        <p class="mini-text m-0 p-0 pt-2" style="color: rgba(255, 255, 255, .2);">{{ $t('common.text00110') }}</p>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import storage from '@/utils/storage'
import { isChrome } from '@/utils/utils'
import { setLanguage } from '@/utils/common/cookie'
import TopAlert from '@/sections/TopAlert'
export default {
  name: 'AuthLayout',
  components: {
    TopAlert,
  },
  data () {
    return {
      // 兼容 Vite/开发环境：默认视为已加载，直接展示登录页
      statusLoaded: true,
      ticketLogging: false,
      languages: [],
    }
  },
  computed: {
    ...mapGetters(['copyright', 'loginLogo', 'setting']),
    safeLoginLogo () {
      if (!this.loginLogo) return ''
      if (this.loginLogo === 'undefined') return ''
      return this.loginLogo
    },
    isChrome () {
      return isChrome()
    },
    language () {
      return this.setting.language
    },
    languageText () {
      if (this.language === 'zh-CN') {
        return '简体中文'
      } else if (this.language === 'ja-JP') {
        return '日本語'
      } else {
        return 'English'
      }
    },
  },
  async created () {
    // if (this.$route.query.ticket) {
    //   this.ticketLogin()
    // } else {
    //   this.checkRegistersStatus()
    // }
    try {
      if (this.$route.query.result === 'success') {
        await this.$store.dispatch('auth/onAfterLogin')
      } else if (this.$appConfig.isPrivate) {
        // 私有部署下，注册状态异常时只打印错误，不打断登录页展示
        try {
          await this.checkRegistersStatus()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[auth] checkRegistersStatus failed', e)
        }
      }
    } finally {
      this.statusLoaded = true
      this.initSupportLanguages()
    }
  },
  methods: {
    // 检查是否已注册
    async checkRegistersStatus () {
      try {
        await this.$store.dispatch('auth/getRegistersStatus')
        if (!this.$store.state.auth.registersStatus) {
          this.$router.replace('/auth/adminregister')
        } else {
          if (this.$route.path === '/auth/adminregister') {
            this.$router.replace('/auth')
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.statusLoaded = true
      }
    },
    // ticket login
    // async ticketLogin () {
    //   this.ticketLogging = true
    //   try {
    //     const response = await this.$store.dispatch('auth/login', {
    //       cas_ticket: this.$route.query.ticket,
    //     })
    //     await this.$store.dispatch('auth/onAfterLogin', response)
    //   } catch (error) {
    //     this.$message.error(this.$t('auth.login.fast.login.fail'))
    //     this.ticketLogging = false
    //     throw error
    //   }
    // },
    handleChangeLanguage (e) {
      setLanguage(e.key)
      window.location.reload()
    },
    initSupportLanguages () {
      const supportLanguages = storage.get('__oc_support_languages__', [])
      this.languages = supportLanguages
    },
  },
}
</script>

<style lang="less" scoped>
.auth-layout {
  background-color: #fff;
}
.header {
  height: 70px;
  top: 0;
  left: 0;
  z-index: 3;
  background-color: #fff;
  .auth-header {
    padding: 15px 0;
  }
  .auth-header-logo {
    height: 39px;
  }
}
.auth-top-alert {
  top: 70px;
  left: 0;
  z-index: 3;
}
.content {
  padding: 70px 0;
  box-sizing: border-box;
  background-color: #fff;
  .container-wrap {
    background-image: url(/img/bg.eee05042.png);
    background-repeat: no-repeat;
    background-position: center center;
  }
}
.footer {
  height: 70px;
  line-height: 70px;
  bottom: 0;
  left: 0;
  background-color: #fff;
}

.lang-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 96px;
}

.lang-item__label {
  flex: 0 1 auto;
  min-width: 0;
}

.lang-item__check {
  flex-shrink: 0;
  margin-left: 8px;
  font-size: 14px;
  color: #52c41a;
  line-height: 1;
}
.auth-lang-trigger {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
  color: #6b7280;
  transition: color 0.15s ease, background-color 0.15s ease;

  &:hover {
    color: #111827;
    background: #f3f4f6;
  }
}
.auth-lang-trigger-icon {
  font-size: 14px;
  vertical-align: -0.125em;
}
</style>

<style lang="less">
.auth-lang-dropdown {
  .ant-dropdown-menu {
    min-width: 118px !important;
  }
}
</style>
