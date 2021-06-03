<script>
import LabeledInput from '@/components/form/LabeledInput'
import AsyncButton from '@/components/AsyncButton'
import AESEncrypt from '@/utils/crypto'

export default {
  name:       'Login',
  layout:     'unauthenticated',
  components: {
    LabeledInput,
    AsyncButton,
  },

  data() {
    return {
      username: '',
      password: '',
    }
  },

  methods: {
    async loginLocal(buttonCb) {
      try {
        this.err = null
        console.log(AESEncrypt(this.password), 'AESEncrypt(this.password)')
        await this.$store.dispatch('auth/login', {
          provider: 'local',
          body:     {
            username: this.username,
            password: AESEncrypt(this.password),
          }
        })

        buttonCb(true)

        window.location.href = window.location.origin
      } catch (err) {
        this.err = err
        buttonCb(false)
      }
    },
  }
}
</script>

<template>
  <main class="login">
    <div class="row mb-20">
      <div class="col span-6">
        <h1 class="text-center">
          Redis Portal
        </h1>
        <form class="mt-50">
          <div class="span-6 offset-3">
            <div class="mb-20">
              <LabeledInput
                ref="username"
                v-model="username"
                label="用户名"
                autocomplete="username"
              />
            </div>
            <div class="">
              <LabeledInput
                ref="password"
                v-model="password"
                type="password"
                label="密码"
                autocomplete="password"
              />
            </div>
          </div>
          <div class="mt-20">
            <div class="col span-12 text-center">
              <AsyncButton
                type="submit"
                action-label="登陆"
                waiting-label="正在登陆..."
                success-label="登陆成功"
                error-label="错误"
                @click="loginLocal"
              />
            </div>
          </div>
        </form>
      </div>
      <div class="col span-6 landscape">
        <!-- <img src="~/assets/images/login-landscape.svg" alt="landscape" /> -->
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  .login {
    overflow: hidden;

    .row {
      align-items: center;
    }

    .landscape {
      background-image: url('~assets/images/pl/login-landscape.svg');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      height: 100vh;
    }
  }
</style>