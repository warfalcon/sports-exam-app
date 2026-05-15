// 全局状态
let currentUser = null;
let users = JSON.parse(localStorage.getItem('sports_users')) || [];
let records = JSON.parse(localStorage.getItem('sports_records')) || [];
let examDate = localStorage.getItem('sports_exam_date') || '';
let trendChart = null;
let historyChart = null;

// 孩子管理相关
let children = JSON.parse(localStorage.getItem('sports_children')) || [];
let currentChild = null;

// 离线支持相关
let isOnline = navigator.onLine;
let pendingRecords = JSON.parse(localStorage.getItem('sports_pending_records')) || [];

// 检查网络状态
function checkOnlineStatus() {
    isOnline = navigator.onLine;
    updateOnlineIndicator();
    
    if (isOnline && pendingRecords.length > 0) {
        showToast(`检测到网络，正在同步 ${pendingRecords.length} 条离线数据...`, 'info');
        syncPendingRecords();
    }
}

// 保存待同步记录
function savePendingRecord(record) {
    pendingRecords.push(record);
    localStorage.setItem('sports_pending_records', JSON.stringify(pendingRecords));
    showToast('数据已保存，将在联网后自动同步', 'info');
}

// 同步待处理记录
async function syncPendingRecords() {
    if (pendingRecords.length === 0) return;
    
    const successCount = 0;
    const failedRecords = [];
    
    for (const record of pendingRecords) {
        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sports_token')}`
                },
                body: JSON.stringify(record)
            });
            
            if (response.ok) {
                successCount++;
            } else {
                failedRecords.push(record);
            }
        } catch (error) {
            failedRecords.push(record);
        }
    }
    
    pendingRecords = failedRecords;
    localStorage.setItem('sports_pending_records', JSON.stringify(pendingRecords));
    
    if (successCount > 0) {
        showToast(`成功同步 ${successCount} 条数据`, 'success');
    }
    
    if (failedRecords.length > 0) {
        showToast(`有 ${failedRecords.length} 条数据同步失败`, 'warning');
    }
}

// 监听网络状态变化
window.addEventListener('online', checkOnlineStatus);
window.addEventListener('offline', checkOnlineStatus);

// 监听Service Worker同步请求
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_REQUEST') {
        syncPendingRecords();
    }
});

// 加载孩子列表
function loadChildren() {
    // 从当前用户的children数组加载
    if (currentUser) {
        // 确保currentUser有children属性
        if (!currentUser.children) {
            currentUser.children = [];
            updateUserInUsers(currentUser);
        }
        children = currentUser.children;
        localStorage.setItem('sports_children', JSON.stringify(children));
        
        if (children.length > 0 && !currentChild) {
            currentChild = children[0];
            localStorage.setItem('sports_current_child', JSON.stringify(currentChild));
        }
        
        updateProfilePage();
    }
}

// 更新用户数组中的用户
function updateUserInUsers(user) {
    const index = users.findIndex(u => u.username === user.username);
    if (index >= 0) {
        users[index] = user;
        localStorage.setItem('sports_users', JSON.stringify(users));
    }
}

// 添加孩子
function addChild(name, gender, avatar, color) {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        return;
    }
    
    if (!currentUser.children) {
        currentUser.children = [];
    }
    
    const child = {
        id: Date.now(),
        name,
        gender: gender || 'male',
        avatar: avatar || '🐵',
        color: color || 'blue',
        createdAt: new Date().toISOString()
    };
    
    currentUser.children.push(child);
    updateUserInUsers(currentUser);
    children = currentUser.children;
    localStorage.setItem('sports_children', JSON.stringify(children));
    
    showToast('添加成功', 'success');
    loadChildren();
}

// 删除孩子
function deleteChild(childId) {
    if (!confirm('确定要删除这个孩子吗？删除后将无法恢复！')) {
        return;
    }
    
    if (!currentUser || !currentUser.children) {
        return;
    }
    
    currentUser.children = currentUser.children.filter(c => c.id !== childId);
    updateUserInUsers(currentUser);
    children = currentUser.children;
    localStorage.setItem('sports_children', JSON.stringify(children));
    
    // 删除该孩子的所有记录
    records = records.filter(r => r.childId !== childId);
    localStorage.setItem('sports_records', JSON.stringify(records));
    
    if (currentChild && currentChild.id === childId) {
        currentChild = children.length > 0 ? children[0] : null;
        localStorage.setItem('sports_current_child', JSON.stringify(currentChild));
    }
    
    showToast('删除成功', 'success');
    loadChildren();
}

// 选择当前孩子
function selectChild(child) {
    currentChild = child;
    localStorage.setItem('sports_current_child', JSON.stringify(child));
    
    const themeColor = child.color && THEME_COLORS[child.color] ? child.color : (currentUser?.color || 'blue');
    applyTheme(themeColor);
    
    updateProfilePage();
    showToast(`已切换到 ${child.name}`, 'success');
    
    initDashboard();
    initHistoryPage();
}

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

// 初始化Service Worker
async function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showToast('有新版本可用，请刷新页面', 'info');
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// 初始化
window.onload = function() {
    console.log('App loading...');
    
    // 在任何其他初始化之前先尝试自动登录
    console.log('=== 页面加载，首先尝试自动登录 ===');
    const savedUsername = localStorage.getItem('sports_current_user');
    const savedUsers = localStorage.getItem('sports_users');
    
    console.log('localStorage.sports_current_user:', savedUsername);
    console.log('localStorage.sports_users存在:', !!savedUsers);
    
    if (savedUsername) {
        // 立即尝试自动登录，不要等待其他初始化
        setTimeout(() => {
            autoLogin();
        }, 0);
    }
    
    try {
        // 初始化Service Worker（离线支持）
        initServiceWorker();
        
        // 检查网络状态
        checkOnlineStatus();
        
        initAuthPage();
        setDefaultDates();
        // 延迟初始化标准页面，确保DOM元素已加载
        setTimeout(() => {
            console.log('Initializing standards page...');
            initStandardsPage();
            console.log('Standards page initialized');
        }, 100);
        initSelectOptions();
        updateCountdown();
        setInterval(updateCountdown, 60000); // 每分钟更新倒计时
        
        // 如果之前没有自动登录成功，再次尝试
        if (!currentUser && savedUsername) {
            console.log('第一次自动登录失败，再次尝试...');
            setTimeout(autoLogin, 50);
        }
        
        // 检查待同步记录
        if (pendingRecords.length > 0) {
            showToast(`有 ${pendingRecords.length} 条数据待同步`, 'warning');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

// 自动登录 - 页面刷新后恢复登录状态
function autoLogin() {
    console.log('=== 自动登录检查 ===');
    
    // 检查localStorage中的数据
    const savedUsername = localStorage.getItem('sports_current_user');
    console.log('savedUsername:', savedUsername);
    console.log('users数组长度:', users.length);
    
    if (!savedUsername) {
        console.log('自动登录失败：未找到保存的用户名');
        return;
    }
    
    // 如果users数组为空，尝试从localStorage重新加载
    if (users.length === 0) {
        console.log('users数组为空，尝试从localStorage重新加载');
        const savedUsers = localStorage.getItem('sports_users');
        if (savedUsers) {
            try {
                users = JSON.parse(savedUsers);
                console.log('重新加载成功，users数组长度:', users.length);
            } catch (e) {
                console.log('重新加载失败:', e);
                return;
            }
        } else {
            console.log('localStorage中没有保存的用户数据');
            return;
        }
    }
    
    const user = users.find(u => u.username === savedUsername);
    if (!user) {
        console.log('自动登录失败：未找到匹配的用户');
        return;
    }
    
    console.log('找到用户:', user.username);
    
    // 检查DOM元素是否存在
    const authPage = document.getElementById('auth-page');
    const mainPage = document.getElementById('main-page');
    
    if (!authPage || !mainPage) {
        console.log('自动登录失败：DOM元素未加载');
        // 延迟重试
        setTimeout(autoLogin, 100);
        return;
    }
    
    // 执行自动登录
    currentUser = user;
    
    const savedChild = localStorage.getItem('sports_current_child');
    if (savedChild) {
        try {
            currentChild = JSON.parse(savedChild);
            console.log('恢复当前孩子:', currentChild?.name);
        } catch (e) {
            currentChild = null;
            console.log('恢复孩子失败:', e);
        }
    }
    
    let themeColor;
    if (currentChild && currentChild.color && THEME_COLORS[currentChild.color]) {
        themeColor = currentChild.color;
    } else if (user.color && THEME_COLORS[user.color]) {
        themeColor = user.color;
    } else {
        themeColor = 'blue';
    }
    applyTheme(themeColor);
    
    authPage.classList.remove('active');
    mainPage.classList.add('active');
    
    const header = document.getElementById('main-header');
    const mainContent = document.querySelector('.main-content');
    if (header && mainContent) {
        header.style.display = 'none';
        mainContent.style.paddingTop = '0';
    }
    
    loadChildren();
    initDashboard();
    initHistoryPage();
    
    console.log('自动登录成功:', user.username);
    showToast(`欢迎回来，${user.username}`, 'success');
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
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!username || !gender || !password) {
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
        color: 'blue',
        password,
        avatar: AVATARS[0],
        children: [],
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
    
    // 根据"记住我"选项决定是否保存自动登录信息
    const rememberMe = document.getElementById('remember-me')?.checked;
    if (rememberMe) {
        // 保存当前用户到 localStorage，用于自动登录
        localStorage.setItem('sports_current_user', user.username);
    } else {
        // 如果不记住我，清除自动登录信息
        localStorage.removeItem('sports_current_user');
    }
    
    // 保存登录用户名（用于填充登录框）
    localStorage.setItem('sports_login_username', user.username);
    
    // 应用主题颜色
    applyTheme(user.color);
    
    // 切换到主页面
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    
    // 去除顶部标题栏
    const header = document.getElementById('main-header');
    const mainContent = document.querySelector('.main-content');
    if (header && mainContent) {
        header.style.display = 'none';
        mainContent.style.paddingTop = '0';
    }
    
    // 加载孩子列表
    loadChildren();
    
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
    currentChild = null;
    localStorage.removeItem('sports_current_user');
    localStorage.removeItem('sports_current_child');
    localStorage.removeItem('sports_children');
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
    
    // 去除顶部标题栏
    const header = document.getElementById('main-header');
    const mainContent = document.querySelector('.main-content');
    if (header && mainContent) {
        header.style.display = 'none';
        mainContent.style.paddingTop = '0';
    }
    
    if (page === 'dashboard') {
        initDashboard();
    } else if (page === 'history') {
        initHistoryPage();
    } else if (page === 'profile') {
        initProfilePage();
    } else if (page === 'standards') {
        initStandardsPage();
    }
}

function showProfile() {
    showPage('profile');
}

function updateProfilePage() {
    // 更新当前孩子信息
    if (currentChild) {
        document.getElementById('child-avatar').textContent = currentChild.avatar || '👤';
        document.getElementById('child-name').textContent = currentChild.name;
        document.getElementById('child-gender').textContent = currentChild.gender === 'male' ? '男生' : '女生';
    } else {
        document.getElementById('child-avatar').textContent = '👤';
        document.getElementById('child-name').textContent = '请添加孩子';
        document.getElementById('child-gender').textContent = '';
    }
    
    // 更新孩子列表
    const childrenList = document.getElementById('children-list');
    if (children.length > 0) {
        childrenList.innerHTML = children.map(child => `
            <div class="child-item ${currentChild && currentChild.id === child.id ? 'active' : ''}" 
                 onclick="selectChild(${JSON.stringify(child).replace(/"/g, '&quot;')})">
                <div class="child-avatar" style="background: ${getThemeColor(child.color)}15;">${child.avatar}</div>
                <div class="child-item-info">
                    <p class="child-item-name">${child.name}</p>
                    <p class="child-item-gender">${child.gender === 'male' ? '男生' : '女生'}</p>
                </div>
                <button class="child-delete-btn" onclick="event.stopPropagation(); deleteChild(${child.id})">删除</button>
            </div>
        `).join('');
    } else {
        childrenList.innerHTML = '<div class="empty-state"><p>暂无孩子，请添加</p></div>';
    }
}

function initProfilePage() {
    updateProfilePage();
    loadChildren();
}

// 显示添加孩子模态框
function showAddChildModal() {
    // 初始化头像选择器
    const avatarSelector = document.getElementById('child-avatar-selector');
    if (avatarSelector) {
        avatarSelector.innerHTML = AVATARS.map((avatar, index) => 
            `<button class="avatar-option ${index === 0 ? 'active' : ''}" 
                     data-avatar="${avatar}" onclick="selectAvatar(this)">${avatar}</button>`
        ).join('');
    }
    
    // 重置表单
    document.getElementById('child-name-input').value = '';
    document.getElementById('child-gender-select').value = 'male';
    document.getElementById('add-child-modal').classList.remove('hidden');
}

// 关闭添加孩子模态框
function closeAddChildModal() {
    document.getElementById('add-child-modal').classList.add('hidden');
}

// 选择孩子头像
function selectAvatar(element) {
    const selector = document.getElementById('child-avatar-selector');
    selector.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
}

// 保存孩子
function saveChild() {
    const name = document.getElementById('child-name-input').value.trim();
    const gender = document.getElementById('child-gender-select').value;
    const avatar = document.getElementById('child-avatar-selector').querySelector('.active').dataset.avatar;
    
    if (!name) {
        showToast('请输入孩子姓名', 'warning');
        return;
    }
    
    const color = getNextAvailableColor();
    addChild(name, gender, avatar, color);
    closeAddChildModal();
}

// 获取下一个可用的主题颜色
function getNextAvailableColor() {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
    
    if (!currentUser || !currentUser.children || currentUser.children.length === 0) {
        return colors[0];
    }
    
    const usedColors = currentUser.children.map(c => c.color);
    
    for (const color of colors) {
        if (!usedColors.includes(color)) {
            return color;
        }
    }
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// 获取主题色
function getThemeColor(color) {
    const colors = {
        blue: '#3498db',
        green: '#27ae60',
        purple: '#9b59b6',
        orange: '#e67e22',
        pink: '#e91e63'
    };
    return colors[color] || colors.blue;
}

// 初始化概览页面
function initDashboard() {
    if (!currentUser) return;
    
    let userRecords = records.filter(r => r.username === currentUser.username);
    
    if (currentChild) {
        userRecords = userRecords.filter(r => r.childId === currentChild.id);
    }
    
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
    const examCountdownEl = document.getElementById('exam-countdown');
    
    if (!examDate) {
        if (examCountdownEl) examCountdownEl.textContent = '未设置';
        return;
    }
    
    const exam = new Date(examDate);
    const now = new Date();
    const diff = exam - now;
    
    if (diff <= 0) {
        if (examCountdownEl) examCountdownEl.textContent = '已结束';
        return;
    }
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
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
            childId: currentChild?.id || null,
            childName: currentChild?.name || '',
            type: 'daily',
            date,
            item: itemKey,
            itemName: standard ? standard.name : itemKey,
            value: formatValue(itemKey, parsedValue),
            rawValue: parsedValue,
            score: result.score,
            level: result.level,
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
    
    let userRecords = records.filter(r => r.username === currentUser.username);
    
    if (currentChild) {
        userRecords = userRecords.filter(r => r.childId === currentChild.id);
    }
    
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
    if (typeof SCORING_STANDARDS === 'undefined') {
        console.error('SCORING_STANDARDS not loaded');
        return;
    }
    
    const femaleItems = [
        { key: '800m', container: 'female-800m' },
        { key: '50m', container: 'female-50m' },
        { key: 'situp', container: 'female-situp' },
        { key: 'jump', container: 'female-jump' },
        { key: 'stretch', container: 'female-stretch' }
    ];
    
    const maleItems = [
        { key: '1000m', container: 'male-1000m' },
        { key: '50m', container: 'male-50m' },
        { key: 'pullup', container: 'male-pullup' },
        { key: 'jump', container: 'male-jump' },
        { key: 'stretch', container: 'male-stretch' }
    ];
    
    femaleItems.forEach((item, index) => {
        const container = document.getElementById(item.container);
        if (container && SCORING_STANDARDS.female && SCORING_STANDARDS.female[item.key]) {
            renderStandardTable('female', item.key, item.container, index);
        }
    });
    
    maleItems.forEach((item, index) => {
        const container = document.getElementById(item.container);
        if (container && SCORING_STANDARDS.male && SCORING_STANDARDS.male[item.key]) {
            renderStandardTable('male', item.key, item.container, index);
        }
    });
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

// 切换折叠/展开状态
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('hidden');
        
        // 更新箭头方向
        const header = section.previousElementSibling;
        if (header) {
            const arrow = header.querySelector('.section-arrow');
            if (arrow) {
                arrow.textContent = section.classList.contains('hidden') ? '▼' : '▲';
            }
        }
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
function saveSettings() {
    examDate = document.getElementById('exam-date-setting').value;
    localStorage.setItem('sports_exam_date', examDate);
    
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
