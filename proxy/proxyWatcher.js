/**
 * Script, that is getting list of proxies with using of module
 * proxy-lists (which have many free proxies providers)
 * and puts it into mongoDB
 */

process.on('unhandledRejection', console.error)

const _ = require('lodash')
const ProxyLists = require('proxy-lists');

const config = require('../config/config')

const mongo = require('../initializers/mongo')
const mongoose = require('mongoose')
const Proxy = mongoose.model('Proxy')


const run_watcher = async () => {
	// Counter of new added proxies
	let i = 0
	const mongodb = await mongo()

	const gettingProxies = ProxyLists.getProxies(config.proxyOptions)
	gettingProxies.on('data', (data) => {
		if (_.isEmpty(data)) return

		data.forEach( proxy => {
			const proxyItem = new Proxy(proxy)
			proxyItem.save((err, res) => {
				if (err) return // console.error('=========== ERROR ON PROXY SAVE', err);
				i++
				// console.log('-- saved', res.ipAddress)
				process.stdout.write("+")
			})
		})
		// console.log('++++++', typeof data)
		process.stdout.write(".")
	})

	// gettingProxies.on('error', (err) => console.error('------', err))
	gettingProxies.on('error', (err) => process.stdout.write("^"))
	
	gettingProxies.on('end', () => {
		// If Scanning proxies is done - run the process again after some timeout
		setTimeout( () => run_watcher(), config.proxyGetterTimeout)
		console.log(' | New proxies added:', i)
		console.log()
	})
}

run_watcher()
