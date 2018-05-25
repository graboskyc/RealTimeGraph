======================
IIS Instance
======================
* right now there is an IIS instance on port 80 that handles welcome/landing page (index.html), embeded page for instructions (embed.html), and graphs (Graph.html)
* CloudShell Portal is using IIS express port 8888 and is linked off index.html
* root directory for this is C:\inetpub\wwwroot

======================
Instructions Embed
======================
* embed.html in wwwroot is a basic html page using bootstrap markup
* The javascript will dynamically switch images and is straight forward
* to use it, open environment in cloudshell portal
* go to properties
* In instructions panel in cloudshell, go to code view
* pase in the following:

	<iframe width="100%" height="100%" src="http://63.97.44.20/embed.html" border="0" frameborder="0" style="overflow-x:hidden;"></iframe>

======================
Portal Upgrades
======================
* The only file changed is C:\Program Files (x86)\QualiSystems\CloudShell\Portal\Areas\RM\Views\TopologyDiagram\_WorkspaceToolbar.cshtml
* to add a graph button to the toolbar, add the following code before closing } in the @if (Model.IsReservation()) statement 
	<span class="action-btn">
    	<button class="btn-icon btn-toggle"  value="Open Window" onclick="window.open('http://63.97.44.20/Graph.html?RES=@res.Id')">
    		<img src="http://63.97.44.20/img/diagram_window_graph.PNG" alt="submit" />
    	</button>
    </span>
	
* add the following code on that same file to set default zoom mode to zoomed out and make the instructions panel massive. on the second to last line, right after </div> and before the } put:
	<script type="text/javascript">$(function() { 
		setTimeout(function() {
			$('.zoom-levels').children('div:first').children('span:first').children('button').click(); 
			$('#diagramLeftPanel').width('60%');
			$('#diagramLeftPanel').children('div').width('100%');
		}, 2000)});
	</script>
	
======================
Welcome Page
======================
* In wwwroot, edit index.html
* Right now it points to cloudshell, cloudshell help, and video in the center goes nowhere. Basic HTML here and bootstrap markup so it can change easily

======================
Graph
======================
* located in wwwroot/Graph.html
* uses highcharts to generate graph
* all javascript includes are in js subfolder, all stylesheets are in css sub folder, all images uses are in img subfolder
* Markup is in Graph.html then all code to make it work is in js/Graph.js
* recursive functions are prefaced with r_
* Data being graphed is in Data/{reservationID} subfolder
	* initial load for graph is the STAT_FILE.txt
	* we track number of lines in STAT_FILE on first run thru then send that number into r_updateGraph which ignores all lines before that number, apennding later lines to graph
* Graph.js is very well commented to make it obvious what it does
* If you change Graph.js, please update the header information
* future improvements if performance is bad is that right now it reads the entire txt file every 2 seconds and ignores the first x rows 
	* it knows x since that is how many rows it read previously
	* move this logic into server side code to just send the remaining lines since last call to less to parse clientside
	
======================
NoCopy
======================
* directory does not need to be copied to the server.
* contains source image files and Paint.NET authoring projects for some of the icons and banners