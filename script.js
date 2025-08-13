// متغيرات التطبيق
let timer;
let isRunning = false;
let currentTime = 25 * 60; // 25 دقيقة بالثواني
let isWorkSession = true;
let workTime = 25;
let breakTime = 5;

// إحصائيات
let stats = {
    studyTime: 0,
    breakTime: 0,
    completedSessions: 0,
    completedTasks: 0
};

// مصفوفة المهام
let tasks = [];
let currentFilter = 'all';

// عناصر DOM
const timeDisplay = document.getElementById('timeDisplay');
const sessionType = document.getElementById('sessionType');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workTimeInput = document.getElementById('workTime');
const breakTimeInput = document.getElementById('breakTime');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const notificationSound = document.getElementById('notificationSound');

// عناصر الإحصائيات
const studyTimeElement = document.getElementById('studyTime');
const breakTimeStatsElement = document.getElementById('breakTimeStats');
const completedSessionsElement = document.getElementById('completedSessions');
const completedTasksElement = document.getElementById('completedTasks');

// عناصر المهام
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');

// تحميل البيانات عند بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDisplay();
    updateStats();
    renderTasks();

    // إعداد الأحداث
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    workTimeInput.addEventListener('change', updateWorkTime);
    breakTimeInput.addEventListener('change', updateBreakTime);

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });
}

// وظائف المؤقت
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;

        timer = setInterval(function() {
            currentTime--;
            updateDisplay();
            updateProgress();

            if (currentTime <= 0) {
                completeSession();
            }
        }, 1000);

        document.body.classList.add('timer-active');
        progressText.textContent = isWorkSession ? 'جلسة عمل جارية...' : 'استراحة جارية...';
        showNotification('تم بدء المؤقت!', 'success');
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timer);
        startBtn.disabled = false;
        pauseBtn.disabled = true;

        document.body.classList.remove('timer-active');
        progressText.textContent = 'مؤقت متوقف';
        showNotification('تم إيقاف المؤقت', 'info');
    }
}

function resetTimer() {
    isRunning = false;
    clearInterval(timer);

    currentTime = isWorkSession ? workTime * 60 : breakTime * 60;

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    document.body.classList.remove('timer-active');
    updateDisplay();
    updateProgress();
    progressText.textContent = 'جاهز للبدء';
    showNotification('تم إعادة تعيين المؤقت', 'info');
}

function completeSession() {
    isRunning = false;
    clearInterval(timer);

    // تحديث الإحصائيات
    if (isWorkSession) {
        stats.studyTime += workTime;
        stats.completedSessions++;
        showNotification('تمت جلسة العمل! وقت الراحة الآن', 'success');
    } else {
        stats.breakTime += breakTime;
        showNotification('انتهت الراحة! وقت العمل الآن', 'success');
    }

    // تشغيل صوت التنبيه
    playNotificationSound();

    // تغيير نوع الجلسة
    isWorkSession = !isWorkSession;
    currentTime = isWorkSession ? workTime * 60 : breakTime * 60;

    // إعادة تعيين الأزرار
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    document.body.classList.remove('timer-active');
    if (!isWorkSession) {
        document.body.classList.add('timer-break');
    } else {
        document.body.classList.remove('timer-break');
    }

    updateDisplay();
    updateStats();
    updateProgress();
    saveData();

    progressText.textContent = 'جلسة مكتملة! اضغط ابدأ للمتابعة';
}

// تحديث العرض
function updateDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;

    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    sessionType.textContent = isWorkSession ? 'جلسة عمل' : 'استراحة';
}

function updateProgress() {
    const totalTime = isWorkSession ? workTime * 60 : breakTime * 60;
    const progress = ((totalTime - currentTime) / totalTime) * 100;
    progressFill.style.width = `${progress}%`;
}

function updateStats() {
    studyTimeElement.textContent = stats.studyTime;
    breakTimeStatsElement.textContent = stats.breakTime;
    completedSessionsElement.textContent = stats.completedSessions;
    completedTasksElement.textContent = stats.completedTasks;
}

// إعدادات الوقت
function updateWorkTime() {
    workTime = parseInt(workTimeInput.value);
    if (isWorkSession && !isRunning) {
        currentTime = workTime * 60;
        updateDisplay();
        updateProgress();
    }
    saveData();
}

function updateBreakTime() {
    breakTime = parseInt(breakTimeInput.value);
    if (!isWorkSession && !isRunning) {
        currentTime = breakTime * 60;
        updateDisplay();
        updateProgress();
    }
    saveData();
}

// إدارة المهام
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        showNotification('يرجى إدخال نص المهمة', 'error');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date()
    };

    tasks.push(task);
    taskInput.value = '';
    renderTasks();
    saveData();
    showNotification('تم إضافة المهمة بنجاح', 'success');
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;

        // تحديث إحصائيات المهام المكتملة
        stats.completedTasks = tasks.filter(t => t.completed).length;

        renderTasks();
        updateStats();
        saveData();

        const message = task.completed ? 'تم إنجاز المهمة!' : 'تم إلغاء إنجاز المهمة';
        showNotification(message, 'success');
    }
}

function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const wasCompleted = tasks[taskIndex].completed;
        tasks.splice(taskIndex, 1);

        if (wasCompleted) {
            stats.completedTasks--;
        }

        renderTasks();
        updateStats();
        saveData();
        showNotification('تم حذف المهمة', 'info');
    }
}

function setFilter(filter) {
    currentFilter = filter;

    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    renderTasks();
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">لا توجد مهام</div>';
        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;

        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;

        taskList.appendChild(taskElement);
    });
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'pending':
            return tasks.filter(task => !task.completed);
        default:
            return tasks;
    }
}

// الإشعارات
function showNotification(message, type = 'info') {
    // إزالة الإشعارات السابقة
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // إظهار الإشعار
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function playNotificationSound() {
    notificationSound.currentTime = 0;
    notificationSound.play().catch(e => {
        console.log('لا يمكن تشغيل الصوت:', e);
    });
}

// حفظ وتحميل البيانات
function saveData() {
    const data = {
        stats: stats,
        tasks: tasks,
        workTime: workTime,
        breakTime: breakTime
    };

    localStorage.setItem('pomodoroApp', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('pomodoroApp');

    if (savedData) {
        const data = JSON.parse(savedData);

        stats = data.stats || stats;
        tasks = data.tasks || [];
        workTime = data.workTime || 25;
        breakTime = data.breakTime || 5;

        workTimeInput.value = workTime;
        breakTimeInput.value = breakTime;
        currentTime = workTime * 60;

        // تحديث عدد المهام المكتملة
        stats.completedTasks = tasks.filter(t => t.completed).length;
    }
}

// إعادة تعيين البيانات في منتصف الليل
function checkForNewDay() {
    const lastReset = localStorage.getItem('lastReset');
    const today = new Date().toDateString();

    if (lastReset !== today) {
        // إعادة تعيين الإحصائيات اليومية
        stats.studyTime = 0;
        stats.breakTime = 0;
        stats.completedSessions = 0;

        updateStats();
        saveData();
        localStorage.setItem('lastReset', today);

        showNotification('تم تحديث الإحصائيات لليوم الجديد!', 'success');
    }
}

// فحص اليوم الجديد كل دقيقة
setInterval(checkForNewDay, 60000);

// فحص عند تحميل الصفحة
checkForNewDay();

// حفظ البيانات عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    saveData();
});

// دعم اختصارات لوحة المفاتيح
document.addEventListener('keydown', function(e) {
    // مسافة للبدء/الإيقاف
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    // R لإعادة التعيين
    if (e.code === 'KeyR' && e.ctrlKey) {
        e.preventDefault();
        resetTimer();
    }
});