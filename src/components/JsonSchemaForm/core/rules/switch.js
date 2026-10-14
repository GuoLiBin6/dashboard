export default function (def, schema) {
  const type = schema.type

  if (type === 'boolean') {
    def.type = 'a-switch'
    def.field = [
      {
        initialValue: schema.default,
        rules: [
          {
            validator: this.handleFieldValidate,
          },
        ],
        valuePropName: 'checked',
      },
    ]
  }
}
