/**
 * Helper functions to send requests.
 * Implements sending requests through proxy, 
 * if one was passed as a parameter.
 * 
 * TODO: add support for socks proxies.
 * May use modules:
 * https://github.com/mattcg/socks5-http-client
 * https://github.com/mattcg/socks5-https-client
 */
const _ = require('lodash')
const request = require('request')
const HttpsProxyAgent = require('https-proxy-agent');
const HttpProxyAgent = require('http-proxy-agent');

const config = require('../config/config')
/**
 * Send request with using of proxy if passed
 * 
 * @param  {Object} requestOptions - expected {uri: 'url'}
 * @param  {Object} proxy - Object with proxy options. See ../model/proxy
 * @returns {Promise} - with result body as value, or error
 */
module.exports = sendRequest = (requestOptions, proxy) => {
	// Create proxy agent
	const addAgent = {}
	if (proxy) {
		addAgent.agent = new HttpsProxyAgent(`${proxy.protocols[0]}://${proxy.ipAddress}:${proxy.port}`)
		// // TODO: for socks somehow need to rebuild
		// if (proxy.protocols.includes('https')) {
		// 	addAgent.agent = new HttpsProxyAgent(`https://${proxy.ipAddress}:${proxy.port}`)
		// } else {
		// 	addAgent.agent = new HttpProxyAgent(`http://${proxy.ipAddress}:${proxy.port}`)
		// }
	}
	// console.log('====', requestOptions.uri)
	const agent = new HttpsProxyAgent(proxy.ipAddress)
	return new Promise( (resolve, reject) => {
		request.get({
			uri: requestOptions.uri,
			gzip: true,
			...addAgent,
			followRedirect: true,
			maxRedirects: 10,
		}, (error, response, body) => {
			if (error) {
				// console.log('************************** ERROR', agent.proxy.href, error)
				return reject(error)
			}
			resolve(body)
		})
	})
}
