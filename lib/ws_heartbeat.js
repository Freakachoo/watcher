/**
 * WebSockets heartbeat implementation
 * If connection is not alive - call callback
 */

/**
 * @param {Object} wsc - WebSocket Client
 * @param {Function} callback - function to run on disconnection
 */
module.exports = (wsc, callback) => {

	const noop = () => {}
	 
	function heartbeat() {
		this.isAlive = true;
	}
	 
	wsc.on('open', (ws) => {
		wsc.isAlive = true
		wsc.on('pong', heartbeat)
	})
	 
	wsc.on('error', (ws) => {
		console.log('ERROR ON OPEN WS', wsc.url)
		callback()
		wsc.terminate()
	})
	 
	const interval = setInterval(function ping() {
		if (wsc.isAlive === false) {
			callback()
			clearInterval(interval)
			return wsc.terminate()
		}
		
		wsc.isAlive = false
		// In case internet connection lost. Because ping is throwing error
		// But no need to stop app, keep trying to connect
		try {
			wsc.ping(noop)
		} catch (error) {
			console.log(error)
		}
	}, 5000);
}