<script>
export default {
  middleware({ redirect } ) {
    return redirect({ 
      name:   'product-resource',
      params: {
        product:  'inspect',
        resource: 'report',
      } 
    })
  }
}
</script>