process.on('unhandledRejection', console.error)

const _ = require('lodash')
const ProxyLists = require('proxy-lists');

const {config} = require('../config/config')

const mongo = require('../initializers/mongo')
const mongoose = require('mongoose')
const Proxy = mongoose.model('Proxy')


const run_watcher = async () => {
	const mongodb = await mongo()

	const gettingProxies = ProxyLists.getProxies(config.proxyOptions)
	gettingProxies.on('data', (data) => {
		if (_.isEmpty(data)) return

		data.forEach( proxy => {
			const proxyItem = new Proxy(proxy)
			proxyItem.save((err, res) => {
				if (err) return console.error('=========== ERROR ON PROXY SAVE', err);
				console.log('-- saved', res.ipAddress)
			})
		})
		console.log('++++++', typeof data)
	})

	gettingProxies.on('error', (err) => console.error('------', err))

	gettingProxies.on('end', () => {
		// If Scanning proxies is done - run the process again after some timeout
		setTimeout( () => run_watcher(), config.proxyGetterTimeout)
		console.log('++++++++ Proxies Done')
	})
}

run_watcher()
