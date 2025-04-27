Page({
  data: {
    score: 0
  },
  
  onLoad(options: any) {
    if (options.score) {
      this.setData({
        score: parseInt(options.score)
      });
    }
    
    // 保存最高分
    this.saveHighScore();
  },
  
  // 保存最高分
  saveHighScore() {
    const { score } = this.data;
    const highScore = wx.getStorageSync('highScore') || 0;
    
    if (score > highScore) {
      wx.setStorageSync('highScore', score);
    }
  },
  
  // 重新开始游戏
  restartGame() {
    wx.redirectTo({
      url: '../game/game'
    });
  },
  
  // 返回主菜单
  backToHome() {
    wx.reLaunch({
      url: '../index/index'
    });
  },
  
  // 分享成绩
  shareScore() {
    // 分享功能会由小程序框架自动处理
  },
  
  // 分享设置
  onShareAppMessage() {
    const { score } = this.data;
    return {
      title: `我在五球连珠游戏中获得了${score}分，快来挑战吧！`,
      path: '/pages/index/index'
    };
  }
}) 