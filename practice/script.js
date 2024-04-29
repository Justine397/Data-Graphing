var myChart;
var ws;

function EnableParameter(){
    document.getElementById("disabledParameter").classList.remove("disabled");
}

function initializeWebSocket(){
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = function(event) {
        console.log('WebSocket connection Open');
    };

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        populateDropdown(data);
        console.log('Data received');
    };
}

function renderChart(data, parameter) {
    if (!Array.isArray(data)) {
        console.error('Data received is not an array:', data);
        return;
    }

    const filteredData = data.filter(item => item.parameter === parameter);

    const latestEntry = filteredData[filteredData.length - 1];

    const label = latestEntry.datetime;
    const value = latestEntry.value;
    const ucl = latestEntry.ucl;
    const lcl = latestEntry.lcl;
    const unit = latestEntry.unit;

    myChart.data.labels.push(label);
    myChart.data.datasets[0].label = parameter + ' ('+ value +''+ unit +')';
    myChart.data.datasets[1].label = 'ucl ' + '('+ ucl +' '+ unit +')';
    myChart.data.datasets[2].label = 'lcl ' + '('+ lcl +' '+ unit +')';

    myChart.data.datasets[0].data.push(value);
    myChart.data.datasets[1].data.push(ucl);
    myChart.data.datasets[2].data.push(lcl); 

    const dataLimit = 10;

    if (myChart.data.labels.length > dataLimit) {
        myChart.data.labels.shift();
        myChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    myChart.options.scales.x.min = myChart.data.labels[0];

    myChart.update();
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
        
        link.onclick = function() {
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
        const listItem = document.createElement('li');
        const link = document.createElement('a');   
        link.classList.add('dropdown-item');
        link.href = '#';
        link.textContent = parameter;

        link.onclick = function() {
            document.getElementById('disabledParameter').innerHTML = parameter;
            console.log('Parameter Selected');
        };

        listItem.appendChild(link);
        parameterDropdown.appendChild(listItem);
    });

    document.getElementById('monitorButton').addEventListener('click', function() {
        const selectedParameter = document.getElementById('disabledParameter').innerHTML;
        resetChart();
        renderChart(data, selectedParameter);

        ws.onmessage = function(event) {
            const newData = JSON.parse(event.data); 
            renderChart(newData, selectedParameter); 
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
        datasets: [
            {
                label: [],
                data: [],
                backgroundColor: 'black',
                borderColor: '#575656',
                tension: 0.1
            },
            {
                label: [],
                data: [],
                backgroundColor: 'rgba(255, 82, 82, 0.5)',
                borderColor: '#FF5252',
                pointRadius: 0,
                borderDash: [],
                tension: 0.1,
                animation: { 
                    duration: 0 
                }
            },
            {
                label: [],
                data: [],
                backgroundColor: 'rgba(82, 82, 255, 0.5)',
                borderColor: '#4141FF',
                pointRadius: 0,
                tension: 0.1,
                animation: { 
                    duration: 0 
                }
            }
        ]
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

function resetChart(){
    myChart.data.labels = [];
    myChart.data.datasets[0].label = [];
    myChart.data.datasets[1].label = [];
    myChart.data.datasets[2].label = [];

    myChart.data.datasets[0].data = [];
    myChart.data.datasets[1].data = [];
    myChart.data.datasets[2].data = [];

    myChart.update();
}

document.getElementById('clearButton').addEventListener('click', () => {
    resetChart();
    document.getElementById('disabledParameter').innerHTML = 'Parameters';
    
    console.log('Chart Cleared');
});

document.getElementById('equipmentSelect').addEventListener('click', () => {
    console.log('Fetching Data ...');
});

initializeWebSocket();