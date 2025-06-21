class TaskTimer {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTask = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isRunning = false;

        this.initElements();
        this.bindEvents();
        this.renderTasks();
    }

    initElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.taskList = document.getElementById('taskList');
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
    }

    addTask() {
        const taskName = this.taskInput.value.trim();
        if (!taskName) return;

        const task = {
            id: Date.now(),
            name: taskName,
            totalTime: 0,
            sessions: [],
            created: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.taskInput.value = '';
    }

    startTimer() {
        if (!this.currentTask) {
            const taskName = this.taskInput.value.trim();
            if (!taskName) {
                alert('Please enter a task name first!');
                return;
            }
            
            let task = this.tasks.find(t => t.name === taskName);
            if (!task) {
                this.addTask();
                task = this.tasks[this.tasks.length - 1];
            }
            this.currentTask = task;
        }

        this.startTime = Date.now() - this.elapsedTime;
        this.isRunning = true;

        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }, 1000);

        this.updateButtons();
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.updateButtons();
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.currentTask && this.elapsedTime > 0) {
            this.currentTask.totalTime += this.elapsedTime;
            this.currentTask.sessions.push({
                duration: this.elapsedTime,
                timestamp: new Date().toISOString()
            });
            this.saveTasks();
            this.renderTasks();
        }

        this.currentTask = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.updateDisplay();
        this.updateButtons();
        this.taskInput.value = '';
    }

    updateDisplay() {
        const time = this.formatTime(this.elapsedTime);
        this.timeDisplay.textContent = time;
    }

    updateButtons() {
        this.startBtn.disabled = this.isRunning;
        this.pauseBtn.disabled = !this.isRunning;
        this.stopBtn.disabled = !this.isRunning && this.elapsedTime === 0;
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderTasks() {
        if (this.tasks.length === 0) {
            this.taskList.innerHTML = '<p class="no-tasks">No tasks yet. Add one above!</p>';
            return;
        }

        this.taskList.innerHTML = this.tasks.map(task => `
            <div class="task-item">
                <div class="task-info">
                    <h3>${task.name}</h3>
                    <div class="task-time">Total: ${this.formatTime(task.totalTime)} • ${task.sessions.length} sessions</div>
                </div>
                <div class="task-actions">
                    <button onclick="taskTimer.selectTask('${task.id}')">Select</button>
                    <button onclick="taskTimer.deleteTask('${task.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    selectTask(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (task) {
            this.taskInput.value = task.name;
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id != taskId);
        this.saveTasks();
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

const taskTimer = new TaskTimer();