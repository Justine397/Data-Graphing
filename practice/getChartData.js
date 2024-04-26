const WebSocket = require('ws');
const mysql = require('mysql');

const wss = new WebSocket.Server({ port: 8080 });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sensor_db1'
});

let previousData = [];

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

wss.on('connection', function connection(ws) {
  console.log('Client connected');

  const fetchData = () => {
    const sql = "SELECT No, EquipmentNo, parameter, value, ucl, lcl, unit, DATE_FORMAT(datetime, '%m/%d/%Y %H:%i:%s') AS datetime FROM dht11 ORDER BY `No`";

    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return;
      }
      const currentData = results.map(row => ({
        label: row.EquipmentNo,
        parameter: row.parameter,
        value: row.value,
        ucl: row.ucl,
        lcl: row.lcl,
        datetime: row.datetime
      }));

      if (!isEqual(currentData, previousData)) {
        ws.send(JSON.stringify(currentData));
        previousData = currentData;
      }
    });
  };

  fetchData();
  const fetchDataInterval = setInterval(fetchData, 1000);

  ws.on('close', function () {
    console.log('Client disconnected');
    clearInterval(fetchDataInterval);
  });
});

function isEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) return false;
  }
  return true;
}