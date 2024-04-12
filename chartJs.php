<?php
$servername = "localhost";
$username = "root";
$password = "";
$database = "sensor_db";

$conn = new mysqli($servername, $username, $password, $database);

$sql = "SELECT  No, `EquipmentNo`, `parameter`, value, `ucl`, `lcl`, `unit`, datetime, status FROM dht11";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $data = array();
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
} else {
    echo "No data found";
}

$labels = array();    
$equipmentNos = array();   
$parameters = array();   
$values = array();   
$ucls = array();
$lcls = array();
$units = array();
$datetime = array(); 
$status = array();

foreach ($data as $row) {
    $labels[] = $row['No']; 
    $equipmentNos[] = $row['EquipmentNo']; 
    $parameters[] = $row['parameter'];
    $values[] = $row['value'];  
    $ucls[] = $row['ucl'];
    $lcls[] = $row['lcl'];
    $units[] = $row['unit'];
    $datetime[] =  $row['datetime'];
    $status[] = $row['status'];
}
    

$chart_data = array(
    "labels" => $datetime,
    "datasets" => array(
        array(
            "label" => "Parameter Value",
            "data" => $values,
            "borderColor" => "rgba(255, 99, 132, 1)",
            "backgroundColor" => "rgba(255, 99, 132, 0.2)"
        )
    )
);

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chart Display</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

</head>
<body>    
    <div class="row m-5">
        <div class="col-2 border border-2 p-2 border-secondary">
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Control No.
                </button>
                <ul class="dropdown-menu" id="equipmentDropdown">
                    <?php
                        $uniqueEquipmentNos = array_unique($equipmentNos);
                        foreach ($uniqueEquipmentNos as $equipmentNo) {
                            echo "<li><a class='dropdown-item' href='#' onclick=displayChart()>$equipmentNo</a></li>";
                        }
                    ?>
                </ul>
            </div>
        </div>
        <div class="col-10 border border-2 p-5 border-secondary"> 
        <canvas id="myChart"  height="400px"></canvas>
        </div>
    </div>
    <script>

    function displayChart(){
        var chartData = <?php echo json_encode($chart_data); ?>;
        var ctx = document.getElementById('myChart').getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'line', 
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Value'
                        }
                    }]
                }
            }
        });
    }

    </script>
</body>
</html>
