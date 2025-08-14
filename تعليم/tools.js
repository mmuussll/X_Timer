document.addEventListener('DOMContentLoaded', () => {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    setupEditor();
    setupGoalList('short');
    setupGoalList('long');
    setupHabitTracker();
});

function setupEditor() {
    const editor = document.getElementById('notebook-editor');
    const toolbar = document.querySelector('.editor-toolbar');
    const imageUploadInput = document.getElementById('image-upload');
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const storageKey = 'notebookContentHTML';
    editor.innerHTML = localStorage.getItem(storageKey) || '<p>ابدأ الكتابة هنا...</p>';
    editor.addEventListener('input', () => localStorage.setItem(storageKey, editor.innerHTML));
    toolbar.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;
        const { command, value } = button.dataset;
        if (command === 'createLink') {
            const url = prompt('أدخل الرابط:');
            if (url) document.execCommand(command, false, url);
        } else {
            document.execCommand(command, false, value || null);
        }
        editor.focus();
    });
    imageUploadBtn.addEventListener('click', () => imageUploadInput.click());
    imageUploadInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = event => document.execCommand('insertHTML', false, `<img src="${event.target.result}" style="max-width: 100%;"/>`);
            reader.readAsDataURL(file);
        }
    });
    editor.addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            window.open(e.target.href, '_blank');
        }
    });
}

function setupGoalList(type) {
    const input = document.getElementById(`${type}-goal-input`);
    const addBtn = document.getElementById(`add-${type}-goal-btn`);
    const list = document.getElementById(`${type}-goal-list`);
    const storageKey = `${type}TermGoals`;
    let goals = JSON.parse(localStorage.getItem(storageKey)) || [];
    function saveGoals() { localStorage.setItem(storageKey, JSON.stringify(goals)); }
    function renderGoals() {
        list.innerHTML = '';
        goals.forEach((goal, index) => {
            const li = document.createElement('li');
            li.className = goal.completed ? 'task-item completed' : 'task-item';
            li.innerHTML = `<span class="task-checkbox"></span><span class="task-text">${goal.text}</span><button class="delete-btn">×</button>`;
            li.querySelector('.task-text').addEventListener('click', () => { goals[index].completed = !goals[index].completed; saveGoals(); renderGoals(); });
            li.querySelector('.task-checkbox').addEventListener('click', () => { goals[index].completed = !goals[index].completed; saveGoals(); renderGoals(); });
            li.querySelector('.delete-btn').addEventListener('click', () => { goals.splice(index, 1); saveGoals(); renderGoals(); });
            list.appendChild(li);
        });
    }
    addBtn.addEventListener('click', () => { const text = input.value.trim(); if (text) { goals.push({ text, completed: false }); input.value = ''; saveGoals(); renderGoals(); } });
    input.addEventListener('keypress', e => { if (e.key === 'Enter') addBtn.click(); });
    renderGoals();
}

function setupHabitTracker() {
    const tracker = document.getElementById('habit-tracker');
    const habitInput = document.getElementById('habit-input');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const storageKey = 'habits';
    let habits = JSON.parse(localStorage.getItem(storageKey)) || [ { name: 'قراءة', dates: [] }, { name: 'رياضة', dates: [] } ];
    function saveHabits() { localStorage.setItem(storageKey, JSON.stringify(habits)); }
    function renderHabits() {
        tracker.innerHTML = '';
        const headerRow = document.createElement('div');
        headerRow.className = 'habit-row header';
        headerRow.innerHTML = '<div class="habit-name">العادة</div>';
        const dateCells = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(new Date().getDate() - i);
            const dayString = d.toISOString().split('T')[0];
            dateCells.push({ key: dayString, label: d.getDate().toString() });
            const dayDiv = document.createElement('div');
            dayDiv.className = 'habit-day';
            dayDiv.textContent = d.getDate();
            headerRow.appendChild(dayDiv);
        }
        tracker.appendChild(headerRow);

        habits.forEach((habit, habitIndex) => {
            const habitRow = document.createElement('div');
            habitRow.className = 'habit-row';
            habitRow.innerHTML = `<div class="habit-name"><span>${habit.name}</span><button class="delete-btn habit-delete-btn">×</button></div>`;
            dateCells.forEach(dateCell => {
                const isCompleted = habit.dates.includes(dateCell.key);
                const checkDiv = document.createElement('div');
                checkDiv.className = `habit-check ${isCompleted ? 'completed' : ''}`;
                checkDiv.dataset.habitIndex = habitIndex;
                checkDiv.dataset.date = dateCell.key;
                habitRow.appendChild(checkDiv);
            });
            tracker.appendChild(habitRow);
        });

        document.querySelectorAll('.habit-check').forEach(check => check.addEventListener('click', e => { const { habitIndex, date } = e.target.dataset; const habit = habits[habitIndex]; const dateIndex = habit.dates.indexOf(date); if (dateIndex > -1) { habit.dates.splice(dateIndex, 1); } else { habit.dates.push(date); } saveHabits(); renderHabits(); }));
        document.querySelectorAll('.habit-delete-btn').forEach((btn, index) => btn.addEventListener('click', () => { habits.splice(index, 1); saveHabits(); renderHabits(); }));
    }
    addHabitBtn.addEventListener('click', () => { const text = habitInput.value.trim(); if (text) { habits.push({ name: text, dates: [] }); habitInput.value = ''; saveHabits(); renderHabits(); } });
    habitInput.addEventListener('keypress', e => { if (e.key === 'Enter') addHabitBtn.click(); });
    renderHabits();
}