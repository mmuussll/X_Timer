document.addEventListener('DOMContentLoaded', () => {
    const sessions = JSON.parse(localStorage.getItem('pomodoroSessions')) || [];

    function renderLifetimeStats() {
        const totalSessions = sessions.length;
        const totalTime = sessions.reduce((acc, session) => acc + session.duration, 0);
        let avgSessions = 0;
        if (sessions.length > 0) {
            const uniqueDays = new Set(sessions.map(s => s.date.split('T')[0])).size;
            avgSessions = (totalSessions / (uniqueDays || 1)).toFixed(1);
        }
        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('total-time').innerHTML = `${totalTime} <span>دقيقة</span>`;
        document.getElementById('avg-sessions').textContent = avgSessions;
    }

    function renderChart(elementId, days) {
        const chartContainer = document.getElementById(elementId);
        if (!chartContainer) return;

        const labels = [];
        const dataByDate = {};
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(new Date().getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push({ key: key, label: d.getDate().toString() });
            dataByDate[key] = 0;
        }
        labels.reverse(); // Show oldest to newest

        sessions.forEach(s => {
            const key = s.date.split('T')[0];
            if (dataByDate.hasOwnProperty(key)) {
                dataByDate[key] += s.duration;
            }
        });

        const chartData = labels.map(l => dataByDate[l.key]);
        const maxMinutes = Math.max(...chartData, 1);

        let chartHtml = '';
        labels.forEach((l, index) => {
            const dayMinutes = chartData[index];
            const barHeight = (dayMinutes / maxMinutes) * 100;
            chartHtml += `
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${barHeight}%;">
                        <div class="bar-tooltip">${dayMinutes} دقيقة</div>
                    </div>
                    <div class="bar-label">${l.label}</div>
                </div>
            `;
        });
        chartContainer.innerHTML = chartHtml || '<p class="no-data">لا توجد بيانات لعرضها.</p>';
    }

    renderLifetimeStats();
    renderChart('last-7-days-chart', 7);
    renderChart('last-30-days-chart', 30);
});