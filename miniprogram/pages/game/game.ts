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

// 路径节点类型
interface PathNode {
  x: number;
  y: number;
  path: Array<{x: number, y: number}>;
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
    availableColors: [] as string[],   // 当前可用的颜色
    gridSize: 10,                      // 网格大小
    showMovingAnimation: false,        // 是否显示移动动画
    movingBall: { fromX: -1, fromY: -1, toX: -1, toY: -1, color: '' }, // 正在移动的球
    pathBlocked: false,                // 是否无法移动到目标位置
    pathBlockedPos: { x: -1, y: -1 },  // 无法移动到的位置
    showPathIndicators: false,         // 是否显示路径指示点
    pathIndicators: [] as Array<{x: number, y: number}> // 路径指示点
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
      nextBalls,
      selectedBall: { x: -1, y: -1 },
      pathBlocked: false,
      pathBlockedPos: { x: -1, y: -1 },
      showPathIndicators: false,
      pathIndicators: []
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
    // 如果正在播放移动动画，不响应点击
    if (this.data.showMovingAnimation) return;

    const { row, col } = e.currentTarget.dataset;
    const { grid, selectedBall } = this.data;
    
    // 清除路径阻塞提示
    if (this.data.pathBlocked) {
      this.setData({
        pathBlocked: false,
        pathBlockedPos: { x: -1, y: -1 }
      });
    }
    
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
      const pathResult = this.canMove(selectedBall.x, selectedBall.y, row, col);
      if (pathResult) {
        // 移动球
        this.moveBall(selectedBall.x, selectedBall.y, row, col, pathResult as Array<{x: number, y: number}>);
      } else {
        // 无法移动，显示提示
        this.setData({
          pathBlocked: true,
          pathBlockedPos: { x: row, y: col }
        });
        
        // 2秒后自动清除提示
        setTimeout(() => {
          this.setData({
            pathBlocked: false,
            pathBlockedPos: { x: -1, y: -1 }
          });
        }, 2000);
      }
    }
  },

  // 检查是否可以移动
  canMove(fromX: number, fromY: number, toX: number, toY: number): boolean | Array<{x: number, y: number}> {
    const { grid, gridSize } = this.data;
    
    // 如果目标位置有球，不能移动
    if (grid[toX][toY].color) return false;
    
    // 广度优先搜索寻找路径
    const queue: PathNode[] = [{x: fromX, y: fromY, path: [{x: fromX, y: fromY}]}];
    const visited = new Set<string>();
    visited.add(`${fromX},${fromY}`);
    
    // 四个方向: 上、右、下、左
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const { x, y, path } = current;
      
      // 找到目标位置
      if (x === toX && y === toY) {
        return path; // 返回找到的路径
      }
      
      // 检查四个方向
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        // 检查是否在网格范围内
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          const key = `${nx},${ny}`;
          
          // 如果未访问过且该位置没有球
          if (!visited.has(key) && !grid[nx][ny].color) {
            visited.add(key);
            queue.push({
              x: nx, 
              y: ny, 
              path: [...path, {x: nx, y: ny}]
            });
          }
        }
      }
    }
    
    // 没找到路径
    return false;
  },

  // 移动球
  moveBall(fromX: number, fromY: number, toX: number, toY: number, path: Array<{x: number, y: number}>) {
    const { grid } = this.data;
    const ballColor = grid[fromX][fromY].color;
    
    // 清空原位置
    grid[fromX][fromY] = { color: '' };
    
    // 提取中间路径点（除起点外的所有点）
    // 注意：path的第一个点是起点，最后一个点是终点
    const pathPoints = path.slice(1);
    
    // 显示路径指示点
    this.setData({
      showPathIndicators: true,
      pathIndicators: pathPoints.slice(0, -1) // 不显示终点作为路径点
    });
    
    // 计算动画时间
    const totalSteps = pathPoints.length;
    const stepDuration = 500 / totalSteps; // 总时长0.5秒
    
    // 设置起始位置（第一个路径点）
    this.setData({
      showMovingAnimation: true,
      movingBall: {
        fromX: path[0].x + 6.2, // 起点坐标，向下增加7个网格距离
        fromY: path[0].y + 0.9, // 起点坐标，向右增加1个网格距离
        toX: path[0].x + 6.2,
        toY: path[0].y + 0.9,
        color: ballColor
      }
    });
    
    // 执行路径动画
    let currentStepIndex = 0;
    
    const moveToNextPoint = () => {
      if (currentStepIndex < pathPoints.length) {
        // 设置移动动画到下一个点
        this.setData({
          movingBall: {
            fromX: pathPoints[currentStepIndex].x + 6.2, // 向下偏移7格
            fromY: pathPoints[currentStepIndex].y + 0.9, // 向右偏移1格
            toX: pathPoints[currentStepIndex].x + 6.2,
            toY: pathPoints[currentStepIndex].y + 0.9,
            color: ballColor
          }
        });
        
        currentStepIndex++;
        
        // 继续下一步移动
        if (currentStepIndex < pathPoints.length) {
          setTimeout(moveToNextPoint, stepDuration);
        } else {
          // 最后一步完成后结束动画
          setTimeout(() => {
            // 清除路径指示点和动画
            this.setData({
              showPathIndicators: false,
              pathIndicators: [],
              showMovingAnimation: false
            });
            
            // 添加球到目标位置
            grid[toX][toY] = { color: ballColor };
            
            // 取消选中
            this.setData({ 
              grid, 
              selectedBall: { x: -1, y: -1 }
            });
            
            // 检查是否有连珠
            const lines = this.checkLines(toX, toY);
            
            if (lines.length > 0) {
              // 有连珠，消除并得分
              this.eliminateLines(lines);
            } else {
              // 没有连珠，添加新球
              this.addNewBalls();
            }
          }, 100);
        }
      }
    };
    
    // 开始动画序列
    setTimeout(moveToNextPoint, 50);
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