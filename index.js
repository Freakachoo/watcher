process.on('unhandledRejection', console.error)

const tor = require('tor-request')
var ProxyLists = require('proxy-lists');
const request = require('request')
var HttpsProxyAgent = require('https-proxy-agent');
const _ = require('lodash')
const {to} = require('await-to-js')
const {proxiesList} = require('./proxiesList')

const chunksAndProxies = []
const pairsList = [
	['BTC', 'USD']
]
const pairsInfo = {}

const getConfig = () => {
	return {
		// Server responses are cashed every 2 seconds that is why there is no sense in making requests faster.
		watchTimeout: 3000,
		APIOptions: {
			uri: 'https://yobit.net/api/3/',
			gzip: true
		}
	}
}

const Times = {
	TwentyMinutes: Math.round(20 * 60 / (getConfig().watchTimeout / 1000)),
	HalfMinute: Math.round(0.5 * 60 / (getConfig().watchTimeout / 1000)),
	TenSeconds: Math.round(10 / (getConfig().watchTimeout / 1000))
}

const deviationPriceFilter = 50
const deviationVolumeFilter = 10


/**
 * Return list of available pairs
 * @param {String} filter - filter by second currency
 */
const getPairsList = (filter) =>
	filter ? pairsList.filter( p => p[1] === filter) : pairsList


// const proxy = 'http://144.76.176.72:8080'
// const proxy = 'http://112.124.50.85:1080'
// const agent = new HttpsProxyAgent(proxy)

const sendRequest = (overrideOptions, agent) => {
	const removeProxy = (href) => {
		const index = proxiesList.indexOf(href)
		if (index !== -1) {
			proxiesList.splice(index, 1);
		}
	}
	if (!agent.proxy) console.log(agent)
	console.log('agent: ', agent.proxy.href);
	const query = overrideOptions.pairs ? ('/' + overrideOptions.pairs.map( p => `${p[0]}_${p[1]}`.toLowerCase()).join('-')) : ''
	const uri = `${getConfig().APIOptions.uri}${overrideOptions.path}${query}`
	console.log('uri: ', uri);
	return new Promise( (resolve, reject) => {
		request.get({
			...getConfig().APIOptions,
			uri,
			agent,
			followRedirect: true,
			maxRedirects: 10,
		}, (error, response, body) => {
			// console.log('error, response, body: ', error, response, body);
			if (error) {
				console.log('************************** ERROR', agent.proxy.href, error)
				removeProxy(agent.proxy.href)
				return resolve({error, href: agent.proxy.href})
			}
			try {
				console.log('S', agent.proxy.href)
				resolve(JSON.parse(body))
			} catch (err) {
				if(body.indexOf('CAPTCHA')) {
					console.log('************************** CAPTCHA', agent.proxy.href)
					removeProxy(agent.proxy.href)
					return resolve({href: agent.proxy.href})
					// process.exit()
				}
				resolve({body, href: agent.proxy.href})
			}
		})
	})
}

const getAllPairsInfo = () => sendRequest({path: 'info'})

const getTickers = (pairs, agent) => sendRequest({path: 'ticker', pairs}, agent)

const addTrimStack = (element, arr, timesLabel) => arr.concat(element).slice(1, Times[timesLabel])
const arraySum = (arr) => arr.filter(Boolean).reduce( (s, e) => s+e, 0)
const arrayAvg = (arr) => arraySum(arr) / arr.filter(Boolean).length
const calcDeviation = (current, avg) => 100*(current-avg)/avg
var i = 0

const runWatcher = (pairs) => {
	setInterval( async () => {
		// const [error, pairsTickers] = await to(getTickers(getPairsList()))
		// const [error, pairsTickers] = await to(getTickers(pairs))
		const [error, pairsTickers] = await to(Promise.all(
			_.chunk(pairs, 60).map( ch => getTickers(ch) )
		).then( res => res.reduce( (acc, el) => Object.assign(acc, el) ,{})))

		// console.log('pairs: ', pairs);
		// console.log('pairsTickers: ', pairsTickers);
		if (error) return console.error(error)
		i++
		console.log('.', i)
		Object.keys(pairsTickers).forEach( pt => {
			const {updated, avg, vol} = pairsTickers[pt]
			if (!pairsInfo[pt])
				pairsInfo[pt] = {
					lastTickerTime: updated,
					avgUpdateTime: 0,
					updatesCounter: 0,
					lastTenUpdateTimes: Array(10),
					lastFiveUpdateTimes: Array(5),
					lastTwentyMinutesAvgPrice: Array(Times['TwentyMinutes']),
					lastHalfMinuteAvgPrice: Array(Times['HalfMinute']),
					lastTenSecondsAvgPrice: Array(Times['TenSeconds']),
					lastTwentyMinutesVolume: Array(Times['TwentyMinutes']),
					lastHalfMinuteVolume: Array(Times['HalfMinute']),
					lastTenSecondsVolume: Array(Times['TenSeconds']),
				}

			const {lastTickerTime, avgUpdateTime, updatesCounter} = pairsInfo[pt]

			let consoleInfo = ''
			pairsInfo[pt]['lastTickerTime'] = updated
			let deviationAlert = false
			Object.keys(Times).forEach( timesLabel => {
				pairsInfo[pt][`last${timesLabel}AvgPrice`] = addTrimStack(avg, pairsInfo[pt][`last${timesLabel}AvgPrice`], timesLabel)
				pairsInfo[pt][`last${timesLabel}Volume`] = addTrimStack(vol, pairsInfo[pt][`last${timesLabel}Volume`], timesLabel)

				// Get only deviation in percentage
				// consoleInfo += `${timesLabel}: ${arrayAvg(pairsInfo[pt][`last${timesLabel}AvgPrice`])}, ${arrayAvg(pairsInfo[pt][`last${timesLabel}Volume`])} \n`
				const avgAvgPrice = arrayAvg(pairsInfo[pt][`last${timesLabel}AvgPrice`])
				const avgPriceDeviation = calcDeviation(avg, avgAvgPrice).toFixed(2)
				const avgVolume = arrayAvg(pairsInfo[pt][`last${timesLabel}Volume`])
				const avgVolumeDeviation = calcDeviation(vol, avgVolume).toFixed(2)
				// console.log('avgVolumeDeviation: ', avgVolumeDeviation);
				if (Math.abs(avgPriceDeviation) >= Math.abs(deviationPriceFilter) || Math.abs(avgVolumeDeviation) >= Math.abs(deviationVolumeFilter)) deviationAlert = true
				consoleInfo += `${timesLabel}: price ${avgAvgPrice} ${avgPriceDeviation}%, vol: ${avgVolume} ${avgVolumeDeviation}% \n`
			})

			if (deviationAlert) {
				console.log('=========================', pt, i)
				console.log(consoleInfo)
			}
		})
	}, getConfig().watchTimeout)

}

// const testProxies = () => {
// 	Promise.all(proxiesList.filter(Boolean).map( p => getTickers([['ltc', 'btc']], new HttpsProxyAgent(p))))
// 	.then( res => {
// 		console.log('----------------------')
// 		console.log(proxiesList)
// 	})
// 	.catch( error => {
// 		console.log('+++++++++++++++++++++++++++')
// 		console.log(error)
// 	})
// }
// testProxies()
// getAllPairsInfo()
// .then( allPairs => {
// 	const onlyETH = Object.keys(allPairs['pairs']).filter( pl => pl.indexOf('_eth') > 0).map( pl => pl.split('_'))
// 	chunksAndProxies = chunksAndProxies.concat(
// 		_.chunk(onlyETH, 60).map( c => ({
// 			proxy: proxiesList.pop(),
// 			pairs: c
// 		}))
// 	)
// 	runWatcher(onlyETH.slice(0, 1))
// 	// console.log('onlyETH: ', onlyETH);
// 	// console.log(allPairs['pairs']['ltc_eth'])
// 	// console.log(allPairs['server_time'])
// 	// console.log(Math.round(new Date().getTime()/1000))
// })

// const proxyOptions = {
// 	protocols: ['http', 'https'],
// 	countries: ['de', 'us', 'uk', 'ru']
// }
// const gettingProxies = ProxyLists.getProxies(proxyOptions)

// gettingProxies.on('data', console.log)
// gettingProxies.on('error', console.error)
// gettingProxies.on('end', () => {
// 	console.log('++++++++ Proxies Done')
// })

/**
 * pairsInfo
 *
 * lastTickerTime
 * avgUpdateTime
 * updatesCounter
 * lastTenUpdateTimes
 * lastFiveUpdateTimes
 *
 * lastTwentyMinutesAvgPrice
 * lastHalfMinuteAvgPrice
 * lastTenSecondsAvgPrice
 * lastTwentyMinutesVolume
 * lastHalfMinuteVolume
 * lastTenSecondsVolume
 */

// const get
