//////////////////////////////////////////////////////////////////////////////////////////////
// Name:            Graph.js
// Desc:            Uses highcharts to generate graph from CSV files created in CS Portal
// Author:          Chris Grabosky (chris.g@qualisystems.com)
// Created:         2015-09-01
// Last Editor:     Chris Grabosky (chris.g@qualisystems.com)
// Last Edit:       2015-10-21 12:58 eastern
// Last Change:     needed to convert xTitle to a float and disabled scrolling after new points added
// Last Change:     Re-enabled scrolling after 100, changed chart and axis titles
// Last Change:     Changed refresh timer to 1 sec rather than 2
//////////////////////////////////////////////////////////////////////////////////////////////

////////////////
// Global Vars
////////////////
var ctc_chart;                                              // make chart object global
var ctc_options;                                            // make chart options object global
var ctc_refreshTime = 2000;                                 // miliseconds between graph updates
var header = '';                                            // track header in case graph updates with new data between tests 

////////////////
// Functions
////////////////

// called by html page at runtime to build graph with initial data
function generateGraph(resID, container) {
    // resID                                                // Reservation ID
    // container                                            // div ID text string in HTML to build graph
    
    // build a basic graph with the datapoints in first CSV file
    var csvPath = "/Data/" + resID + "/STAT_FILE.txt?RES=" + resID + "&TS=" + new Date().getTime();
    
    var lineCount = 0;
    
    // do a http GET to pull the data and give it to highcharts to parse
    $.get(csvPath, function (csvdata) {
        Log(csvdata, 10);
        var csvdataArray = csvdata.split('\n');
        lineCount = csvdataArray.length;
        header = csvdataArray[0];
        
        ctc_options = {
            chart: {
                renderTo: container,                        // div on Graph.html page
                type: 'spline'                              // chart type (line)
            },
            data: {
                csv: csvdata                                // data from CSV HTTP GET
            },
            title: {
                text: 'Ixia CloudShell Test'                   // title on top of graph
            },
            tooltip: {
                enabled: false                              // turn off hovering over points with popup/tooltip
            },
            scrollbar: {
                enabled: true
            },
            legend: {
                enabled: true                              // use a legend but we will turn it off in code
            },
            plotOptions: {
                spline: {
                    marker: {
                        enabled: false                      // turn off points on each line
                    }
                }
            },
            series: [],                                     // need this so series[].addPoint works later
            yAxis: { 
		          min: 0 ,
                  title: {text: 'Kbps'}
	       }, 
            xAxis: { 
		          min: 0 ,
                  title: {text: 'Time'}
	       } 
        };
        
        // build the chart
        ctc_chart = new Highcharts.Chart(ctc_options);
        
        // call function on refresh time interval to update graph with new datapoints
        // we track number of lines in first load and ignore those for future updates
        setTimeout(function () { r_updateGraph(resID, container, lineCount) }, ctc_refreshTime);
        
        // build the nav on the left
        setTimeout(function () { indexGraph() }, 10);
        
        // hide legend
        ctc_chart.legend.display = false;
        ctc_chart.legend.group.hide();
        ctc_chart.reflow();
        
    }).fail(function() {
        // if log file or directory doesnt exist, put up big banner
        // refresh in 5 seconds in case reservation just started and data hasnt been written yet
        $('#'+container).html("<h1 style='font-size:80px; text-align:center; width:100%'><br><br>Data for this graph doesn't exist!</h1>");
        setTimeout(function() { location.reload(); }, 5000);
        $('#nav').hide();
    });

    Log('Initial graph built', 3);
}

// called by generateGraph, builds custom nav on the left
function indexGraph() {
    // find each series on the graph and build color coded nav on left
    $.each(ctc_chart.series, function (i, series) {
        // this mess creates legend, the color picker, enable/disable eye, and line thickness changer
        // i could break it out cleaner but every .append is a performance hit
        $('#listcontainer').append(" \
            <div class='ctc_series' id='series_li_" + i + "' data-visible='true' \
            data-id='"+ i + "' style='color:" + series.color + "' data-color='" + series.color + "'>" + series.name +
                "<div class='ctc_series_colordot' style='color:" + series.color + "' data-color='" + series.color + "' data-id='"+ i + "'> \
                    <i class='colordot' data-for='series_li_" + i + "' style='background-color:" + series.color + 
                    "; float:left;margin-left:10px;'></i> \
                </div> \
                <div style='float:left;'> \
                    <img src='img/eyeshow_black_32x32.png' height='16' width='16' onclick='toggleSeries(this)' data-id='"+ i + 
                    "' data-visible='true' style='margin-left:10px;' /> \
                </div>\
                <div style='float:left;'> \
                    <img src='img/slider_black_32x32.png' height='16' width='16' onclick='toggleThickness(this)' data-id='"+ i + 
                    "' data-thick='2' style='margin-left:10px;' /> \
                </div> \
             </div><br><br>");
    });

    // make it so you can click on the color dot/box and choose new colors
    $('.ctc_series_colordot').colorpicker('hide').on('changeColor', function (ev) {
        // change color of color dot
        $(this).children("i").css('background-color', ev.color.toHex());
        // change font color
        $(this).parent("div").css('color', ev.color.toHex());
        // change data tracking 
        $(this).attr("data-color", ev.color.toHex());
        $(this).parent("div").parent("div").attr("data-color", ev.color.toHex());
        $(this).parent("div").attr("data-color", ev.color.toHex());
        ctc_chart.series[$(this).attr("data-id") * 1].color = ev.color.toHex();
        // change actual color on graph
        ctc_chart.series[$(this).attr("data-id") * 1].graph.attr('stroke', ev.color.toHex());
    });
}

// called when you click the thickness slider on the nav to change thickness of line
function toggleThickness(e) {
    // toggle around in a circle/loop the possible thicknesses
    // custom thickness was too ugly of a ui 
    console.log($(e).parent('div').parent("div").attr("data-color"));
    if($(e).attr('data-thick')*1 == 2) {
        ctc_chart.series[$(e).attr('data-id') * 1].update({lineWidth:4, color:$(e).parent('div').parent("div").attr("data-color")});
        $(e).attr('data-thick',4);
    } else if($(e).attr('data-thick')*1 == 4) {
        ctc_chart.series[$(e).attr('data-id') * 1].update({lineWidth:8, color:$(e).parent('div').parent("div").attr("data-color")});
        $(e).attr('data-thick',8);
    } else if($(e).attr('data-thick')*1 == 8) {
        ctc_chart.series[$(e).attr('data-id') * 1].update({lineWidth:1, color:$(e).parent('div').parent("div").attr("data-color")});
        $(e).attr('data-thick',1);
    } else {
        ctc_chart.series[$(e).attr('data-id') * 1].update({lineWidth:2, color:$(e).parent('div').parent("div").attr("data-color")});
        $(e).attr('data-thick',2);
    }
}

// called when you click the eye in the nav to hide a line
function toggleSeries(e) {
    // toggle graph line
    ctc_chart.series[$(e).attr('data-id') * 1].setVisible(!$.parseJSON($(e).attr('data-visible')));
    
    // change icon between eye and crossed eye
    if($.parseJSON($(e).attr('data-visible'))) {
        $(e).attr('src','img/eyehide_black_32x32.png');
    } else {
        $(e).attr('src','img/eyeshow_black_32x32.png');
    }
    // update tracker so we know if it is now visible or hidden
    $(e).attr('data-visible', !$.parseJSON($(e).attr('data-visible')));
}

// !Recursive function!
// called by generateGraph initially then *recursive* to update graph with new datapoints
function r_updateGraph(resID, container, startrow) {
    // resID                                                // Reservation ID
    // container                                            // div ID text string in HTML to build graph
    // startrow                                             // line to start with in CSV file
    
    Log('Updating graph', 3);
    Log('Last line used was at start ' + startrow, 4);

    var csvPath = "/Data/" + resID + "/STAT_FILE.txt?RES=" + resID + "&TS=" + new Date().getTime();

    var lastLine = startrow;
    
    // do a http GET to pull the data and we will parse
    $.get(csvPath, function (data) {
        // expecting table seperated rows with \n, cols with ,
        // first col is date/time stamp, futures are all floats to be graphed
        
        // Split the lines
        var lines = data.split('\n');
        Log("Logging lines", 8);
        Log(lines, 8);
        
        // if headers do not match, we are running a new test without closing browser window so bail out
        if (header !== lines[0]) {
            location.reload();
        }

        // Iterate over the lines / rows
        $.each(lines, function (lineNo, line) {
        
            // ignore header or old/existing data
            if (lineNo > startrow * 1) {
                var items = line.split(',');
                Log("Logging items", 8);
                Log(items, 8);
                var xTitle = '';
                
                // iterate over each column 
                $.each(items, function (itemNo, item) {
                    if (itemNo == 0) {
                        // first column is date stamp / x value
                        xTitle = parseFloat(item);
                    } else {
                        // others are y values for each series
                        // add a point on the zero-indexed series (so subtract 1)
                        // takes in array of x value, y value (make sure y is a number, not string)
                        // bools are 'redraw after point is added' and 'should shift graph'
                        var shouldShift = false;
                        if(lineNo > 100) {
                            shouldShift = true;             // show only last 100 data points in live graph, refresh at end for all
                        }
                        ctc_chart.series[itemNo - 1].addPoint([xTitle, parseFloat(item)], true, false);
                        Log("adding itemNo " + itemNo + " for " + xTitle + " with value " + item, 9);
                    }
                });
            }
            
            // track last line added to graph to prevent adding duplicate data
            lastLine = lineNo;

        });
    });

    Log('Last line used was at end ' + lastLine, 3);
    
    // continually update
    setTimeout(function () { r_updateGraph(resID, container, lastLine) }, ctc_refreshTime);
}

// called by pressing expand/contract button to hide nav and resize graph
function toggleNav() {
    // could use .toggle but leaving it open in case we do other stuff later
    if($('#nav').is(":visible")) {
        $('#nav').hide();
        //ctc_chart.legend.display = true;
        //ctc_chart.legend.group.show();
    } else {
        $('#nav').show();
        //ctc_chart.legend.display = false;
        //ctc_chart.legend.group.hide();
    }
    // have to reflow, otherwise the graph shifts left and doesnt resize to be full screen
    // leaving a margin on the right
    ctc_chart.reflow();
}