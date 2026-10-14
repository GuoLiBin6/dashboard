export default function (def, schema) {
  def.type = 'j-checkbox'
  def.field = [
    {
      initialValue: schema.default,
      rules: [
        {
          validator: this.handleFieldValidate,
        },
      ],
    },
  ]
}
