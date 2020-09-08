<template>
  <div/>
</template>

<script>
  import { getQueryString } from '@/util/util'
  import * as CryptoJS from 'crypto-js'
  import { mapGetters } from 'vuex'
  import request from '@/router/axios'

  export default {
    name: 'SSO',
    computed: {
      ...mapGetters(['tagWel'])
    },
    data(){
      return {
        loginForm: {},
        configs: rtscloud_config.sso
      }
    },
    watch: {
      $route: function(to, from){

      }
    },
    created(){
      //获取配置项
      const ssoConfig = this.configs;

      if(!ssoConfig || !ssoConfig.appKey || !ssoConfig.appCode || !ssoConfig.OriginalSSOServer){
        alert('未找到配置项，请检查单点登录相关配置');
        return;
      }

      const OriginalSSOServer = ssoConfig.OriginalSSOServer//SSO服务端地址
      const appCode = ssoConfig.appCode//子系统编号
      const appKey = ssoConfig.appKey//子系统秘钥
      const keyHex = CryptoJS.enc.Utf8.parse(appKey)

      const url = window.location.href.replace('#/login', '')
      //自定义state，用于与SSO服务端进行校验
      const ori_state = 'PORTAL'

      //查看url中是否包含授权码
      //包含授权码，直接进行登录认证
      //不包含授权码，先从SSO服务端获取授权码
      const code = getQueryString(url, 'code')
      if(!code){

        //登录，请求授权码
        var redirectUrl = window.location.origin + '/#/login'
        //回调地址加密
        redirectUrl = CryptoJS.DES.encrypt(redirectUrl, keyHex, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        //回调地址Base64编码
        redirectUrl = CryptoJS.enc.Base64.stringify(redirectUrl.ciphertext);
        redirectUrl = encodeURIComponent(redirectUrl)
        const url = `${OriginalSSOServer}/resoftCtrl/auth?response_type=code&client_id=${appCode}&redirect_uri=${redirectUrl}&state=${ori_state}`
        window.location.href = url

      }else{
        //接受授权码，获取token，完成登录

        //解密state进行校验
        var state = getQueryString(url, 'state')
        state = CryptoJS.DES.decrypt(decodeURIComponent(state), keyHex, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        state = state.toString(CryptoJS.enc.Utf8)

        if(state == ori_state){
          //用授权码进行登录认证
          this.loginForm.state = state
          this.loginForm.code = code

          const loading = this.$loading({
            lock: true,
            text: `登录中,请稍后。。。`,
            spinner: 'el-icon-loading'
          })

          const commit = this.$store.commit;
          request({
            url: '/auth/original/sso/login',
            headers: {
              isToken: false,
              'TENANT-ID': '1',
              'Authorization': 'Basic cGlnOnBpZw=='
            },
            method: 'post',
            params: {code: code, grant_type: 'sso'}
          }).then(response => {
            const data = response.data
            commit('SET_ACCESS_TOKEN', data.access_token)
            commit('SET_REFRESH_TOKEN', data.refresh_token)
            commit('SET_EXPIRES_IN', data.expires_in)
            commit('SET_USER_INFO', data.user_info)
            commit('SET_PERMISSIONS', data.user_info.authorities || [])
            commit('CLEAR_LOCK')
            loading.close()
            this.$router.push({ path: this.tagWel.value })
          }).catch(error => {
            loading.close()
          })

        }else{

          this.$confirm("认证中心返回的state不匹配", "错误", {
            showCancelButton: false,
            confirmButtonText: "确定",
            type: "warning"
          }).then(() => {
            this.$router.push({ path: "/login" });
          });

        }

      }
    }
  }
</script>
