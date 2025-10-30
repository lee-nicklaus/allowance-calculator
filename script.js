document.addEventListener('DOMContentLoaded', () => {
    const moneyElement = document.getElementById('money');
    const labelsContainer = document.getElementById('labels-container');

    let currentMoney = 100;

    fetch('labels.json')
        .then(response => response.json())
        .then(labels => {
            labels.forEach(label => {
                const button = document.createElement('button');
                button.textContent = `${label.name} (${label.money > 0 ? '+' : ''}${label.money} RMB)`;
                button.classList.add(label.type);
                button.addEventListener('click', () => {
                    updateMoney(label.money);
                });
                labelsContainer.appendChild(button);
            });
        });

    function updateMoney(amount) {
        currentMoney += amount;
        if (currentMoney > 200) {
            currentMoney = 200;
        }
        if (currentMoney < 0) {
            currentMoney = 0;
        }
        moneyElement.textContent = currentMoney;
    }
});