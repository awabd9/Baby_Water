// --- 核心變數設定 ---
const DAILY_GOAL = 2000;
const WATER_NEEDED_FOR_FLOWER = 1000; // 澆花所需的水量 (ml)
const FINAL_FLOWER_ICON = "🌸"; // 每次澆花後長成的花朵圖標

const STORAGE_KEY_RECORDS = 'waterRecords';
const STORAGE_KEY_BUCKET = 'bucketAmount';
const STORAGE_KEY_GARDEN = 'flowerGarden'; // 儲存已長成的花朵陣列

// 獲取 DOM 元素
const amountInput = document.getElementById('waterAmount');
const addButton = document.getElementById('addWaterBtn');
const undoButton = document.getElementById('undoBtn');
const intakeDisplay = document.getElementById('currentIntakeDisplay');
const weeklyIntakeDisplay = document.getElementById('weeklyIntake');
const monthlyIntakeDisplay = document.getElementById('monthlyIntake');
const yearlyIntakeDisplay = document.getElementById('yearlyIntake');
// 遊戲化元素
const waterLevelDisplay = document.getElementById('waterLevel');
const waterFlowerBtn = document.getElementById('waterFlowerBtn');
const flowerGardenDisplay = document.getElementById('flowerGarden'); 

let waterRecords = [];
let bucketAmount = 0; // 水桶累積水量
let flowerGarden = []; // 已長成的花朵陣列

// 新增旗標：用來限制只能撤銷最近一筆記錄 (防止連續撤銷)
let canUndo = false; 

// --- 工具函式 ---

/**
 * 載入所有本地儲存的數據 (記錄, 水桶, 花朵)
 */
function loadAllData() {
    const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (savedRecords) {
        waterRecords = JSON.parse(savedRecords);
    } else {
        waterRecords = [];
    }
    
    // 確保 bucketAmount 是數字
    bucketAmount = parseInt(localStorage.getItem(STORAGE_KEY_BUCKET)) || 0;
    
    const savedGarden = localStorage.getItem(STORAGE_KEY_GARDEN);
    if (savedGarden) {
        flowerGarden = JSON.parse(savedGarden);
    } else {
        flowerGarden = [];
    }

    // 載入時，預設不能撤銷，直到有新的輸入
    canUndo = false; 
}

/**
 * 儲存水桶和花朵狀態
 */
function saveGameState() {
    localStorage.setItem(STORAGE_KEY_BUCKET, bucketAmount);
    localStorage.setItem(STORAGE_KEY_GARDEN, JSON.stringify(flowerGarden));
}

/**
 * 計算特定時間範圍的總喝水量
 */
function calculateIntake(startDate, endDate) {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    let totalAmount = 0;
    
    waterRecords.forEach(record => {
        if (record.timestamp >= startTimestamp && record.timestamp <= endTimestamp) {
            totalAmount += record.amount;
        }
    });
    
    return totalAmount;
}

// --- 核心更新與互動函式 ---

/**
 * 渲染花朵列表到網頁上
 */
function renderGarden() {
    flowerGardenDisplay.innerHTML = ''; 

    if (flowerGarden.length === 0) {
        flowerGardenDisplay.innerHTML = '<p id="gardenMessage">你的花園還空空的，快來澆水吧！</p>';
        return;
    }

    // 遍歷花朵陣列，為每個花朵創建一個元素
    flowerGarden.forEach(() => {
        const flowerElement = document.createElement('span');
        flowerElement.className = 'flower-unit';
        flowerElement.textContent = FINAL_FLOWER_ICON; 
        flowerGardenDisplay.appendChild(flowerElement);
    });
}


/**
 * 更新遊戲化介面 (水桶水位和澆花按鈕狀態)
 */
function updateGameDisplay() {
    // 1. 更新水桶水位
    const maxCapacity = WATER_NEEDED_FOR_FLOWER * 2; 
    let levelPercentage = Math.min((bucketAmount / maxCapacity) * 100, 100);
    
    waterLevelDisplay.style.height = `${levelPercentage}%`;

    // 2. 更新澆花按鈕狀態 (水量剛好 1000ml 時，按鈕也會啟用)
    if (bucketAmount >= WATER_NEEDED_FOR_FLOWER) {
        waterFlowerBtn.disabled = false;
        waterFlowerBtn.title = `點擊澆花 (${WATER_NEEDED_FOR_FLOWER} ml) - 將長成一朵新花！`;
    } else {
        waterFlowerBtn.disabled = true;
        const missing = WATER_NEEDED_FOR_FLOWER - bucketAmount;
        waterFlowerBtn.title = `還需要 ${missing} ml 才能長出一朵新花`;
    }

    // 3. 渲染花園
    renderGarden();
}

/**
 * 處理「記錄」按鈕點擊事件
 */
function handleAddWater() {
    const amountToAdd = parseInt(amountInput.value);

    if (isNaN(amountToAdd) || amountToAdd <= 0) {
        alert("請輸入有效的喝水量！");
        return;
    }
    
    const newRecord = { timestamp: new Date().getTime(), amount: amountToAdd };
    waterRecords.push(newRecord);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(waterRecords));

    bucketAmount += amountToAdd;
    saveGameState(); 

    // 新增邏輯: 允許撤銷 (因為有新的輸入)
    canUndo = true; 
    
    updateDisplay();
    updateGameDisplay();

    amountInput.value = '250';
}

/**
 * 處理「撤銷最後一筆記錄」按鈕
 */
function handleUndo() {
    // 檢查是否允許撤銷 (限制連續撤銷)
    if (!canUndo) {
        alert("只能撤銷上一次單筆喝水記錄。請先記錄新的喝水量才能再次撤銷。");
        return;
    }
    
    if (waterRecords.length === 0) {
        alert("沒有任何記錄可以撤銷！");
        return;
    }

    const lastRecord = waterRecords.pop();
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(waterRecords));

    bucketAmount -= lastRecord.amount;
    if (bucketAmount < 0) bucketAmount = 0; 
    saveGameState();
    
    // 新增邏輯: 撤銷操作已執行，再次禁止撤銷，直到有新的輸入
    canUndo = false; 

    updateDisplay();
    updateGameDisplay();
    
    // 移除 alert，讓操作更流暢，使用者可直接從 UI 變化得知結果
}

/**
 * 處理「澆花」按鈕點擊事件
 */
function handleWaterFlower() {
    if (bucketAmount < WATER_NEEDED_FOR_FLOWER) {
        alert("水桶水量不足，請繼續喝水！");
        return;
    }

    // 1. 減少水桶水量
    bucketAmount -= WATER_NEEDED_FOR_FLOWER;

    // 2. 在花園陣列中新增一朵花
    const newFlower = {
        date: new Date().toDateString(),
        timestamp: new Date().getTime()
    };
    flowerGarden.push(newFlower);
    
    // 3. 儲存遊戲狀態
    saveGameState();

    // 4. 更新所有顯示
    updateDisplay();
    updateGameDisplay();

    alert("澆花成功！恭喜您長成了一朵新的花！🌸");
}


// --- 核心數據計算函式 ---

function updateDisplay() {
    const now = new Date();
    
    // 每日計算
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailyIntake = calculateIntake(dayStart, now);
    intakeDisplay.textContent = `今日總水量：${dailyIntake} ml`;
    
    // 每週計算
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek); 
    weeklyIntakeDisplay.textContent = calculateIntake(weekStart, now);

    // 每月計算
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthlyIntakeDisplay.textContent = calculateIntake(monthStart, now);

    // 每年計算
    const yearStart = new Date(now.getFullYear(), 0, 1);
    yearlyIntakeDisplay.textContent = calculateIntake(yearStart, now);
}


// --- 初始化和事件監聽 ---

// 1. 啟動時載入所有數據
loadAllData();

// 2. 啟動時更新所有顯示畫面
updateDisplay();
updateGameDisplay(); 

// 3. 監聽按鈕點擊
addButton.addEventListener('click', handleAddWater);
undoButton.addEventListener('click', handleUndo);
waterFlowerBtn.addEventListener('click', handleWaterFlower);

// 4. 允許按 Enter 鍵記錄
amountInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        handleAddWater();
    }
});