<template>
  <div>
    <a-transfer
      :dataSource="dbList"
      :titles="[$t('db.text_229'), $t('db.text_230')]"
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
    }
  },
  created () {
    this.fetchQueryAccountList()
    this.form.fc.getFieldDecorator('accounts', { preserve: true })
  },
  methods: {
    async fetchQueryAccountList () {
      try {
        const params = {
          scope: this.$store.getters.scope,
          limit: 0,
          dbinstance: this.rdsItem.id,
        }
        const manager = new this.$Manager('dbinstanceaccounts', 'v2')
        const { status, data } = await manager.list({ params })
        if (status === 200 && data.total > 0) {
          const retList = data.data
          this.dbList = retList
            .filter(({ status, name }) => status === 'available' && name !== 'root')
            .map(item => {
              item.title = item.name
              item.key = item.id
              this.dbIdItemObj[item.id] = item
              return item
            })
        }
      } catch (err) {
        throw err
      }
    },
    renderItemRadions (item) {
      const { id } = item
      const { getFieldDecorator } = this.form.fc
      const renderRadios = ['rw', 'r'].map(v => {
        return h('a-radio', { value: v }, { default: () => RDS_ACCOUNT_PRIVILEGES[v] })
      })
      const _handleChange = () => {
        this.$nextTick(() => {
          this.setPrivileges()
        })
      }
      const radioGroupVNode = getFieldDecorator(id, { initialValue: item.privileges || 'rw' })(
        h('a-radio-group', { onChange: _handleChange }, { default: () => renderRadios }),
      )
      return h('a-form-item', { class: 'radios' }, { default: () => [radioGroupVNode] })
    },
    renderItem (item) {
      const customLabel = h('span', { class: 'custom-item' }, [
        h('b', {}, item.title),
        ' ',
        this.renderItemRadions(item),
      ])

      return {
        label: customLabel, // for displayed item
        value: item.title, // for title and filter matching
      }
    },
    setPrivileges () {
      const values = this.form.fc.getFieldsValue()
      this.form.fc.setFieldsValue({
        accounts: this.targetKeys.map(id => {
          return {
            account: this.dbIdItemObj[id].name,
            privilege: values[id],
          }
        }),
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
