export default {
  customValidationRules() {
    return [
      {
        path:           'name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
    ]
  },
}