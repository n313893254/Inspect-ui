export default async function({
  isHMR, store
}) {
  // If middleware is called from hot module replacement, ignore it
  if (isHMR) {
    return
  }

  await store.dispatch('i18n/init')
}
