Page({
  data: {
    difficulty: 'easy',
    colorPreview: [] as string[],
    ballColors: [
      '#FF5252', // 红
      '#4A90E2', // 蓝
      '#4CAF50', // 绿
      '#FFC107', // 黄
      '#9C27B0'  // 紫
    ]
  },

  onLoad() {
    // 加载保存的难度设置
    const difficulty = wx.getStorageSync('gameDifficulty') || 'easy';
    
    // 初始化颜色预览
    let colorCount = 3;
    if (difficulty === 'medium') {
      colorCount = 4;
    } else if (difficulty === 'hard') {
      colorCount = 5;
    }
    const colorPreview = this.data.ballColors.slice(0, colorCount);
    
    this.setData({ 
      difficulty,
      colorPreview
    });
  },

  // 选择难度
  selectDifficulty(e: any) {
    const level = e.currentTarget.dataset.level;
    this.setData({ difficulty: level });
    this.updateColorPreview(level);
  },

  // 更新颜色预览
  updateColorPreview(difficulty: string) {
    let colorCount = 3; // 默认是简单模式，3种颜色
    
    if (difficulty === 'medium') {
      colorCount = 4;
    } else if (difficulty === 'hard') {
      colorCount = 5;
    }
    
    const colorPreview = this.data.ballColors.slice(0, colorCount);
    this.setData({ colorPreview });
  },

  // 保存设置
  saveSettings() {
    const { difficulty } = this.data;
    
    // 保存设置到本地
    wx.setStorageSync('gameDifficulty', difficulty);
    
    // 显示保存成功提示
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟返回，让用户看到保存成功的提示
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 取消
  cancel() {
    wx.navigateBack();
  }
}) 