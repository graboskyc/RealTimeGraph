//////////////////////////////////////////////////////////////////////////////////////////////
// Name:            Table.js
// Desc:            Uses boostrap to generate table from CSV files created in CS Portal
// Author:          Chris Grabosky (chris.g@qualisystems.com)
// Created:         2015-09-09
// Last Editor:     Chris Grabosky (chris.g@qualisystems.com)
// Last Edit:       2015-10-21 12:58 eastern
// Last Change:     Added fail handler on get method
// Last Change:     Changed refresh timer to 1 sec rather than 2
//////////////////////////////////////////////////////////////////////////////////////////////

////////////////
// Global Vars
////////////////
var ctc_refreshTime = 2000;                                 // miliseconds between graph updates
var header = '';                                            // track header in case graph updates with new data between tests 

////////////////
// Functions
////////////////

// !Recursive function!
// called by generateGraph initially then *recursive* to update graph with new datapoints
function r_updateTable(resID, container, startrow) {
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

        // Iterate over the lines / rows
        $.each(lines, function (lineNo, line) {
        
            // ignore old/existing data
            if ((lineNo > startrow * 1) || (header == "")) {
                var items = line.split(',');
                Log("Logging items", 8);
                Log(items, 8);
                
                // where does this now go?
                var appendObj; 
                var cell = "";
                if(lineNo == 0) {
                    appendObj = $("#"+container).children("thead");
                    cell = "th";
                    header = lines[0];
                } else {
                    appendObj = $("#"+container).children("tbody");
                    cell = "td"; 
                }
                
                appendObj.append("<tr>");
                
                // iterate over each column 
                $.each(items, function (itemNo, item) {
                    appendObj.append("<"+cell+">"+item+"</"+cell+">");
                });
                appendObj.append("</tr>");
            }
            
            // track last line added to graph to prevent adding duplicate data
            lastLine = lineNo;

        });
        
        // if headers do not match, we are running a new test without closing browser window so bail out
        if (header !== lines[0]) {
            location.reload();
        }
    }).fail(function() {
        // if log file or directory doesnt exist, put up big banner
        // refresh in 5 seconds in case reservation just started and data hasnt been written yet
        setTimeout(function() { location.reload(); }, 5000);
        alert("Data for this graph doesn't exist!");
    });

    Log('Last line used was at end ' + lastLine, 3);
    
    // continually update
    setTimeout(function () { r_updateTable(resID, container, lastLine) }, ctc_refreshTime);
}