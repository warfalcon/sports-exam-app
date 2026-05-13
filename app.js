// 全局状态
let currentUser = null;
let users = JSON.parse(localStorage.getItem('sports_users')) || [];
let records = JSON.parse(localStorage.getItem('sports_records')) || [];
let examDate = localStorage.getItem('sports_exam_date') || '';
let trendChart = null;
let historyChart = null;

// 默认头像列表（10个）
const AVATARS = [
    '🐵', '🐶', '🐱', '🐼', '🦊',
    '🐨', '🐯', '🦁', '🐮', '🐷'
];

// 获取头像显示名称
function getAvatarName(avatar) {
    const names = {
        '🐵': '小猴', '🐶': '小狗', '🐱': '小猫',
        '🐼': '熊猫', '🦊': '狐狸', '🐨': '考拉',
        '🐯': '老虎', '🦁': '狮子', '🐮': '小牛',
        '🐷': '小猪'
    };
    return names[avatar] || '默认';
}

// Toast提示功能
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 自定义确认对话框
function showConfirm(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-title">${title}</div>
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel">取消</button>
                    <button class="confirm-btn confirm">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const cancelBtn = overlay.querySelector('.cancel');
        const confirmBtn = overlay.querySelector('.confirm');
        
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
    });
}

// 主题颜色配置
const THEME_COLORS = {
    blue: { primary: '#3498db', secondary: '#2980b9', light: '#ebf5fb' },
    green: { primary: '#27ae60', secondary: '#1e8449', light: '#e9f7ef' },
    purple: { primary: '#9b59b6', secondary: '#8e44ad', light: '#f5eef8' },
    orange: { primary: '#e67e22', secondary: '#d35400', light: '#fdf2e9' },
    pink: { primary: '#e91e63', secondary: '#c2185b', light: '#fce4ec' }
};

// 初始化
window.onload = function() {
    console.log('App loading...');
    try {
        initAuthPage();
        setDefaultDates();
        console.log('Initializing standards page...');
        initStandardsPage();
        console.log('Standards page initialized');
        initSelectOptions();
        updateCountdown();
        setInterval(updateCountdown, 60000); // 每分钟更新倒计时
        
        // 尝试自动登录
        autoLogin();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

// 自动登录 - 页面刷新后恢复登录状态
function autoLogin() {
    // 从 localStorage 获取保存的用户名
    const savedUsername = localStorage.getItem('sports_current_user');
    if (savedUsername) {
        // 查找用户
        const user = users.find(u => u.username === savedUsername);
        if (user) {
            currentUser = user;
            document.getElementById('current-user').textContent = `欢迎，${user.username}`;
            
            // 应用主题颜色
            applyTheme(user.color);
            
            // 切换到主页面
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('main-page').classList.add('active');
            
            // 确保只在概览页面显示顶部标题栏
            const header = document.getElementById('main-header');
            const mainContent = document.querySelector('.main-content');
            if (header && mainContent) {
                header.style.display = 'flex';
                mainContent.style.paddingTop = '20px';
            }
            
            // 初始化主页面
            initDashboard();
            initHistoryPage();
            
            console.log('Auto login successful:', user.username);
        }
    }
}

// 设置默认日期
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const dailyDate = document.getElementById('daily-date');
    if (dailyDate) {
        dailyDate.value = today;
    }
}

// 初始化认证页面
function initAuthPage() {
    // 恢复保存的用户名
    const savedUsername = localStorage.getItem('sports_login_username');
    if (savedUsername) {
        document.getElementById('login-username').value = savedUsername;
    }
}

// 显示认证标签页
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

// 注册
function register() {
    const username = document.getElementById('reg-username').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const color = document.getElementById('reg-color').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!username || !gender || !color || !password) {
        showToast('请填写所有必填项', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }
    
    if (users.find(u => u.username === username)) {
        showToast('用户名已存在', 'warning');
        return;
    }
    
    const user = {
        username,
        gender,
        color,
        password,
        avatar: AVATARS[0], // 默认使用第一个头像
        createdAt: new Date().toISOString()
    };
    
    users.push(user);
    localStorage.setItem('sports_users', JSON.stringify(users));
    
    showToast('注册成功！', 'success');
    updateUserSelect();
    showAuthTab('login');
}

// 登录
function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showToast('请输入用户名和密码', 'warning');
        return;
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        showToast('用户名或密码错误', 'error');
        return;
    }
    
    // 确保用户有头像字段（兼容旧用户）
    if (!user.avatar) {
        user.avatar = AVATARS[0];
        const userIndex = users.findIndex(u => u.username === user.username);
        if (userIndex >= 0) {
            users[userIndex] = user;
            localStorage.setItem('sports_users', JSON.stringify(users));
        }
    }
    
    currentUser = user;
    document.getElementById('current-user').textContent = `欢迎，${user.username}`;
    
    // 保存当前用户到 localStorage，用于自动登录
    localStorage.setItem('sports_current_user', user.username);
    // 保存登录用户名，用于记住用户名
    localStorage.setItem('sports_login_username', user.username);
    
    // 应用主题颜色
    applyTheme(user.color);
    
    // 切换到主页面
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    
    // 初始化主页面
    initDashboard();
    initHistoryPage();
}

// 应用主题颜色
function applyTheme(colorKey) {
    const colors = THEME_COLORS[colorKey] || THEME_COLORS.blue;
    document.documentElement.style.setProperty('--primary-color', colors.primary);
    document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    document.documentElement.style.setProperty('--light-color', colors.light);
}

// 退出登录
function logout() {
    currentUser = null;
    // 清除保存的用户名，防止自动登录
    localStorage.removeItem('sports_current_user');
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showToast('已退出登录', 'info');
}

// 显示页面
function showPage(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const currentBtn = document.querySelector(`[onclick="showPage('${page}')"]`);
    if (currentBtn) currentBtn.classList.add('active');
    
    document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + '-page').classList.add('active');
    
    // 只在概览页面显示顶部标题栏
    const header = document.getElementById('main-header');
    const mainContent = document.querySelector('.main-content');
    if (header && mainContent) {
        if (page === 'dashboard') {
            header.style.display = 'flex';
            mainContent.style.paddingTop = '20px';
        } else {
            header.style.display = 'none';
            mainContent.style.paddingTop = '0';
        }
    }
    
    if (page === 'dashboard') {
        initDashboard();
    } else if (page === 'history') {
        initHistoryPage();
    } else if (page === 'profile') {
        initProfilePage();
    }
}

function showProfile() {
    showPage('profile');
}

function updateProfilePage() {
    if (currentUser) {
        document.getElementById('profile-avatar').textContent = currentUser.avatar || '👤';
        document.getElementById('profile-username').textContent = `用户名：${currentUser.username}`;
        document.getElementById('profile-gender').textContent = `性别：${currentUser.gender === 'male' ? '男' : '女'}`;
    }
}

function initProfilePage() {
    updateProfilePage();
}

// 初始化概览页面
function initDashboard() {
    if (!currentUser) return;
    
    const userRecords = records.filter(r => r.username === currentUser.username);
    const dailyRecords = userRecords.filter(r => r.type === 'daily');
    const examRecords = userRecords.filter(r => r.type === 'exam');
    
    // 本月打卡天数
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthDates = new Set(dailyRecords.filter(r => r.date.startsWith(currentMonth)).map(r => r.date));
    const monthCheckins = monthDates.size;
    document.getElementById('month-checkins').textContent = `${monthCheckins} 天`;
    
    // 连续打卡天数
    const streak = calculateStreak(dailyRecords);
    document.getElementById('streak-days').textContent = `${streak} 天`;
    
    // 总训练次数
    document.getElementById('total-records').textContent = `${userRecords.length} 次`;
    
    // 更新倒计时
    updateCountdown();
    
    // 渲染趋势图
    renderTrendChart(userRecords);
    
    // 初始化项目成绩趋势图表选择器
    const chartSelect = document.getElementById('chart-sport');
    if (chartSelect) {
        chartSelect.innerHTML = '<option value="">选择项目查看趋势</option>';
        const allItems = getAllItems();
        allItems.forEach(item => {
            chartSelect.innerHTML += `<option value="${item.key}">${item.name}</option>`;
        });
    }
    
    // 渲染最近记录
    renderRecentRecords(userRecords);
}

// 计算连续打卡天数
function calculateStreak(dailyRecords) {
    if (dailyRecords.length === 0) return 0;
    
    const dates = [...new Set(dailyRecords.map(r => r.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // 检查今天或昨天是否有打卡
    if (dates[0] !== today && dates[0] !== yesterday) {
        return 0;
    }
    
    for (let i = 0; i < dates.length; i++) {
        if (i === 0) {
            streak = 1;
        } else {
            const prevDate = new Date(dates[i - 1]);
            const currDate = new Date(dates[i]);
            const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }
    }
    
    return streak;
}

// 更新倒计时
function updateCountdown() {
    const countdownEl = document.getElementById('countdown');
    const examCountdownEl = document.getElementById('exam-countdown');
    
    if (!examDate) {
        countdownEl.textContent = '';
        if (examCountdownEl) examCountdownEl.textContent = '未设置';
        return;
    }
    
    const exam = new Date(examDate);
    const now = new Date();
    const diff = exam - now;
    
    if (diff <= 0) {
        countdownEl.textContent = '考试已结束';
        if (examCountdownEl) examCountdownEl.textContent = '已结束';
        return;
    }
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    countdownEl.textContent = `⏰ 距离考试还有 ${days} 天`;
    if (examCountdownEl) examCountdownEl.textContent = `${days} 天`;
}

// 渲染趋势图
function renderTrendChart(userRecords) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    
    // 获取最近7天的数据
    const dates = [];
    const counts = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr.slice(5)); // 只显示月-日
        
        const dayRecords = userRecords.filter(r => r.date === dateStr);
        counts.push(dayRecords.length);
    }
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '每日训练次数',
                data: counts,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--light-color'),
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 渲染最近记录
function renderRecentRecords(userRecords) {
    const tbody = document.querySelector('#recent-table tbody');
    if (!tbody) return;
    
    const dailyRecords = userRecords.filter(r => r.type === 'daily');
    const recent = dailyRecords.slice(-5).reverse();
    
    tbody.innerHTML = recent.map(r => {
        return `
            <tr>
                <td>${r.date}</td>
                <td>${r.itemName || r.item}</td>
                <td>${r.value}</td>
                <td>${r.score}分</td>
            </tr>
        `;
    }).join('');
}

// 初始化选择选项
function initSelectOptions() {
    // 历史页面项目筛选
    const historySportSelect = document.getElementById('history-sport');
    if (historySportSelect) {
        historySportSelect.innerHTML = '<option value="all">全部项目</option>';
        const allItems = getAllItems();
        allItems.forEach(item => {
            historySportSelect.innerHTML += `<option value="${item.key}">${item.name}</option>`;
        });
    }
}

// 保存每日打卡记录
function saveDailyRecord() {
    if (!currentUser) return;
    
    const date = document.getElementById('daily-date').value;
    const note = document.getElementById('training-note').value;
    
    const checkedItems = document.querySelectorAll('.sport-item:checked');
    if (checkedItems.length === 0) {
        showToast('请至少选择一个训练项目', 'warning');
        return;
    }
    
    let savedCount = 0;
    
    checkedItems.forEach(checkbox => {
        const itemKey = checkbox.value;
        const inputDiv = document.getElementById(`input-${itemKey}`);
        let value = inputDiv ? inputDiv.querySelector('input').value : '';
        const standard = SCORING_STANDARDS[currentUser.gender][itemKey];
        
        if (!value) {
            showToast(`请输入${standard ? standard.name : itemKey}的成绩`, 'warning');
            return;
        }
        
        // 解析成绩
        let parsedValue;
        if (standard && (standard.format === 'time' || standard.format === 'time_decimal')) {
            parsedValue = parseTimeInput(value);
        } else {
            parsedValue = parseFloat(value);
        }
        
        if (parsedValue === null || isNaN(parsedValue)) {
            showToast(`请输入有效的${standard ? standard.name : itemKey}成绩`, 'error');
            return;
        }
        
        // 计算得分
        const result = calculateScore(currentUser.gender, itemKey, parsedValue);
        
        const record = {
            id: Date.now() + Math.random(),
            username: currentUser.username,
            type: 'daily',
            date,
            item: itemKey,
            itemName: standard ? standard.name : itemKey,
            value: formatValue(itemKey, parsedValue),
            rawValue: parsedValue,
            score: result.score,
            level: result.level,
            note,
            createdAt: new Date().toISOString()
        };
        
        records.push(record);
        savedCount++;
    });
    
    if (savedCount > 0) {
        localStorage.setItem('sports_records', JSON.stringify(records));
        showToast(`保存成功！已记录 ${savedCount} 项训练`, 'success');
        
        // 清空表单
        document.querySelectorAll('.sport-item').forEach(cb => {
            cb.checked = false;
        });
        document.getElementById('training-note').value = '';
        document.getElementById('sport-inputs').innerHTML = '';
        
        // 更新数据
        initDashboard();
    }
}

// 监听项目选择变化
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('sport-item')) {
        updateSportInputs();
    }
});

// 更新运动项目输入框
function updateSportInputs() {
    const container = document.getElementById('sport-inputs');
    if (!container) return;
    
    container.innerHTML = '';
    
    document.querySelectorAll('.sport-item:checked').forEach(checkbox => {
        const itemKey = checkbox.value;
        const standard = SCORING_STANDARDS[currentUser?.gender || 'female'][itemKey];
        
        const div = document.createElement('div');
        div.className = 'form-group sport-input-group';
        div.id = `input-${itemKey}`;
        div.innerHTML = `
            <label>${standard ? standard.name : itemKey}成绩 (${standard ? standard.unit : ''})</label>
            <input type="text" placeholder="${standard && (standard.format === 'time' || standard.format === 'time_decimal') ? '格式：3\'30 或 3:30' : '输入成绩'}">
        `;
        container.appendChild(div);
    });
}

// 初始化历史页面
function initHistoryPage() {
    if (!currentUser) return;
    
    const userRecords = records.filter(r => r.username === currentUser.username);
    renderHistoryTable(userRecords);
}

// 渲染历史表格
function renderHistoryTable(userRecords) {
    const tbody = document.querySelector('#history-table tbody');
    if (!tbody) return;
    
    const sportFilter = document.getElementById('history-sport')?.value || 'all';
    
    let filtered = userRecords.filter(r => r.type === 'daily');
    
    if (sportFilter !== 'all') {
        filtered = filtered.filter(r => r.item === sportFilter);
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 桌面端表格
    tbody.innerHTML = filtered.map(r => {
        return `
            <tr>
                <td>${r.date}</td>
                <td>${r.itemName || r.item}</td>
                <td>${r.value}</td>
                <td>${r.score}分</td>
                <td><button onclick="deleteRecord(${r.id})">删除</button></td>
            </tr>
        `;
    }).join('');
    
    // 移动端卡片列表
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = filtered.map(r => {
            return `
                <div class="history-card">
                    <div class="history-card-header">
                        <span class="history-card-date">${r.date}</span>
                    </div>
                    <div class="history-card-content">
                        <div class="history-card-item">
                            <div class="history-card-name">${r.itemName || r.item}</div>
                            <div class="history-card-value">${r.value}</div>
                        </div>
                        <div class="history-card-score">${r.score}分</div>
                    </div>
                    <button onclick="deleteRecord(${r.id})" style="margin-top: 10px; width: 100%; padding: 8px; background: var(--danger-color); color: white; border: none; border-radius: 6px; cursor: pointer;">删除</button>
                </div>
            `;
        }).join('');
    }
}

// 快速打卡功能
function showQuickCheckin() {
    document.getElementById('quick-checkin-modal').classList.remove('hidden');
}

function closeQuickCheckin() {
    document.getElementById('quick-checkin-modal').classList.add('hidden');
}

function quickCheckin(sportKey) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    closeQuickCheckin();
    showPage('record');
    
    // 自动选中对应的项目
    const checkbox = document.querySelector(`.sport-item[value="${sportKey}"]`);
    if (checkbox) {
        checkbox.checked = true;
        updateSportInputs();
        
        // 滚动到输入区域
        setTimeout(() => {
            const inputsDiv = document.getElementById('sport-inputs');
            if (inputsDiv) {
                inputsDiv.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}

// 更新运动项目输入框
function updateSportInputs() {
    const container = document.getElementById('sport-inputs');
    if (!container) return;
    
    container.innerHTML = '';
    
    document.querySelectorAll('.sport-item:checked').forEach(checkbox => {
        const itemKey = checkbox.value;
        const standard = SCORING_STANDARDS[currentUser?.gender || 'female'][itemKey];
        
        const div = document.createElement('div');
        div.className = 'form-group sport-input-group';
        div.id = `input-${itemKey}`;
        div.innerHTML = `
            <label>${standard ? standard.name : itemKey}成绩 (${standard ? standard.unit : ''})</label>
            <input type="text" class="mobile-input" placeholder="${standard && (standard.format === 'time' || standard.format === 'time_decimal') ? '格式：3\'30 或 3:30' : '输入成绩'}" inputmode="${standard && (standard.format === 'time' || standard.format === 'time_decimal') ? 'text' : 'decimal'}">
        `;
        container.appendChild(div);
    });
}

// 删除记录
async function deleteRecord(id) {
    const confirmed = await showConfirm('删除记录', '确定要删除这条记录吗？');
    if (!confirmed) return;
    
    records = records.filter(r => r.id !== id);
    localStorage.setItem('sports_records', JSON.stringify(records));
    
    showToast('记录已删除', 'success');
    initHistoryPage();
    initDashboard();
}

// 更新历史图表
function updateHistoryChart() {
    const sport = document.getElementById('chart-sport').value;
    if (!sport || !currentUser) return;
    
    const userRecords = records.filter(r => 
        r.username === currentUser.username && 
        r.type === 'daily' && 
        r.item === sport
    );
    
    if (userRecords.length === 0) {
        showToast('该项目暂无记录', 'info');
        return;
    }
    
    userRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;
    
    if (historyChart) {
        historyChart.destroy();
    }
    
    const labels = userRecords.map(r => r.date.slice(5));
    const values = userRecords.map(r => r.rawValue);
    
    // 获取项目信息用于标签
    const standard = SCORING_STANDARDS[currentUser.gender][sport] || 
                     SCORING_STANDARDS.female[sport] || 
                     SCORING_STANDARDS.male[sport];
    const label = standard ? standard.name + ' (' + standard.unit + ')' : '成绩';
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--light-color'),
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// 导出数据
function exportData() {
    if (!currentUser) return;
    
    const userRecords = records.filter(r => r.username === currentUser.username);
    
    if (userRecords.length === 0) {
        alert('暂无数据可导出');
        return;
    }
    
    // 构建CSV内容
    let csv = '日期,类型,项目,成绩,得分,备注\n';
    
    userRecords.forEach(r => {
        if (r.type === 'daily') {
            csv += `${r.date},日常训练,${r.itemName || r.item},${r.value},${r.score},${r.note || ''}\n`;
        } else {
            csv += `${r.date},模拟考试,综合,总分,${r.totalScore},必考:${r.runScore}分\n`;
        }
    });
    
    // 下载CSV文件
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `体育训练记录_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 初始化评分标准页面
function initStandardsPage() {
    console.log('Starting initStandardsPage');
    // 渲染女生标准
    console.log('Rendering female standards...');
    renderStandardTable('female', '800m', 'female-800m', 0);
    renderStandardTable('female', '50m', 'female-50m', 1);
    renderStandardTable('female', 'situp', 'female-situp', 2);
    renderStandardTable('female', 'jump', 'female-jump', 3);
    renderStandardTable('female', 'stretch', 'female-stretch', 4);
    
    // 渲染男生标准
    console.log('Rendering male standards...');
    renderStandardTable('male', '1000m', 'male-1000m', 0);
    renderStandardTable('male', '50m', 'male-50m', 1);
    renderStandardTable('male', 'pullup', 'male-pullup', 2);
    renderStandardTable('male', 'jump', 'male-jump', 3);
    renderStandardTable('male', 'stretch', 'male-stretch', 4);
    console.log('initStandardsPage complete');
}

// 显示标准标签页
function showStandardTab(gender) {
    document.querySelectorAll('.standards-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (gender === 'female') {
        document.getElementById('female-standards').classList.remove('hidden');
        document.getElementById('male-standards').classList.add('hidden');
    } else {
        document.getElementById('female-standards').classList.add('hidden');
        document.getElementById('male-standards').classList.remove('hidden');
    }
}

// 显示设置
let selectedAvatar = null;

function renderAvatarSelector() {
    const container = document.getElementById('avatar-selector');
    container.innerHTML = '';
    
    AVATARS.forEach(avatar => {
        const div = document.createElement('div');
        div.className = `avatar-option ${avatar === (selectedAvatar || currentUser?.avatar) ? 'selected' : ''}`;
        div.innerHTML = `
            <span class="avatar-icon">${avatar}</span>
            <span class="avatar-name">${getAvatarName(avatar)}</span>
        `;
        div.onclick = () => selectAvatar(avatar);
        container.appendChild(div);
    });
}

function selectAvatar(avatar) {
    selectedAvatar = avatar;
    renderAvatarSelector();
}

function showSettings() {
    selectedAvatar = currentUser?.avatar || AVATARS[0];
    renderAvatarSelector();
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('exam-date-setting').value = examDate;
}

// 关闭设置
function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// 保存设置
function saveSettings() {
    examDate = document.getElementById('exam-date-setting').value;
    localStorage.setItem('sports_exam_date', examDate);
    
    // 修改头像
    if (selectedAvatar && currentUser && selectedAvatar !== currentUser.avatar) {
        // 更新用户列表中的头像
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex >= 0) {
            users[userIndex].avatar = selectedAvatar;
            localStorage.setItem('sports_users', JSON.stringify(users));
        }
        
        // 更新当前用户对象
        currentUser.avatar = selectedAvatar;
        
        // 更新我的页面显示
        updateProfilePage();
        
        showToast('头像已更新', 'success');
    }
    
    // 修改用户名
    const newUsername = document.getElementById('new-username').value.trim();
    if (newUsername && currentUser && newUsername !== currentUser.username) {
        // 检查用户名是否已存在
        const existingUser = users.find(u => u.username === newUsername);
        if (existingUser) {
            showToast('用户名已存在', 'warning');
            return;
        }
        
        // 更新用户列表中的用户名
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex >= 0) {
            users[userIndex].username = newUsername;
            localStorage.setItem('sports_users', JSON.stringify(users));
        }
        
        // 更新当前用户对象
        currentUser.username = newUsername;
        
        // 更新显示的用户名
        document.getElementById('current-user').textContent = `欢迎，${newUsername}`;
        
        // 更新自动登录保存的用户名
        localStorage.setItem('sports_current_user', newUsername);
        
        // 更新所有记录中的用户名
        records.forEach(r => {
            if (r.username === currentUser.username) {
                r.username = newUsername;
            }
        });
        localStorage.setItem('sports_records', JSON.stringify(records));
        
        // 更新我的页面显示
        document.getElementById('profile-username').textContent = `用户名：${newUsername}`;
        
        document.getElementById('new-username').value = '';
    }
    
    // 修改密码
    const newPassword = document.getElementById('new-password').value;
    if (newPassword && currentUser) {
        currentUser.password = newPassword;
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex >= 0) {
            users[userIndex] = currentUser;
            localStorage.setItem('sports_users', JSON.stringify(users));
        }
        document.getElementById('new-password').value = '';
    }
    
    updateCountdown();
    closeSettings();
    showToast('设置已保存', 'success');
}
