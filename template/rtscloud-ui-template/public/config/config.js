//全局配置
const rtscloud_config = {
  login : {
    //登录页组件，对应src下的组件路径
    index : 'page/login/index'
    // index : 'page/sso/index'
  },
  sso : {
    //单点登录配置

    //单点登录认证中心地址
    OriginalSSOServer : 'http://192.168.1.17:8080/original-sso-server',

    //认证中心中配置的子系统编号
    appCode : 'rtscloud',

    //认证中心中分配的子系统秘钥
    appKey : 'f8a23b96cefb40778680a383f3c513ae'
  }
}
