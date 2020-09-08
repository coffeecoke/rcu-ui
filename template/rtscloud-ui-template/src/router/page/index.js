import Layout from '@/page/index/'

const routes = [{
  path: '/wel',
  component: Layout,
  redirect: '/wel/index',
  children: [{
    path: 'index',
    name: '首页',
    meta: {
      isAuth: false
    },
    component: () =>
      import(/* webpackChunkName: "views" */ '@/page/wel')
  }]
},
  {
    path: '/lock',
    name: '锁屏页',
    component: () =>
      import(/* webpackChunkName: "page" */ '@/page/lock/index'),
    meta: {
      keepAlive: true,
      isTab: false,
      isAuth: false
    }
  },
  {
    path: '/404',
    component: () =>
      import(/* webpackChunkName: "page" */ '@/components/error-page/404'),
    name: '404',
    meta: {
      keepAlive: true,
      isTab: false,
      isAuth: true
    }

  },
  {
    path: '/403',
    component: () =>
      import(/* webpackChunkName: "page" */ '@/components/error-page/403'),
    name: '403',
    meta: {
      keepAlive: true,
      isTab: false,
      isAuth: false
    }
  },
  {
    path: '/500',
    component: () =>
      import(/* webpackChunkName: "page" */ '@/components/error-page/500'),
    name: '500',
    meta: {
      keepAlive: true,
      isTab: false,
      isAuth: false
    }
  },
  {
    path: '/',
    name: '主页',
    redirect: '/wel'
  },
  {
    path: '/myiframe',
    component: Layout,
    redirect: '/myiframe',
    children: [{
      path: ':routerPath',
      name: 'iframe',
      component: () =>
        import(/* webpackChunkName: "page" */ '@/components/iframe/main'),
      props: true
    }]
  },
  {
    path: '*',
    redirect: '/404'
  },
  {
    path: '/authredirect',
    name: '授权页',
    component: () =>
      import(/* webpackChunkName: "page" */ '@/page/login/authredirect'),
    meta: {
      keepAlive: true,
      isTab: false,
      isAuth: false
    }
  }]

//使用import无法动态加载组件
//参考avue-router.js中的formatRoutes方法，使用require动态加载组件
//组件路径从配置项中获取，需要添加.vue后缀，@/不能写在配置项中
const loginRoute = {
  path: '/login',
  name: '登录页',
  component: (resolve) => require([`@/${rtscloud_config.login.index}.vue`], resolve),
  meta: {
    keepAlive: true,
    isTab: false,
    isAuth: false
  }
}
routes.push(loginRoute)


export default routes
