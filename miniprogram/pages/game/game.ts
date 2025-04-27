// game.ts
// 球的类型定义
interface Ball {
  x: number;
  y: number;
  color: string;
}

// 网格单元格类型定义
interface GridCell {
  color: string;
}

Page({
  data: {
    // 游戏相关数据
    grid: [] as GridCell[][],         // 游戏网格
    selectedBall: { x: -1, y: -1 },   // 当前选中的球
    score: 0,                         // 当前分数
    nextBalls: [] as string[],        // 下一轮将出现的球
    ballColors: [                     // 球的颜色列表
      '#FF5252', // 红
      '#4A90E2', // 蓝
      '#4CAF50', // 绿
      '#FFC107', // 黄
      '#9C27B0'  // 紫
    ],
    availableColors: [] as string[],  // 当前可用的颜色
    gridSize: 15                      // 网格大小
  },

  onLoad() {
    this.initGame();
  },

  // 初始化游戏
  initGame() {
    // 创建空网格
    const grid: GridCell[][] = [];
    for (let i = 0; i < this.data.gridSize; i++) {
      const row: GridCell[] = [];
      for (let j = 0; j < this.data.gridSize; j++) {
        row.push({ color: '' });
      }
      grid.push(row);
    }

    // 初始化可用颜色（开始只有3种）
    const availableColors: string[] = this.data.ballColors.slice(0, 3);

    // 随机生成初始的5个球
    const initialBalls = this.generateRandomBalls(5, grid, availableColors);
    
    // 添加初始的球到网格
    initialBalls.forEach(ball => {
      grid[ball.x][ball.y] = { color: ball.color };
    });

    // 生成下一轮将出现的3个球
    const nextBalls = this.generateNextBalls(availableColors);

    this.setData({
      grid,
      score: 0,
      availableColors,
      nextBalls
    });
  },

  // 生成随机球
  generateRandomBalls(count: number, grid: GridCell[][], colors: string[]): Ball[] {
    const balls: Ball[] = [];
    const emptyPositions: {x: number, y: number}[] = [];

    // 找出所有空位置
    for (let i = 0; i < this.data.gridSize; i++) {
      for (let j = 0; j < this.data.gridSize; j++) {
        if (!grid[i][j].color) {
          emptyPositions.push({ x: i, y: j });
        }
      }
    }

    // 随机选择位置和颜色
    for (let i = 0; i < count && emptyPositions.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * emptyPositions.length);
      const position = emptyPositions.splice(randomIndex, 1)[0];
      const colorIndex = Math.floor(Math.random() * colors.length);

      balls.push({
        x: position.x,
        y: position.y,
        color: colors[colorIndex]
      });
    }

    return balls;
  },

  // 生成下一轮的球颜色
  generateNextBalls(colors: string[]): string[] {
    const nextBalls: string[] = [];
    for (let i = 0; i < 3; i++) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      nextBalls.push(colors[colorIndex]);
    }
    return nextBalls;
  },

  // 处理单元格点击
  onCellTap(e: any) {
    const { row, col } = e.currentTarget.dataset;
    const { grid, selectedBall } = this.data;
    
    // 如果点击的是已有球
    if (grid[row][col].color) {
      // 选中该球
      this.setData({
        selectedBall: { x: row, y: col }
      });
      return;
    }

    // 如果已选中球，且点击的是空位置
    if (selectedBall.x !== -1 && selectedBall.y !== -1) {
      // 检查是否可以移动
      if (this.canMove(selectedBall.x, selectedBall.y, row, col)) {
        // 移动球
        this.moveBall(selectedBall.x, selectedBall.y, row, col);
      }
    }
  },

  // 检查是否可以移动
  canMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    // 这里应该实现路径查找算法
    // 简单实现：只能移动相邻的空位
    const isAdjacent = (Math.abs(fromX - toX) === 1 && fromY === toY) || 
                      (Math.abs(fromY - toY) === 1 && fromX === toX);
    
    // 简化版，假设可以移动
    return true;
  },

  // 移动球
  moveBall(fromX: number, fromY: number, toX: number, toY: number) {
    const { grid, nextBalls, availableColors } = this.data;
    
    // 移动球
    grid[toX][toY] = { color: grid[fromX][fromY].color };
    grid[fromX][fromY] = { color: '' };
    
    // 取消选中
    const selectedBall = { x: -1, y: -1 };
    
    this.setData({ grid, selectedBall });
    
    // 检查是否有连珠
    const lines = this.checkLines(toX, toY);
    
    if (lines.length > 0) {
      // 有连珠，消除并得分
      this.eliminateLines(lines);
    } else {
      // 没有连珠，添加新球
      this.addNewBalls();
    }
  },

  // 检查连珠
  checkLines(x: number, y: number): Array<{x: number, y: number}[]> {
    const { grid, gridSize } = this.data;
    const color = grid[x][y].color;
    const lines: Array<{x: number, y: number}[]> = [];
    
    // 检查八个方向
    const directions = [
      [0, 1],   // 右
      [1, 1],   // 右下
      [1, 0],   // 下
      [1, -1],  // 左下
      [0, -1],  // 左
      [-1, -1], // 左上
      [-1, 0],  // 上
      [-1, 1]   // 右上
    ];
    
    // 对每个方向检查
    for (let i = 0; i < 4; i++) {
      const dir1 = directions[i];
      const dir2 = directions[i+4];
      
      let count = 1; // 包括中心点
      const line: {x: number, y: number}[] = [{ x, y }];
      
      // 向dir1方向检查
      for (let step = 1; step < 5; step++) {
        const nx = x + dir1[0] * step;
        const ny = y + dir1[1] * step;
        
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && 
            grid[nx][ny].color === color) {
          count++;
          line.push({ x: nx, y: ny });
        } else {
          break;
        }
      }
      
      // 向dir2方向检查
      for (let step = 1; step < 5; step++) {
        const nx = x + dir2[0] * step;
        const ny = y + dir2[1] * step;
        
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && 
            grid[nx][ny].color === color) {
          count++;
          line.push({ x: nx, y: ny });
        } else {
          break;
        }
      }
      
      // 如果有5个或以上相同颜色的球连成一线
      if (count >= 5) {
        lines.push(line);
      }
    }
    
    return lines;
  },

  // 消除连珠
  eliminateLines(lines: Array<{x: number, y: number}[]>) {
    const { grid, score } = this.data;
    let newScore = score;
    const eliminated = new Set<string>();
    
    // 计算得分并标记要消除的球
    lines.forEach(line => {
      const lineScore = 10 + (line.length - 5) * 2;
      newScore += lineScore;
      
      line.forEach(ball => {
        eliminated.add(`${ball.x},${ball.y}`);
      });
    });
    
    // 消除球
    for (let i = 0; i < this.data.gridSize; i++) {
      for (let j = 0; j < this.data.gridSize; j++) {
        if (eliminated.has(`${i},${j}`)) {
          grid[i][j] = { color: '' };
        }
      }
    }
    
    // 更新分数
    this.setData({ grid, score: newScore });
    
    // 检查是否需要增加颜色难度
    this.checkDifficulty();
    
    // 检查游戏是否结束
    if (this.isGameOver()) {
      this.gameOver();
    }
  },

  // 添加新球
  addNewBalls() {
    const { grid, nextBalls, availableColors } = this.data;
    
    // 添加下一轮预告的球
    const newBalls = this.generateRandomBalls(3, grid, availableColors);
    
    if (newBalls.length < 3) {
      // 空间不足，游戏结束
      this.gameOver();
      return;
    }
    
    // 添加新球到网格
    newBalls.forEach((ball, index) => {
      grid[ball.x][ball.y] = { color: nextBalls[index] };
    });
    
    // 生成下一轮将出现的球
    const nextNewBalls = this.generateNextBalls(availableColors);
    
    this.setData({
      grid,
      nextBalls: nextNewBalls
    });
    
    // 检查是否有连珠
    let hasLines = false;
    newBalls.forEach(ball => {
      const lines = this.checkLines(ball.x, ball.y);
      if (lines.length > 0) {
        this.eliminateLines(lines);
        hasLines = true;
      }
    });
    
    // 如果没有连珠，检查游戏是否结束
    if (!hasLines && this.isGameOver()) {
      this.gameOver();
    }
  },

  // 检查难度
  checkDifficulty() {
    const { score, ballColors, availableColors } = this.data;
    
    // 100分后增加第四种颜色
    if (score >= 100 && availableColors.length === 3) {
      availableColors.push(ballColors[3]);
      this.setData({ availableColors });
    }
    
    // 300分后增加第五种颜色
    if (score >= 300 && availableColors.length === 4) {
      availableColors.push(ballColors[4]);
      this.setData({ availableColors });
    }
  },

  // 检查游戏是否结束
  isGameOver() {
    const { grid, gridSize } = this.data;
    let emptyCount = 0;
    
    // 统计空格数量
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i][j].color) {
          emptyCount++;
        }
      }
    }
    
    // 空格数少于3个，游戏结束
    return emptyCount < 3;
  },

  // 游戏结束
  gameOver() {
    const { score } = this.data;
    
    // 跳转到游戏结束页面
    wx.navigateTo({
      url: `../gameover/gameover?score=${score}`
    });
  },

  // 暂停游戏
  pauseGame() {
    wx.showModal({
      title: '游戏暂停',
      content: '游戏已暂停',
      confirmText: '继续游戏',
      showCancel: false
    });
  },

  // 返回主菜单
  backToMenu() {
    wx.showModal({
      title: '确认返回',
      content: '确定要返回主菜单吗？当前游戏进度将会丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  }
}) 