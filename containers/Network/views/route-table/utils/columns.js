export const getVpcTableColumn = (vm) => {
  return {
    field: 'vpc',
    title: 'VPC',
    minWidth: 120,
    showOverflow: 'ellipsis',
    slots: {
      default: ({ row }, h) => {
        return [
          h('side-page-trigger', { props: { name: 'VpcSidePage', id: row.vpc_id, vm } }, row.vpc),
        ]
      },
    },
  }
}
