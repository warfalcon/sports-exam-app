// API 配置 - 部署时请替换为你的 Render 后端地址
// 格式: https://your-render-app-name.onrender.com/api
const API_BASE_URL = 'https://sports-exam-backend.onrender.com/api';

// 全局状态
let currentUser = null;
let token = localStorage.getItem('sports_token') || null;
let records = [];
let examDate = '';
let trendChart = null;
let historyChart = null;

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

// API 请求封装
async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '请求失败');
        }
        
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// 初始化
window.onload = async function() {
    console.log('App loading...');
    try {
        initAuthPage();
        setDefaultDates();
        initStandardsPage();
        initSelectOptions();
        updateCountdown();
        setInterval(updateCountdown, 60000);
        
        // 检查是否有保存的 token，自动登录
        if (token) {
            await autoLogin();
        }
        
        // 初始化顶部标题栏自动隐藏功能
        initHeaderAutoHide();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

// 顶部标题栏自动隐藏功能
let lastScrollY = 0;
function initHeaderAutoHide() {
    const header = document.getElementById('main-page')?.querySelector('.header');
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const mainPage = document.getElementById('main-page');
        
        // 只在主页面显示时才生效
        if (!mainPage || !mainPage.classList.contains('active')) {
            header.classList.remove('hidden');
            return;
        }
        
        // 向下滚动超过50px时隐藏，向上滚动时显示
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
    });
}

// 自动登录
async function autoLogin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('登录失效');
        }
        
        const result = await response.json();
        if (result.user) {
            currentUser = result.user;
            examDate = currentUser.examDate || '';
            document.getElementById('current-user').textContent = `欢迎，${currentUser.username}`;
            applyTheme(currentUser.color);
            document.getElementById('auth-page').classList.remove('active');
            document.getElementById('main-page').classList.add('active');
            await loadRecords();
            initDashboard();
            initHistoryPage();
        }
    } catch (error) {
        token = null;
        localStorage.removeItem('sports_token');
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
    updateUserSelect();
}

// 更新用户选择下拉框
async function updateUserSelect() {
    try {
        const result = await apiRequest('/users/list');
        const users = result;
        const select = document.getElementById('login-user');
        select.innerHTML = '<option value="">选择用户</option>';
        users.forEach(user => {
            select.innerHTML += `<option value="${user.username}">${user.username} (${user.gender === 'male' ? '男' : '女'})</option>`;
        });
    } catch (error) {
        console.error('Failed to load users:', error);
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
async function register() {
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
    
    try {
        const result = await apiRequest('/auth/register', 'POST', {
            username,
            password,
            gender,
            color
        });
        
        token = result.token;
        localStorage.setItem('sports_token', token);
        currentUser = result.user;
        examDate = currentUser.examDate || '';
        
        showToast('注册成功！', 'success');
        document.getElementById('current-user').textContent = `欢迎，${currentUser.username}`;
        applyTheme(currentUser.color);
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('main-page').classList.add('active');
        await loadRecords();
        initDashboard();
        initHistoryPage();
    } catch (error) {
        console.error('Registration failed:', error);
    }
}

// 登录
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showToast('请输入用户名和密码', 'warning');
        return;
    }
    
    try {
        const result = await apiRequest('/auth/login', 'POST', {
            username,
            password
        });
        
        token = result.token;
        localStorage.setItem('sports_token', token);
        currentUser = result.user;
        examDate = currentUser.examDate || '';
        
        document.getElementById('current-user').textContent = `欢迎，${currentUser.username}`;
        applyTheme(currentUser.color);
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('main-page').classList.add('active');
        await loadRecords();
        initDashboard();
        initHistoryPage();
    } catch (error) {
        console.error('Login failed:', error);
    }
}

// 加载记录
async function loadRecords() {
    try {
        const result = await apiRequest('/records');
        records = result;
    } catch (error) {
        console.error('Failed to load records:', error);
        records = [];
    }
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
    token = null;
    records = [];
    localStorage.removeItem('sports_token');
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
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

function initProfilePage() {
    if (currentUser) {
        document.getElementById('profile-username').textContent = `用户名：${currentUser.username}`;
        document.getElementById('profile-gender').textContent = `性别：${currentUser.gender === 'male' ? '男' : '女'}`;
    }
}

// 初始化概览页面
function initDashboard() {
    if (!currentUser) return;
    
    // 计算本月打卡天数
    const currentMonth = new Date().toISOString().slice(0, 7);
    const dailyRecords = records.filter(r => {
        const recordDate = new Date(r.date).toISOString().slice(0, 7);
        return recordDate === currentMonth;
    });
    const monthDates = new Set(dailyRecords.map(r => new Date(r.date).toISOString().split('T')[0]));
    const monthCheckins = monthDates.size;
    document.getElementById('month-checkins').textContent = `${monthCheckins} 天`;
    
    // 连续打卡天数
    const streak = calculateStreak(dailyRecords);
    document.getElementById('streak-days').textContent = `${streak} 天`;
    
    // 总训练次数
    document.getElementById('total-records').textContent = `${records.length} 次`;
    
    // 更新倒计时
    updateCountdown();
    
    // 渲染趋势图
    renderTrendChart(records);
    
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
    renderRecentRecords(records);
}

// 计算连续打卡天数
function calculateStreak(dailyRecords) {
    if (dailyRecords.length === 0) return 0;
    
    const dates = [...new Set(dailyRecords.map(r => {
        return new Date(r.date).toISOString().split('T')[0];
    }))].sort().reverse();
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
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
    
    const dates = [];
    const counts = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr.slice(5));
        
        const dayRecords = userRecords.filter(r => {
            return new Date(r.date).toISOString().split('T')[0] === dateStr;
        });
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
    
    const sortedRecords = [...userRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedRecords.slice(0, 5);
    
    tbody.innerHTML = recent.map(r => {
        const sport = r.sports?.[0];
        return `
            <tr>
                <td>${new Date(r.date).toISOString().split('T')[0]}</td>
                <td>${sport?.type || '综合'}</td>
                <td>${sport?.result || '-'}</td>
                <td>${sport?.score || 0}分</td>
            </tr>
        `;
    }).join('');
}

// 初始化选择选项
function initSelectOptions() {
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
async function saveDailyRecord() {
    if (!currentUser) return;
    
    const date = document.getElementById('daily-date').value;
    const note = document.getElementById('training-note').value;
    
    const checkedItems = document.querySelectorAll('.sport-item:checked');
    if (checkedItems.length === 0) {
        showToast('请至少选择一个训练项目', 'warning');
        return;
    }
    
    const sports = [];
    
    for (const checkbox of checkedItems) {
        const itemKey = checkbox.value;
        const inputDiv = document.getElementById(`input-${itemKey}`);
        let value = inputDiv ? inputDiv.querySelector('input').value : '';
        
        if (!value) continue;
        
        const standard = SCORING_STANDARDS[currentUser.gender][itemKey];
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
        
        const result = calculateScore(currentUser.gender, itemKey, parsedValue);
        
        sports.push({
            type: itemKey,
            result: formatValue(itemKey, parsedValue),
            score: result.score
        });
    }
    
    if (sports.length === 0) return;
    
    try {
        await apiRequest('/records', 'POST', {
            date,
            sports,
            note
        });
        
        showToast('保存成功！', 'success');
        
        document.querySelectorAll('.sport-item').forEach(cb => cb.checked = false);
        document.getElementById('training-note').value = '';
        document.getElementById('sport-inputs').innerHTML = '';
        
        await loadRecords();
        initDashboard();
        initHistoryPage();
    } catch (error) {
        console.error('Failed to save record:', error);
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
    renderHistoryTable(records);
}

// 渲染历史表格
function renderHistoryTable(userRecords) {
    const tbody = document.querySelector('#history-table tbody');
    if (!tbody) return;
    
    const sportFilter = document.getElementById('history-sport')?.value || 'all';
    
    let filtered = [...userRecords];
    
    if (sportFilter !== 'all') {
        filtered = filtered.filter(r => r.sports?.some(s => s.type === sportFilter));
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = filtered.map(r => {
        const sport = r.sports?.[0];
        return `
            <tr>
                <td>${new Date(r.date).toISOString().split('T')[0]}</td>
                <td>${sport?.type || '综合'}</td>
                <td>${sport?.result || '-'}</td>
                <td>${sport?.score || 0}分</td>
                <td><button onclick="deleteRecord('${r._id}')">删除</button></td>
            </tr>
        `;
    }).join('');
    
    const historyList = document.getElementById('history-list');
    if (historyList) {
        historyList.innerHTML = filtered.map(r => {
            const sport = r.sports?.[0];
            return `
                <div class="history-card">
                    <div class="history-card-header">
                        <span class="history-card-date">${new Date(r.date).toISOString().split('T')[0]}</span>
                    </div>
                    <div class="history-card-content">
                        <div class="history-card-item">
                            <div class="history-card-name">${sport?.type || '综合'}</div>
                            <div class="history-card-value">${sport?.result || '-'}</div>
                        </div>
                        <div class="history-card-score">${sport?.score || 0}分</div>
                    </div>
                    <button onclick="deleteRecord('${r._id}')" style="margin-top: 10px; width: 100%; padding: 8px; background: var(--danger-color); color: white; border: none; border-radius: 6px; cursor: pointer;">删除</button>
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
    
    const checkbox = document.querySelector(`.sport-item[value="${sportKey}"]`);
    if (checkbox) {
        checkbox.checked = true;
        updateSportInputs();
        
        setTimeout(() => {
            const inputsDiv = document.getElementById('sport-inputs');
            if (inputsDiv) {
                inputsDiv.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}

// 删除记录
async function deleteRecord(id) {
    const confirmed = await showConfirm('删除记录', '确定要删除这条记录吗？');
    if (!confirmed) return;
    
    try {
        await apiRequest(`/records/${id}`, 'DELETE');
        showToast('记录已删除', 'success');
        await loadRecords();
        initHistoryPage();
        initDashboard();
    } catch (error) {
        console.error('Failed to delete record:', error);
    }
}

// 更新历史图表
function updateHistoryChart() {
    const sport = document.getElementById('chart-sport').value;
    if (!sport || !currentUser) return;
    
    const filteredRecords = records.filter(r => 
        r.sports?.some(s => s.type === sport)
    );
    
    if (filteredRecords.length === 0) {
        showToast('该项目暂无记录', 'info');
        return;
    }
    
    filteredRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const ctx = document.getElementById('history-chart');
    if (!ctx) return;
    
    if (historyChart) {
        historyChart.destroy();
    }
    
    const labels = filteredRecords.map(r => new Date(r.date).toISOString().slice(5, 10));
    const values = filteredRecords.map(r => {
        const sportData = r.sports?.find(s => s.type === sport);
        return parseFloat(sportData?.result) || 0;
    });
    
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
    if (!currentUser || records.length === 0) {
        alert('暂无数据可导出');
        return;
    }
    
    let csv = '日期,项目,成绩,得分,备注\n';
    
    records.forEach(r => {
        r.sports?.forEach(sport => {
            csv += `${new Date(r.date).toISOString().split('T')[0]},${sport.type},${sport.result},${sport.score},${r.note || ''}\n`;
        });
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `体育训练记录_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 初始化评分标准页面
function initStandardsPage() {
    renderStandardTable('female', '800m', 'female-800m', 0);
    renderStandardTable('female', '50m', 'female-50m', 1);
    renderStandardTable('female', 'situp', 'female-situp', 2);
    renderStandardTable('female', 'jump', 'female-jump', 3);
    renderStandardTable('female', 'stretch', 'female-stretch', 4);
    
    renderStandardTable('male', '1000m', 'male-1000m', 0);
    renderStandardTable('male', '50m', 'male-50m', 1);
    renderStandardTable('male', 'pullup', 'male-pullup', 2);
    renderStandardTable('male', 'jump', 'male-jump', 3);
    renderStandardTable('male', 'stretch', 'male-stretch', 4);
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
function showSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('exam-date-setting').value = examDate;
}

// 关闭设置
function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// 保存设置
async function saveSettings() {
    const newExamDate = document.getElementById('exam-date-setting').value;
    
    try {
        await apiRequest('/users', 'PUT', {
            examDate: newExamDate
        });
        
        examDate = newExamDate;
        showToast('设置已保存', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
    
    const newPassword = document.getElementById('new-password').value;
    if (newPassword && currentUser) {
        try {
            await apiRequest('/users', 'PUT', {
                password: newPassword
            });
            showToast('密码已更新', 'success');
            document.getElementById('new-password').value = '';
        } catch (error) {
            console.error('Failed to update password:', error);
        }
    }
    
    updateCountdown();
    closeSettings();
}