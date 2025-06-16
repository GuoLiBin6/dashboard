<template>
  <div>
    <a-icon type="sync" spin v-if="loading" />
    <a-row v-else-if="cards.length > 0" type="flex" style="margin-left: 50px;">
      <a-col v-for="card in cards" :key="card.title" :span="8" style="width: 400px" class="mt-4">
        <account-card :card="card" />
      </a-col>
    </a-row>
    <a-row v-else type="flex" style="justify-content:center">
      <data-empty :description="emptyContent" />
    </a-row>
  </div>
</template>

<script>
import AccountCard from './AccountCard'

export default {
  name: 'AccountCards',
  components: { AccountCard },
  props: {
    data: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
  },
  data () {
    return {
      emptyContent: {
        default: this.$t('common.notData'),
      },
    }
  },
  computed: {
    cards () {
      return this.data.children
    },
  },
  watch: {
  },
  created () {
  },
  methods: {
  },
}
</script>
