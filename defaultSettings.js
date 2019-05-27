module.exports = {
  navTheme: 'dark', // theme for nav menu
  primaryColor: '#1890FF', // primary color of ant design
  layout: 'sidemenu', // nav menu position: sidemenu or topmenu
  contentWidth: 'Fluid', // layout of content: Fluid or Fixed, only works when layout is topmenu
  fixedHeader: false, // sticky header
  autoHideHeader: false, // auto hide header
  fixSiderbar: false, // sticky siderbar
  menu: {
    disableLocal: false,
  },
  menuData: [
    {
      key: 'executions',
      icon: 'thunderbolt',
      name: 'Executions',
      path: '/Executions',
    },
    {
      key: 'lists',
      icon: 'unordered-list',
      name: 'Lists',
      path: '/Lists',
    },
    {
      key: 'resources',
      icon: 'database',
      name: 'Resources',
      path: '/Resources',
    },
    {
      key: 'imports',
      icon: 'upload',
      name: 'Imports',
      path: '/Imports',
    },
  ],
  title: 'Challenge',
  maxElementsResult: 100,
  maxElementsPage: 50,
  formItemLayout: {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 6 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 18 },
    },
  },
  pwa: false,
  // Your custom iconfont Symbol script Url
  // eg：//at.alicdn.com/t/font_1039637_btcrd5co4w.js
  // Usage: https://github.com/ant-design/ant-design-pro/pull/3517
  iconfontUrl: '',
};
