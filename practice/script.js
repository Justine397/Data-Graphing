let myChart;
let ws;
let initialRender = true;

function EnableParameter() {
    document.getElementById("disabledParameter").classList.remove("disabled");
}

function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => console.log('WebSocket connection Open');
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        populateDropdown(data);
        console.log('Data received');
    };
}

function renderChart(data, parameters) {
    if (!Array.isArray(data)) {
        console.error('Data received is not an array:', data);
        return;
    }

    if (initialRender) {
        myChart.data.labels = [];
        myChart.data.datasets = [];
    }

    const uniqueLabels = new Set();

    parameters.forEach(parameter => {
        const filteredData = data.filter(item => item.parameter === parameter);
        const latestData = filteredData[filteredData.length - 1];

        if (latestData) {
            if (initialRender || !datasetExists(parameter)) {
                addDataset(parameter, latestData);
            }

            const parameterIndex = findDatasetIndex(parameter);
            const uclIndex = findDatasetIndex('UCL', parameterIndex);
            const lclIndex = findDatasetIndex('LCL', parameterIndex);

            pushData(parameterIndex, latestData.value);
            pushData(uclIndex, latestData.ucl);
            pushData(lclIndex, latestData.lcl);

            uniqueLabels.add(latestData.datetime);
        }
    });

    uniqueLabels.forEach(label => {
        if (!myChart.data.labels.includes(label)) {
            myChart.data.labels.push(label);
        }
    });

    while (myChart.data.labels.length > 10) {
        myChart.data.labels.shift();
        myChart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    initialRender = false;
    myChart.update();
}

function addDataset(parameter, latestData) {
    myChart.data.datasets.push({
        label: `${parameter} (${latestData.value}${latestData.unit})`,
        data: [latestData.value],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
    });

    myChart.data.datasets.push({
        label: `UCL (${latestData.ucl}${latestData.unit})`,
        data: [latestData.ucl],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 0,
        borderDash: [2, 2],
        tension: 0.1,
        animation: { duration: 0 }
    });

    myChart.data.datasets.push({
        label: `LCL (${latestData.lcl}${latestData.unit})`,
        data: [latestData.lcl],
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        pointRadius: 0,
        borderDash: [2, 2],
        tension: 0.1,
        animation: { duration: 0 }
    });
}

function pushData(index, value) {
    myChart.data.datasets[index].data.push(value);
}

function datasetExists(parameter) {
    return myChart.data.datasets.some(dataset => dataset.label.startsWith(parameter));
}

function findDatasetIndex(parameter, startIndex = 0) {
    return myChart.data.datasets.findIndex((dataset, index) => index >= startIndex && dataset.label.startsWith(parameter));
}

function populateDropdown(data) {
    const equipmentDropdown = document.getElementById('equipmentDropdown');
    const parameterDropdown = document.getElementById('parameterDropdown');

    equipmentDropdown.innerHTML = '';
    parameterDropdown.innerHTML = '';

    const uniqueEquipmentNos = [...new Set(data.map(item => item.label))];
    const uniqueParameters = [...new Set(data.map(item => item.parameter))];

    uniqueEquipmentNos.forEach(equipmentNo => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.classList.add('dropdown-item');
        link.href = '#';
        link.textContent = equipmentNo;
        link.onclick = () => {
            document.getElementById('EquipmentName').innerHTML = equipmentNo;
            document.getElementById('equipmentSelect').innerHTML = equipmentNo;
            createEmptyLineGraph();
            EnableParameter();
            console.log('Equipment Selected');
        };
        listItem.appendChild(link);
        equipmentDropdown.appendChild(listItem);
    });

    uniqueParameters.forEach(parameter => {
        const checkboxItem = document.createElement('div');
        checkboxItem.classList.add('checkbox-item');
        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input');
        checkbox.classList.add('dropdown-checkbox');
        checkbox.type = 'checkbox';
        checkbox.value = parameter;
        checkbox.onclick = () => console.log('Parameter Selected');
        const label = document.createElement('label');
        label.classList.add('form-check-label');
        label.textContent = parameter;
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        parameterDropdown.appendChild(checkboxItem);
    });

    document.getElementById('monitorButton').addEventListener('click', function() {
        const selectedParameters = Array.from(document.querySelectorAll('#parameterDropdown input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        console.log('monitor');
        ws.onmessage = event => {
            const newData = JSON.parse(event.data);
            renderChart(newData, selectedParameters);
            console.log('New data received');
        };
    });
}

function createEmptyLineGraph() {
    if (myChart) {
        myChart.destroy();
    }
    var ctx = document.getElementById('myChart').getContext('2d');
    var emptyData = {
        labels: [],
        datasets: []
    };

    myChart = new Chart(ctx, {
        type: 'line',
        data: emptyData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: false,
                    grace: '10%',
                    suggestedMax: null,
                }
            }
        }
    });
}

function resetChart() {
    myChart.data.labels = [];
    myChart.data.datasets = [];
    myChart.update();
    document.getElementById('disabledParameter').innerHTML = 'Parameters';
    document.querySelectorAll('#parameterDropdown input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    console.log('Chart Cleared');
}

document.getElementById('clearButton').addEventListener('click', resetChart);

document.getElementById('equipmentSelect').addEventListener('click', () => console.log('Fetching Data ...'));

initializeWebSocket();