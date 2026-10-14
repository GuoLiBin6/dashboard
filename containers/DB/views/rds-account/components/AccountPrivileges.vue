<template>
  <div>
    <a-transfer
      :dataSource="dbList"
      :titles="[$t('db.text_193'), $t('db.text_194')]"
      :listStyle="{
        width: '332px',
        height: '332px',
        }"
      :render="renderItem"
      :targetKeys="targetKeys"
      @change="handleChange" />
  </div>
</template>
<script>
import { h } from 'vue'
import { RDS_ACCOUNT_PRIVILEGES } from '@DB/constants'
export default {
  inject: ['form'],
  props: {
    privileges: {
      type: Array,
    },
    rdsItem: {
      type: Object,
      default: () => {
        return {}
      },
    },
  },
  data () {
    return {
      mockData: [],
      targetKeys: [],
      dbList: [],
      dbIdItemObj: {},
      propsPrivileges: {},
      privilegeById: {},
    }
  },
  created () {
    if (!this.form.fd) {
      this.form.fd = {}
    }
    if (this.form.fd.privileges === undefined) {
      this.$set(this.form.fd, 'privileges', [])
    }
    this.fetchQueryDBList()
    if (this.privileges && this.privileges.length > 0) {
      this.privileges.forEach(item => {
        this.propsPrivileges[item.dbinstancedatabase_id] = item
      })
    }
  },
  methods: {
    async fetchQueryDBList () {
      try {
        const params = {
          scope: this.$store.getters.scope,
          limit: 0,
          dbinstance: this.rdsItem.id,
        }
        const manager = new this.$Manager('dbinstancedatabases', 'v2')
        const { status, data } = await manager.list({ params })
        if (status === 200 && data.total > 0) {
          const retList = data.data
          this.dbList = retList
            .filter(({ status, name }) => status === 'running')
            .map(item => {
              item.title = item.name
              this.dbIdItemObj[item.id] = item
              if (this.propsPrivileges[item.id]) {
                item = {
                  ...item,
                  ...this.propsPrivileges[item.id],
                }
                this.targetKeys.push(item.id)
              }
              item.key = item.id
              return item
            })
          this.setPrivileges()
        }
      } catch (err) {
        throw err
      }
    },
    renderItemRadions (item) {
      const { id } = item
      const initialValue = (item.privileges === 'rw' || item.privileges === 'r') ? item.privileges : 'rw'
      if (this.privilegeById[id] === undefined) {
        this.$set(this.privilegeById, id, initialValue)
      }
      const renderRadios = ['rw', 'r'].map(v => {
        return h('a-radio', { value: v }, { default: () => RDS_ACCOUNT_PRIVILEGES[v] })
      })
      const radioGroupVNode = h('a-radio-group', {
        value: this.privilegeById[id],
        onChange: (e) => {
          this.$set(this.privilegeById, id, e.target.value)
          this.$nextTick(() => {
            this.setPrivileges()
          })
        },
      }, { default: () => renderRadios })
      return h('div', { class: 'radios' }, [radioGroupVNode])
    },
    renderItem (item) {
      const customLabel = h('span', { class: 'custom-item' }, [
        h('b', {}, item.title),
        ' ',
        this.renderItemRadions(item),
      ])

      return {
        label: customLabel,
        value: item.title,
      }
    },
    setPrivileges () {
      this.form.fd.privileges = this.targetKeys.map(id => {
        return {
          database: this.dbIdItemObj[id].name,
          privilege: this.privilegeById[id] || 'rw',
        }
      })
    },
    handleChange (targetKeys) {
      this.targetKeys = targetKeys
      this.setPrivileges()
    },
  },
}
</script>
<style lang="less">
.ant-transfer {
  .radios {
    display: none;
  }
  .ant-transfer-list:last-child {
    .radios {
      display: block;
      margin-bottom: 0
    }
  }
}
.ant-transfer-list-content-item {
  display: flex;
  line-height: 30px;
  > span {
    flex: 1;
  }
  .ant-form-item-control{
      line-height: 28px
  }
}
.custom-item {
  width: 100%;
  display: flex;
  > b {
    flex: 1;
  }
}
</style>
