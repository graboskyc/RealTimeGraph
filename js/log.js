// will log data in console
function Log(msg, code) {
	// msg to log
	// log level to display msg
	
	enabled = false;		// global logging enabled
	logLevel = 4;			// 10 is most verbose, lower for less verbosity

	if(enabled && (code <= logLevel)) {
		console.log(new Date().getTime() + " -- ");
		console.log(msg);
	}
}