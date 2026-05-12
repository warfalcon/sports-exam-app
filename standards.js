// 山东中考体育评分标准数据
const SCORING_STANDARDS = {
    // 女生标准
    female: {
        // 800米跑 - 时间格式：秒
        // 分数: 最大秒数（成绩小于等于此值获得该分数）
        '800m': {
            name: '800米跑',
            unit: '秒',
            format: 'time',
            scores: {
                100: 194,  // 3'14
                95: 204,   // 3'24
                90: 214,   // 3'34
                85: 222,   // 3'42
                80: 230,   // 3'50
                78: 234,   // 3'54
                76: 238,   // 3'58
                74: 242,   // 4'02
                72: 246,   // 4'06
                70: 250,   // 4'10
                68: 254,   // 4'14
                66: 258,   // 4'18
                64: 262,   // 4'22
                62: 266,   // 4'26
                60: 270,   // 4'30
            },
            // 附加分标准（超过100分后的加分）
            bonus: {
                10: 184,  // 3'04
                9: 186,
                8: 188,
                7: 190,
                6: 192,
                5: 194,
                4: 196,
                3: 198,
                2: 200,
                1: 202,
            }
        },
        // 50米跑 - 时间格式：秒
        '50m': {
            name: '50米跑',
            unit: '秒',
            format: 'time_decimal',
            scores: {
                100: 7.4,
                95: 7.6,
                90: 7.8,
                85: 8.0,
                80: 8.2,
                78: 8.4,
                76: 8.6,
                74: 8.8,
                72: 9.0,
                70: 9.2,
                68: 9.4,
                66: 9.6,
                64: 9.8,
                62: 10.0,
                60: 10.2,
            }
        },
        // 1分钟仰卧起坐 - 次数
        'situp': {
            name: '1分钟仰卧起坐',
            unit: '次',
            format: 'count',
            scores: {
                100: 52,
                95: 50,
                90: 48,
                85: 45,
                80: 42,
                78: 40,
                76: 38,
                74: 36,
                72: 34,
                70: 32,
                68: 30,
                66: 28,
                64: 26,
                62: 24,
                60: 22,
            },
            // 附加分标准
            bonus: {
                10: 62,
                9: 60,
                8: 58,
                7: 56,
                6: 54,
                5: 52,
                4: 50,
                3: 48,
                2: 46,
                1: 44,
            }
        },
        // 1分钟跳绳 - 次数
        'jump': {
            name: '1分钟跳绳',
            unit: '次',
            format: 'count',
            scores: {
                100: 172,
                95: 165,
                90: 158,
                85: 150,
                80: 142,
                78: 136,
                76: 130,
                74: 124,
                72: 118,
                70: 112,
                68: 106,
                66: 100,
                64: 94,
                62: 88,
                60: 82,
            }
        },
        // 坐位体前屈 - 厘米
        'stretch': {
            name: '坐位体前屈',
            unit: '厘米',
            format: 'decimal',
            scores: {
                100: 21.6,
                95: 20.5,
                90: 19.4,
                85: 17.9,
                80: 16.4,
                78: 15.2,
                76: 14.0,
                74: 12.8,
                72: 11.6,
                70: 10.4,
                68: 9.2,
                66: 8.0,
                64: 6.8,
                62: 5.6,
                60: 4.4,
            }
        },
        // 立定跳远 - 厘米
        'longjump': {
            name: '立定跳远',
            unit: '厘米',
            format: 'count',
            scores: {
                100: 202,
                95: 196,
                90: 190,
                85: 183,
                80: 176,
                78: 171,
                76: 166,
                74: 161,
                72: 156,
                70: 151,
                68: 146,
                66: 141,
                64: 136,
                62: 131,
                60: 126,
            }
        },
        // 掷实心球 - 米
        'solidball': {
            name: '掷实心球',
            unit: '米',
            format: 'decimal',
            scores: {
                100: 7.8,
                95: 7.5,
                90: 7.2,
                85: 6.9,
                80: 6.6,
                78: 6.4,
                76: 6.2,
                74: 6.0,
                72: 5.8,
                70: 5.6,
                68: 5.4,
                66: 5.2,
                64: 5.0,
                62: 4.8,
                60: 4.6,
            }
        }
    },
    
    // 男生标准
    male: {
        // 1000米跑
        '1000m': {
            name: '1000米跑',
            unit: '秒',
            format: 'time',
            scores: {
                100: 220,  // 3'40
                95: 230,   // 3'50
                90: 240,   // 4'00
                85: 248,   // 4'08
                80: 256,   // 4'16
                78: 260,   // 4'20
                76: 264,   // 4'24
                74: 268,   // 4'28
                72: 272,   // 4'32
                70: 276,   // 4'36
                68: 280,   // 4'40
                66: 284,   // 4'44
                64: 288,   // 4'48
                62: 292,   // 4'52
                60: 296,   // 4'56
            },
            // 附加分标准
            bonus: {
                10: 210,  // 3'30
                9: 212,
                8: 214,
                7: 216,
                6: 218,
                5: 220,
                4: 222,
                3: 224,
                2: 226,
                1: 228,
            }
        },
        // 50米跑
        '50m': {
            name: '50米跑',
            unit: '秒',
            format: 'time_decimal',
            scores: {
                100: 6.7,
                95: 6.9,
                90: 7.1,
                85: 7.3,
                80: 7.5,
                78: 7.7,
                76: 7.9,
                74: 8.1,
                72: 8.3,
                70: 8.5,
                68: 8.7,
                66: 8.9,
                64: 9.1,
                62: 9.3,
                60: 9.5,
            }
        },
        // 引体向上
        'pullup': {
            name: '引体向上',
            unit: '次',
            format: 'count',
            scores: {
                100: 15,
                95: 14,
                90: 13,
                85: 12,
                80: 11,
                78: 10,
                76: 9,
                74: 8,
                72: 7,
                70: 6,
                68: 5,
                66: 4,
                64: 3,
                62: 2,
                60: 1,
            },
            // 附加分标准
            bonus: {
                10: 25,
                9: 23,
                8: 21,
                7: 19,
                6: 17,
                5: 15,
                4: 13,
                3: 11,
                2: 9,
                1: 7,
            }
        },
        // 1分钟跳绳
        'jump': {
            name: '1分钟跳绳',
            unit: '次',
            format: 'count',
            scores: {
                100: 180,
                95: 173,
                90: 166,
                85: 158,
                80: 150,
                78: 144,
                76: 138,
                74: 132,
                72: 126,
                70: 120,
                68: 114,
                66: 108,
                64: 102,
                62: 96,
                60: 90,
            }
        },
        // 坐位体前屈
        'stretch': {
            name: '坐位体前屈',
            unit: '厘米',
            format: 'decimal',
            scores: {
                100: 21.6,
                95: 19.5,
                90: 17.4,
                85: 15.6,
                80: 13.8,
                78: 12.6,
                76: 11.4,
                74: 10.2,
                72: 9.0,
                70: 7.8,
                68: 6.6,
                66: 5.4,
                64: 4.2,
                62: 3.0,
                60: 1.8,
            }
        },
        // 立定跳远
        'longjump': {
            name: '立定跳远',
            unit: '厘米',
            format: 'count',
            scores: {
                100: 250,
                95: 243,
                90: 236,
                85: 228,
                80: 220,
                78: 215,
                76: 210,
                74: 205,
                72: 200,
                70: 195,
                68: 190,
                66: 185,
                64: 180,
                62: 175,
                60: 170,
            }
        },
        // 掷实心球
        'solidball': {
            name: '掷实心球',
            unit: '米',
            format: 'decimal',
            scores: {
                100: 12.4,
                95: 11.8,
                90: 11.2,
                85: 10.6,
                80: 10.0,
                78: 9.6,
                76: 9.2,
                74: 8.8,
                72: 8.4,
                70: 8.0,
                68: 7.6,
                66: 7.2,
                64: 6.8,
                62: 6.4,
                60: 6.0,
            }
        }
    }
};

// 选考项目列表
const OPTIONAL_ITEMS = {
    female: [
        { key: 'situp', name: '1分钟仰卧起坐' },
        { key: 'longjump', name: '立定跳远' },
        { key: 'jump', name: '1分钟跳绳' },
        { key: 'stretch', name: '坐位体前屈' },
        { key: 'solidball', name: '掷实心球' }
    ],
    male: [
        { key: 'pullup', name: '引体向上' },
        { key: 'longjump', name: '立定跳远' },
        { key: 'jump', name: '1分钟跳绳' },
        { key: 'stretch', name: '坐位体前屈' },
        { key: 'solidball', name: '掷实心球' }
    ]
};

// 运动技能项目列表
const SKILL_ITEMS = [
    { key: 'basketball', name: '篮球运球' },
    { key: 'football', name: '足球绕杆' },
    { key: 'volleyball', name: '排球垫球' },
    { key: 'badminton', name: '羽毛球' },
    { key: 'pingpong', name: '乒乓球' },
    { key: 'swim', name: '游泳' },
    { key: 'run100', name: '100米跑' },
    { key: 'run200', name: '200米跑' },
    { key: 'run400', name: '400米跑' },
    { key: 'longjump', name: '急行跳远' },
    { key: 'highjump', name: '跳高' }
];

// 计算单项得分
function calculateScore(gender, item, value) {
    const standard = SCORING_STANDARDS[gender][item];
    if (!standard) return { score: 0, level: '未达标' };
    
    let score = 0;
    let bonus = 0;
    
    // 根据项目类型判断成绩好坏方向
    // 时间类：值越小越好；次数/距离类：值越大越好
    const isTime = standard.format === 'time' || standard.format === 'time_decimal';
    
    const scores = standard.scores;
    const sortedScores = Object.entries(scores).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    
    for (const [s, threshold] of sortedScores) {
        if (isTime) {
            // 时间类：成绩小于等于阈值获得该分数
            if (value <= threshold) {
                score = parseInt(s);
                break;
            }
        } else {
            // 次数/距离类：成绩大于等于阈值获得该分数
            if (value >= threshold) {
                score = parseInt(s);
                break;
            }
        }
    }
    
    // 计算附加分
    if (standard.bonus && score === 100) {
        const bonusScores = Object.entries(standard.bonus).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        for (const [b, threshold] of bonusScores) {
            if (isTime) {
                if (value <= threshold) {
                    bonus = parseInt(b);
                    break;
                }
            } else {
                if (value >= threshold) {
                    bonus = parseInt(b);
                    break;
                }
            }
        }
    }
    
    const totalScore = Math.min(score + bonus, 120);
    
    let level = '未达标';
    if (totalScore >= 90) level = '优秀';
    else if (totalScore >= 80) level = '良好';
    else if (totalScore >= 60) level = '及格';
    
    return { score: totalScore, level, bonus };
}

// 格式化成绩显示
function formatValue(item, value) {
    const standard = SCORING_STANDARDS.female[item] || SCORING_STANDARDS.male[item];
    if (!standard) return value;
    
    if (standard.format === 'time') {
        const min = Math.floor(value / 60);
        const sec = value % 60;
        return `${min}'${sec.toString().padStart(2, '0')}`;
    }
    return value + standard.unit;
}

// 解析时间输入
function parseTimeInput(input) {
    // 支持格式：3'30, 3:30, 3分30秒, 210
    input = input.trim();
    
    // 纯数字，假设是秒
    if (/^\d+$/.test(input)) {
        return parseInt(input);
    }
    
    // 3'30 或 3:30 格式
    const match1 = input.match(/^(\d+)['':：](\d+)$/);
    if (match1) {
        return parseInt(match1[1]) * 60 + parseInt(match1[2]);
    }
    
    // 3分30秒 格式
    const match2 = input.match(/^(\d+)分(\d+)秒?$/);
    if (match2) {
        return parseInt(match2[1]) * 60 + parseInt(match2[2]);
    }
    
    return null;
}

// 获取所有项目列表
function getAllItems() {
    const items = [];
    const femaleItems = SCORING_STANDARDS.female;
    const maleItems = SCORING_STANDARDS.male;
    
    Object.entries(femaleItems).forEach(([key, value]) => {
        items.push({ key, name: value.name, gender: 'female' });
    });
    
    Object.entries(maleItems).forEach(([key, value]) => {
        if (!items.find(i => i.key === key)) {
            items.push({ key, name: value.name, gender: 'male' });
        }
    });
    
    return items;
}

// 渲染评分标准表格
function renderStandardTable(gender, itemKey, containerId, mobileIndex) {
    const standard = SCORING_STANDARDS[gender][itemKey];
    if (!standard) {
        console.error('Standard not found:', gender, itemKey);
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    // 桌面端表格
    let desktopHtml = `
        <thead>
            <tr>
                <th>分数</th>
                <th>成绩${standard.unit ? '(' + standard.unit + ')' : ''}</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    const scores = Object.entries(standard.scores).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    for (const [score, value] of scores) {
        const displayValue = formatValue(itemKey, value);
        desktopHtml += `
            <tr>
                <td>${score}分</td>
                <td>${displayValue}</td>
            </tr>
        `;
    }
    
    // 添加附加分行
    if (standard.bonus) {
        desktopHtml += `<tr class="bonus-row"><td colspan="2">附加分标准</td></tr>`;
        const bonuses = Object.entries(standard.bonus).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        for (const [bonus, value] of bonuses) {
            const displayValue = formatValue(itemKey, value);
            desktopHtml += `
                <tr class="bonus">
                    <td>+${bonus}分</td>
                    <td>${displayValue}</td>
                </tr>
            `;
        }
    }
    
    desktopHtml += '</tbody>';
    container.innerHTML = desktopHtml;
    
    // 移动端列表
    const allMobileContainers = document.querySelectorAll(`#${gender}-standards .standard-table-mobile`);
    if (allMobileContainers[mobileIndex]) {
        let mobileHtml = '';
        
        for (const [score, value] of scores) {
            const displayValue = formatValue(itemKey, value);
            mobileHtml += `
                <div class="standard-item">
                    <span class="standard-score">${score}分</span>
                    <span class="standard-value">${displayValue}</span>
                </div>
            `;
        }
        
        if (standard.bonus) {
            mobileHtml += `<div style="padding: 12px 0; font-weight: bold; color: var(--warning-color);">附加分标准</div>`;
            const bonuses = Object.entries(standard.bonus).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
            for (const [bonus, value] of bonuses) {
                const displayValue = formatValue(itemKey, value);
                mobileHtml += `
                    <div class="standard-item" style="background: #fff9e6;">
                        <span class="standard-score">+${bonus}分</span>
                        <span class="standard-value">${displayValue}</span>
                    </div>
                `;
            }
        }
        
        allMobileContainers[mobileIndex].innerHTML = mobileHtml;
    }
}
