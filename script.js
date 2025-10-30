document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const moneyElement = document.getElementById('money');
    const labelsContainer = document.getElementById('labels-container');
    const datePicker = document.getElementById('date-picker');
    const weekNumberDisplay = document.getElementById('week-number-display');
    const historyTableBody = document.querySelector('#history-table tbody');
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const importFile = document.getElementById('import-file');

    // App State
    let allRecords = [];
    let labelsData = [];
    let selectedDate = new Date();

    // Initialization
    loadDataFromLocalStorage();
    fetchLabels();
    initializeDatePicker();

    // Event Listeners
    datePicker.addEventListener('change', handleDateChange);
    exportButton.addEventListener('click', exportData);
    importButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);

    /**
     * Fetches label data from the JSON file.
     */
    function fetchLabels() {
        fetch('labels.json')
            .then(response => response.json())
            .then(data => {
                labelsData = data;
                renderLabels();
            });
    }

    /**
     * Renders the reward and punishment buttons.
     */
    function renderLabels() {
        labelsContainer.innerHTML = '';
        labelsData.forEach(label => {
            const button = document.createElement('button');
            button.textContent = `${label.name} (${label.money > 0 ? '+' : ''}${label.money} RMB)`;
            button.classList.add(label.type);
            button.addEventListener('click', () => {
                addRecord(label.name, label.money);
            });
            labelsContainer.appendChild(button);
        });
    }

    /**
     * Initializes the date picker with the current date and updates the UI.
     */
    function initializeDatePicker() {
        datePicker.value = selectedDate.toISOString().split('T')[0];
        updateDisplay(selectedDate);
    }

    /**
     * Handles the date change event from the date picker.
     * @param {Event} e The event object.
     */
    function handleDateChange(e) {
        selectedDate = new Date(e.target.value);
        updateDisplay(selectedDate);
    }

    /**
     * Adds a new record, saves to local storage, and updates the display.
     * @param {string} name The name of the label.
     * @param {number} money The amount of money.
     */
    function addRecord(name, money) {
        const newRecord = {
            id: Date.now(), // Unique ID for deletion
            date: selectedDate.toISOString().split('T')[0],
            name,
            money
        };
        allRecords.push(newRecord);
        saveDataToLocalStorage();
        updateDisplay(selectedDate);
    }

    /**
     * Deletes a record by its ID.
     * @param {number} id The ID of the record to delete.
     */
    function deleteRecord(id) {
        allRecords = allRecords.filter(record => record.id !== id);
        saveDataToLocalStorage();
        updateDisplay(selectedDate);
    }

    /**
     * Updates the entire UI based on the selected date.
     * @param {Date} date The selected date.
     */
    function updateDisplay(date) {
        const weekNumber = getWeekNumber(date);
        weekNumberDisplay.textContent = `(第 ${weekNumber} 周)`;

        const recordsForWeek = filterRecordsByWeek(allRecords, date);
        renderHistory(recordsForWeek);
        calculateAndDisplayTotal(recordsForWeek);
    }

    /**
     * Renders the history table with the given records.
     * @param {Array} records The records to display.
     */
    function renderHistory(records) {
        historyTableBody.innerHTML = '';
        records.forEach(record => {
            const row = historyTableBody.insertRow();
            row.insertCell(0).textContent = record.date;
            row.insertCell(1).textContent = record.name;
            row.insertCell(2).textContent = record.money;

            const actionCell = row.insertCell(3);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.classList.add('delete-btn');
            deleteButton.addEventListener('click', () => deleteRecord(record.id));
            actionCell.appendChild(deleteButton);
        });
    }

    /**
     * Calculates and displays the total money for the week.
     * @param {Array} records The records for the week.
     */
    function calculateAndDisplayTotal(records) {
        let total = 100; // Base weekly money
        records.forEach(record => {
            total += record.money;
        });

        // Clamp the total between 0 and 200
        total = Math.max(0, Math.min(200, total));
        moneyElement.textContent = total;
    }

    // --- Data Persistence ---

    function saveDataToLocalStorage() {
        localStorage.setItem('pocketMoneyData', JSON.stringify(allRecords));
    }

    function loadDataFromLocalStorage() {
        const data = localStorage.getItem('pocketMoneyData');
        if (data) {
            allRecords = JSON.parse(data);
        }
    }

    function exportData() {
        const dataStr = JSON.stringify(allRecords, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pocket_money_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                // Basic validation
                if (Array.isArray(importedData)) {
                    allRecords = importedData;
                    saveDataToLocalStorage();
                    updateDisplay(selectedDate);
                    alert('数据导入成功！');
                } else {
                    alert('导入失败：文件格式不正确。');
                }
            } catch (error) {
                alert('导入失败：无法解析文件。');
            }
        };
        reader.readAsText(file);
    }

    // --- Utility Functions ---

    /**
     * Gets the ISO week number for a given date.
     * @param {Date} d The date.
     * @returns {number} The week number.
     */
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    /**
     * Filters records to only include those from the same week as the selected date.
     * @param {Array} records The full list of records.
     * @param {Date} date The selected date.
     * @returns {Array} The filtered list of records.
     */
    function filterRecordsByWeek(records, date) {
        const targetWeek = getWeekNumber(date);
        const targetYear = date.getFullYear();
        return records.filter(record => {
            const recordDate = new Date(record.date);
            return getWeekNumber(recordDate) === targetWeek && recordDate.getFullYear() === targetYear;
        });
    }
});
