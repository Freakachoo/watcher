/**
 * Script, that went through mongoDB collection 'proxies',
 * take it, and tries to send GET request to https://yobit.net/api/3/ticker/*
 * (it choosing pair randomly from mongodb collection 'pairs')
 * Take only proxies that have 'inUse' value as false (to avoid too much requests
 * from same IP and avoid temporary blocking),
 *
 * And change proxy item depends on results:
 * 1. Successfully got JSON with ticker data - mark
 */

process.on('unhandledRejection', console.error)

const _ = require('lodash')
const ProxyLists = require('proxy-lists');

const {config} = require('../config/config')

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
				if (err) return console.error('=========== ERROR ON PROXY SAVE', err);
				i++
				console.log('-- saved', res.ipAddress)
			})
		})
		console.log('++++++', typeof data)
	})

	gettingProxies.on('error', (err) => console.error('------', err))

	gettingProxies.on('end', () => {
		// If Scanning proxies is done - run the process again after some timeout
		setTimeout( () => run_watcher(), config.proxyGetterTimeout)
		console.log('++++++++ Adding Proxies Is Done. New proxies added:', i)
	})
}

run_watcher()
