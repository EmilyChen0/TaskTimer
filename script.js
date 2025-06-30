class TaskTimer {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTask = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.currentPeriod = 'today';

        this.initElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.initChart();
    }

    initElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.taskList = document.getElementById('taskList');
        
        this.totalTimeEl = document.getElementById('totalTime');
        this.sessionCountEl = document.getElementById('sessionCount');
        this.avgSessionEl = document.getElementById('avgSession');
        this.activeTasksCountEl = document.getElementById('activeTasksCount');
        this.chartCanvas = document.getElementById('timeChart');
        this.exportBtn = document.getElementById('exportBtn');
    }

    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.updateStats();
            });
        });

        this.exportBtn.addEventListener('click', () => this.exportData());
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
            this.updateStats();
        }

        this.currentTask = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.updateDisplay();
        this.updateButtons();
        this.taskInput.value = '';
    }

    resetTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
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
        this.updateStats();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    getFilteredSessions() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let cutoff;
        switch (this.currentPeriod) {
            case 'today':
                cutoff = startOfToday;
                break;
            case 'week':
                cutoff = startOfWeek;
                break;
            case 'month':
                cutoff = startOfMonth;
                break;
            default:
                cutoff = new Date(0);
        }

        return this.tasks.flatMap(task => 
            task.sessions.filter(session => 
                new Date(session.timestamp) >= cutoff
            ).map(session => ({ ...session, taskName: task.name }))
        );
    }

    updateStats() {
        const sessions = this.getFilteredSessions();
        const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
        const sessionCount = sessions.length;
        const avgSession = sessionCount > 0 ? totalTime / sessionCount : 0;
        const activeTasks = new Set(sessions.map(s => s.taskName)).size;

        this.totalTimeEl.textContent = this.formatTimeShort(totalTime);
        this.sessionCountEl.textContent = sessionCount.toString();
        this.avgSessionEl.textContent = this.formatTimeShort(avgSession);
        this.activeTasksCountEl.textContent = activeTasks.toString();

        this.drawChart(sessions);
    }

    formatTimeShort(ms) {
        const minutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    initChart() {
        const ctx = this.chartCanvas.getContext('2d');
        this.chartCtx = ctx;
    }

    drawChart(sessions) {
        const ctx = this.chartCtx;
        const canvas = this.chartCanvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (sessions.length === 0) {
            ctx.fillStyle = '#a0aec0';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data for this period', canvas.width / 2, canvas.height / 2);
            return;
        }

        const taskTimes = {};
        sessions.forEach(session => {
            taskTimes[session.taskName] = (taskTimes[session.taskName] || 0) + session.duration;
        });

        const tasks = Object.keys(taskTimes);
        const times = Object.values(taskTimes);
        const maxTime = Math.max(...times);

        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const barWidth = canvas.width / tasks.length * 0.8;
        const maxBarHeight = canvas.height * 0.7;

        tasks.forEach((task, i) => {
            const barHeight = (taskTimes[task] / maxTime) * maxBarHeight;
            const x = (canvas.width / tasks.length) * i + (canvas.width / tasks.length - barWidth) / 2;
            const y = canvas.height - barHeight - 30;

            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.formatTimeShort(taskTimes[task]), x + barWidth / 2, y - 5);
            
            const truncatedName = task.length > 10 ? task.substring(0, 10) + '...' : task;
            ctx.fillText(truncatedName, x + barWidth / 2, canvas.height - 10);
        });
    }

    exportData() {
        const exportData = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tasktimer-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }
}

const taskTimer = new TaskTimer();