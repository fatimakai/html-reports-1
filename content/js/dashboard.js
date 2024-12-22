/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7725, 5000, 10000, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 5000, 10000, "Create_Order-0"], "isController": false}, {"data": [1.0, 5000, 10000, "Create_Order-1"], "isController": false}, {"data": [0.0, 5000, 10000, "Create_Patient"], "isController": false}, {"data": [1.0, 5000, 10000, "Login"], "isController": false}, {"data": [1.0, 5000, 10000, "Login-0"], "isController": false}, {"data": [0.0, 5000, 10000, "Create_Patient-1"], "isController": false}, {"data": [1.0, 5000, 10000, "Login-1"], "isController": false}, {"data": [1.0, 5000, 10000, "Create_Order"], "isController": false}, {"data": [1.0, 5000, 10000, "Login-2"], "isController": false}, {"data": [0.725, 5000, 10000, "Create_Patient-0"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 200, 0, 0.0, 5968.915000000002, 154, 29104, 955.0, 23240.1, 28548.649999999994, 28953.31, 6.399385658976739, 88.67617458723963, 22.02588551499056], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Create_Order-0", 20, 0, 0.0, 917.65, 618, 2588, 735.0, 2099.800000000002, 2568.1499999999996, 2588.0, 2.703433360367667, 2.5480651442957556, 31.325638052514194], "isController": false}, {"data": ["Create_Order-1", 20, 0, 0.0, 351.45000000000005, 289, 650, 332.0, 394.70000000000005, 637.3499999999998, 650.0, 3.114779629341224, 2.8679394272698957, 2.132285664226756], "isController": false}, {"data": ["Create_Patient", 20, 0, 0.0, 27445.850000000002, 22577, 29104, 28356.5, 28947.1, 29096.5, 29104.0, 0.6806656910458428, 42.07268419451724, 2.129705899244461], "isController": false}, {"data": ["Login", 20, 0, 0.0, 1130.1999999999998, 931, 2000, 1075.0, 1377.3000000000004, 1969.6499999999996, 2000.0, 9.765625, 54.790496826171875, 17.66204833984375], "isController": false}, {"data": ["Login-0", 20, 0, 0.0, 600.4, 503, 755, 586.5, 732.5, 753.9499999999999, 755.0, 26.281208935611037, 18.95763181668857, 16.887729960578188], "isController": false}, {"data": ["Create_Patient-1", 20, 0, 0.0, 22287.4, 19188, 23334, 22713.0, 23240.1, 23329.35, 23334.0, 0.7686395080707148, 46.9649623486741, 0.46538720215219065], "isController": false}, {"data": ["Login-1", 20, 0, 0.0, 298.65, 154, 1255, 238.5, 365.9000000000001, 1210.7499999999993, 1255.0, 15.232292460015232, 10.54285867288652, 8.895420792079209], "isController": false}, {"data": ["Create_Order", 20, 0, 0.0, 1269.2999999999997, 908, 2914, 1068.5, 2497.800000000001, 2896.35, 2914.0, 2.5974025974025974, 4.839691558441558, 31.8751268262987], "isController": false}, {"data": ["Login-2", 20, 0, 0.0, 230.8, 182, 299, 223.5, 271.0, 297.59999999999997, 299.0, 14.749262536873156, 61.903691924778755, 8.584531710914455], "isController": false}, {"data": ["Create_Patient-0", 20, 0, 0.0, 5157.450000000001, 3360, 6687, 5443.5, 6537.9, 6679.65, 6687.0, 2.796029637914162, 1.9842526737033415, 7.055469514539355], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 200, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
