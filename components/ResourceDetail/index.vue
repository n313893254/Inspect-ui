<script>
import Masthead from '@/components/ResourceDetail/Masthead'

export default {
  components: {
    Masthead,
  },
  props: {
    header: {
      type:    String,
      default: '',
    }
  }
}
</script>

<template>
  <div>
    <Masthead 
      :header="header"
    />
  </div>
</template>