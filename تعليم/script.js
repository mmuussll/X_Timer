// --- DOM Elements ---
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const settingsBtn = document.getElementById('settings-btn');
const workModeBtn = document.getElementById('work-mode-btn');
const shortBreakModeBtn = document.getElementById('short-break-mode-btn');
const longBreakModeBtn = document.getElementById('long-break-mode-btn');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const modal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const workDurationInput = document.getElementById('work-duration-input');
const shortBreakDurationInput = document.getElementById('short-break-duration-input');
const longBreakDurationInput = document.getElementById('long-break-duration-input');
const workSoundSelect = document.getElementById('work-sound-select');
const breakSoundSelect = document.getElementById('break-sound-select');
const volumeSlider = document.getElementById('volume-slider');

// --- State ---
let timerInterval = null;
let secondsLeft = 0;
let currentMode = 'work';
let settings = {};

// --- Audio ---
const sounds = { alarm: new Audio(), click: new Audio('sounds/click.mp3'), taskComplete: new Audio('sounds/complete.mp3') };
function playSound(sound, src) {
    if (src) sound.src = src;
    sound.volume = settings.volume;
    sound.currentTime = 0;
    sound.play().catch(err => console.error(`Could not play sound. Did you create the /sounds folder and add the audio files?`, err));
}

// --- Timer Logic ---
function startTimer() {
    if (timerInterval) return; // Already running
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    timerInterval = setInterval(() => {
        secondsLeft--;
        updateTimerDisplay();
        if (secondsLeft < 0) {
            handleSessionEnd();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
}

function updateTimerDisplay() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${(seconds < 0 ? 0 : seconds).toString().padStart(2, '0')}`;
}

function resetTimer() {
    pauseTimer();
    switch(currentMode) {
        case 'work': secondsLeft = settings.workDuration * 60; break;
        case 'shortBreak': secondsLeft = settings.shortBreakDuration * 60; break;
        case 'longBreak': secondsLeft = settings.longBreakDuration * 60; break;
    }
    updateTimerDisplay();
}

function switchMode(mode) {
    playSound(sounds.click);
    currentMode = mode;
    document.querySelectorAll('.timer-modes button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-mode-btn`).classList.add('active');
    resetTimer();
    startTimer();
}

function handleSessionEnd() {
    const soundSrc = currentMode === 'work' ? settings.workSound : settings.breakSound;
    playSound(sounds.alarm, soundSrc);
    if (currentMode === 'work') saveSession();
    // Switch to the next mode
    currentMode = currentMode === 'work' ? 'shortBreak' : 'work';
    document.querySelectorAll('.timer-modes button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${currentMode}-mode-btn`).classList.add('active');
    resetTimer();
    startTimer();
}

// --- Settings & Data ---
function saveSettings() {
    playSound(sounds.click);
    settings.workDuration = parseInt(workDurationInput.value, 10);
    settings.shortBreakDuration = parseInt(shortBreakDurationInput.value, 10);
    settings.longBreakDuration = parseInt(longBreakDurationInput.value, 10);
    settings.workSound = workSoundSelect.value;
    settings.breakSound = breakSoundSelect.value;
    settings.volume = parseFloat(volumeSlider.value);
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    loadSettings();
    resetTimer();
    toggleModal(false);
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {};
    settings = { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, workSound: 'sounds/alarm1.mp3', breakSound: 'sounds/bell.mp3', volume: 0.5, ...savedSettings };
    workDurationInput.value = settings.workDuration;
    shortBreakDurationInput.value = settings.shortBreakDuration;
    longBreakDurationInput.value = settings.longBreakDuration;
    workSoundSelect.value = settings.workSound;
    breakSoundSelect.value = settings.breakSound;
    volumeSlider.value = settings.volume;
    Object.values(sounds).forEach(s => s.volume = settings.volume);
}

function saveSession() {
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];
    sessions.push({ date: new Date().toISOString(), duration: settings.workDuration });
    localStorage.setItem('pomodoroSessions', JSON.stringify(sessions));
}

function toggleModal(show) { playSound(sounds.click); modal.style.display = show ? 'flex' : 'none'; }

// --- Task List Logic ---
let tasks = [];
function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function loadTasks() { tasks = JSON.parse(localStorage.getItem('tasks')) || []; }
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'task-item completed' : 'task-item';
        li.innerHTML = `<span class="task-checkbox"></span><span class="task-text">${task.text}</span><button class="delete-btn">×</button>`;
        li.querySelector('.task-text').addEventListener('click', () => toggleTask(index));
        li.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(index));
        li.querySelector('.delete-btn').addEventListener('click', () => { playSound(sounds.click); deleteTask(index); });
        taskList.appendChild(li);
    });
}
function addTask() {
    playSound(sounds.click);
    const text = taskInput.value.trim();
    if (text) { tasks.push({ text: text, completed: false }); taskInput.value = ''; saveTasks(); renderTasks(); }
}
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    playSound(tasks[index].completed ? sounds.taskComplete : sounds.click);
    saveTasks();
    renderTasks();
}
function deleteTask(index) { tasks.splice(index, 1); saveTasks(); renderTasks(); }

// --- Event Listeners ---
startBtn.addEventListener('click', () => { playSound(sounds.click); startTimer(); });
pauseBtn.addEventListener('click', () => { playSound(sounds.click); pauseTimer(); });
settingsBtn.addEventListener('click', () => toggleModal(true));
closeModalBtn.addEventListener('click', () => toggleModal(false));
saveSettingsBtn.addEventListener('click', saveSettings);
volumeSlider.addEventListener('input', e => { settings.volume = e.target.value; Object.values(sounds).forEach(s => s.volume = settings.volume); playSound(sounds.click); });
workSoundSelect.addEventListener('change', e => playSound(sounds.alarm, e.target.value));
breakSoundSelect.addEventListener('change', e => playSound(sounds.alarm, e.target.value));
workModeBtn.addEventListener('click', () => switchMode('work'));
shortBreakModeBtn.addEventListener('click', () => switchMode('shortBreak'));
longBreakModeBtn.addEventListener('click', () => switchMode('longBreak'));
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

// --- Initial Load ---
function init() {
    loadSettings();
    resetTimer();
    loadTasks();
    renderTasks();
}

init();
