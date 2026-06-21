export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/records/index',
    'pages/scan/index',
    'pages/mine/index',
    'pages/create-order/index',
    'pages/checkin/index',
    'pages/exception/index',
    'pages/exception-list/index',
    'pages/record-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E88E5',
    navigationBarTitleText: '低温箱周转追踪',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E88E5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/records/index',
        text: '周转记录'
      },
      {
        pagePath: 'pages/scan/index',
        text: '扫码'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
