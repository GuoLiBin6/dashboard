<template>
  <div class="history-wrap" :class="{ default: !showDelete, 'is-editing': showDelete }">
    <div class="list">
      <template v-for="item of dataSource" :key="item[0]">
        <button
          type="button"
          class="item"
          :disabled="showDelete"
          @click="handleSelect(item)">
          <div class="item-main">
            <div class="l1info">
              {{ item[1]['name'] }}
              <span class="scope">{{ $te(`authChooser.${item[1]['scope']}`) ? $t(`authChooser.${item[1]['scope']}`) : '-' }}</span>
              <span v-if="item[1]['isSSO']" class="sso">SSO</span>
            </div>
            <div class="l2info">
              {{ $t('dictionary.domain') }} {{ item[1]['domain']['name'] }}
              <span class="split">/</span>
              {{ $t('dictionary.project') }} {{ item[1].projectName }}
            </div>
          </div>
          <a-button
            v-if="showDelete"
            type="text"
            danger
            size="small"
            class="delete-btn"
            @click.stop="handleDelete(item[0])">
            <template #icon><icon type="delete" /></template>
          </a-button>
        </button>
      </template>
    </div>
    <div class="actions">
      <template v-if="!showDelete">
        <button
          type="button"
          class="action-link"
          @click="$router.replace({ path: '/auth/login', query: { rf: $route.query.rf, domain: $route.query.domain } })">
          <icon type="user" />
          {{ $t('auth.outher.history.user.btn') }}
        </button>
        <button type="button" class="action-link" @click="showDelete = true">
          <icon type="user-del" />
          {{ $t('auth.remove.history.user.btn') }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="action-link primary" @click="showDelete = false">
          {{ $t('common.ok') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import * as R from 'ramda'
import { mapState } from 'vuex'
import { setSsoIdpIdInCookie } from '@/utils/auth'
export default {
  name: 'LoginChooser',
  props: {
    getUsernameQuery: Function,
  },
  data () {
    return {
      showDelete: false,
      deleteKeys: [],
    }
  },
  computed: {
    ...mapState('auth', {
      loggedUsers: state => state.loggedUsers,
    }),
    dataSource () {
      const data = Object.entries(this.loggedUsers)
      if (data.length === 0) {
        this.$router.replace({
          path: '/auth/login',
          query: {
            rf: this.$route.query.rf,
          },
        })
        return data
      }
      return R.sort((a, b) => {
        return b[1].update_time - a[1].update_time
      }, data)
    },
  },
  watch: {
    loggedUsers (val) {
      const data = Object.entries(this.loggedUsers)
      if (data.length === 0) {
        this.$router.replace({
          path: '/auth/login',
          query: {
            rf: this.$route.query.rf,
          },
        })
      }
    },
  },
  methods: {
    handleDelete (key) {
      this.$store.commit('auth/UPDATE_LOGGED_USERS', {
        key,
        action: 'delete',
      })
    },
    handleSelect (item) {
      if (this.showDelete) return
      if (item[1] && item[1].isSSO && item[1].idpId) {
        const { origin, search } = window.location
        setSsoIdpIdInCookie(item[1].idpId)
        window.location.href = `${origin}/api/v1/auth/sso/redirect/${item[1].idpId}${search || ''}`
        return
      }
      const username = this.getUsernameQuery ? this.getUsernameQuery(item) : item[1].name
      this.$router.replace({
        path: '/auth/login',
        query: {
          ...this.$route.query,
          username,
          fd_domain: item[1].domain.name,
          displayname: item[1].displayname,
        },
      })
    },
  },
}
</script>

<style lang="less" scoped>
.history-wrap {
  display: flex;
  flex-direction: column;
  height: 290px;
  min-height: 290px;
  // 与 login-content-wrap 内标题/表单左缘对齐，勿用负边距外扩
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

.list {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 0;
}

.item {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 12px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:disabled {
    cursor: default;
  }

  & + .item {
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }
}

.item-main {
  flex: 1;
  min-width: 0;
}

.l1info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: #111827;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.scope {
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
}

.sso {
  flex-shrink: 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.l2info {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.split {
  margin: 0 6px;
  opacity: 0.5;
}

.delete-btn {
  flex-shrink: 0;
  margin-left: 8px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  margin: 8px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  min-height: 32px;
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
  box-sizing: border-box;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;

  :deep(.oc-icon),
  :deep(svg) {
    font-size: 14px;
    width: 1em;
    height: 1em;
  }

  &:hover {
    color: #111827;
    background: #f3f4f6;
  }

  &.primary {
    margin-left: auto;
    color: #2563eb;
    font-weight: 500;

    &:hover {
      color: #1d4ed8;
      background: #f3f4f6;
    }
  }
}

.history-wrap.default .item:hover {
  background: #f3f4f6;
}

.history-wrap.default .item:active {
  transform: scale(0.99);
}

.history-wrap.is-editing .item {
  background: #fff;
}
</style>
