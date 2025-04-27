// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化逻辑
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 初始化游戏数据
    if (!wx.getStorageSync('highScore')) {
      wx.setStorageSync('highScore', 0);
    }

    // 登录
    wx.login({
      success: res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
  },
})