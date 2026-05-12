// 测试数据生成脚本
// 在浏览器控制台运行此脚本，或者直接在 index.html 中引入

// 模拟用户数据
const mockUsers = [
    {
        username: '张三',
        gender: 'male',
        color: 'blue',
        password: '123456',
        createdAt: new Date().toISOString()
    },
    {
        username: '李四',
        gender: 'female',
        color: 'pink',
        password: '123456',
        createdAt: new Date().toISOString()
    }
];

// 生成随机日期（最近30天内）
function getRandomDate(daysAgo = 30) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString().split('T')[0];
}

// 生成随机运动项目成绩
function getRandomSportResult(sportKey) {
    switch(sportKey) {
        case '50m':
            return 7 + Math.random() * 5; // 7~12秒
        case 'situp':
            return Math.floor(20 + Math.random() * 40); // 20~60个
        case 'pullup':
            return Math.floor(1 + Math.random() * 20); // 1~20个
        case 'jump':
            return Math.floor(60 + Math.random() * 120); // 60~180个
        case 'stretch':
            return -5 + Math.random() * 30; // -5~25厘米
        default:
            return Math.floor(Math.random() * 100);
    }
}

// 生成模拟记录
function generateMockRecords() {
    const mockRecords = [];
    const sports = ['50m', 'situp', 'jump', 'stretch'];
    const maleSports = ['50m', 'pullup', 'jump', 'stretch'];
    
    // 为张三生成记录（男生）
    const zhangsanSports = maleSports;
    for (let i = 0; i < 25; i++) {
        const date = getRandomDate(30);
        const sport = zhangsanSports[Math.floor(Math.random() * zhangsanSports.length)];
        const value = getRandomSportResult(sport);
        const result = calculateScore('male', sport, value);
        
        mockRecords.push({
            id: Date.now() + Math.random(),
            username: '张三',
            type: 'daily',
            date: date,
            item: sport,
            itemName: SCORING_STANDARDS.male[sport].name,
            value: formatValue(sport, value),
            rawValue: value,
            score: result.score,
            level: result.level,
            duration: Math.floor(30 + Math.random() * 60),
            note: '',
            createdAt: new Date().toISOString()
        });
    }
    
    // 为李四生成记录（女生）
    const lisiSports = sports;
    for (let i = 0; i < 20; i++) {
        const date = getRandomDate(30);
        const sport = lisiSports[Math.floor(Math.random() * lisiSports.length)];
        const value = getRandomSportResult(sport);
        const result = calculateScore('female', sport, value);
        
        mockRecords.push({
            id: Date.now() + Math.random(),
            username: '李四',
            type: 'daily',
            date: date,
            item: sport,
            itemName: SCORING_STANDARDS.female[sport].name,
            value: formatValue(sport, value),
            rawValue: value,
            score: result.score,
            level: result.level,
            duration: Math.floor(30 + Math.random() * 60),
            note: '',
            createdAt: new Date().toISOString()
        });
    }
    
    return mockRecords;
}

// 加载测试数据
function loadTestData() {
    // 保存用户数据
    localStorage.setItem('sports_users', JSON.stringify(mockUsers));
    
    // 生成并保存记录数据
    const mockRecords = generateMockRecords();
    localStorage.setItem('sports_records', JSON.stringify(mockRecords));
    
    // 设置考试日期
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 30);
    localStorage.setItem('sports_exam_date', examDate.toISOString().split('T')[0]);
    
    console.log('✅ 测试数据已加载！');
    console.log('👤 测试用户：');
    console.log('   - 用户名：张三，密码：123456');
    console.log('   - 用户名：李四，密码：123456');
    console.log('📊 已生成 ' + mockRecords.length + ' 条训练记录');
    
    // 刷新页面以应用数据
    location.reload();
}

// 清除测试数据
function clearTestData() {
    localStorage.removeItem('sports_users');
    localStorage.removeItem('sports_records');
    localStorage.removeItem('sports_exam_date');
    console.log('🧹 测试数据已清除！');
    location.reload();
}

console.log('🎯 测试数据工具已就绪！');
console.log('可用命令：');
console.log('  loadTestData()  - 加载测试数据');
console.log('  clearTestData() - 清除测试数据');
