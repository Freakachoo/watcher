/**
 * Get data from Binance.com
 * 
 * TODO: Implement heart beat for WebSockets
 * Here is example of implementation:
 * https://www.npmjs.com/package/ws
 */
process.on('unhandledRejection', console.error)
const {to} = require('await-to-js')

const mongo = require('../initializers/mongo')
const mongoose = require('mongoose')
const Symbol = mongoose.model('Symbol')

const ws_heartbeat = require('../lib/ws_heartbeat')
const {collectTickers, collectBars} = require('../lib/watchLogic')
const {validateInterval, intervalToMs} = require('../lib/helperFunctions')

const binanceApi = require('binance')
const binanceWS = new binanceApi.BinanceWS(true)
const binanceRest = new binanceApi.BinanceRest({})

// List of pairs that has 
const pairsTickers = []

/**
 * Get symbols from Binance and put it to mongodb
 * Will work automatically, because BinanceRest has
 * timer interval
 */
const symbolsGetter = async () => {
	const [error, data] = await to(binanceRest.exchangeInfo())
	if (error) return console.error(error)
	// Save all received symbols to DB
	// If there is an error - just print it for now
	return Promise.all(
		data.symbols.map( s =>
			Symbol
				.findOneAndUpdate({symbol: s.symbol}, s, {upsert: true})
				.exec()
				.catch( console.error )
		)
	)
	.then( results => {
		console.log('Pairs Updated: ', new Date().toISOString())
		const newSymbols = results.filter( r => r === null).length
		if (newSymbols) console.log('New symbols added:', newSymbols)
		return
	})
}

const barCollector = async (symbol, interval) => {
	validateInterval(interval)

	const historyBars = await Symbol.find({symbol}).select({[`historyBars.${interval}`]: {'$slice':-1}, _id: 0}).exec()
	const lastCloseTime = historyBars[0].historyBars[0] && historyBars[0].historyBars[0][interval] && historyBars[0].historyBars[0][interval][0] ? historyBars[0].historyBars[0][interval][0]['closeTime'] : 0
	// // If last update was less than ~interval ago - no need to update it
	if (Date.now() - lastCloseTime < intervalToMs(interval)+10) {
		// console.log('No need to update symbol', symbol)
		return false
	}

	// console.log('Update symbol', symbol)
	const [error, data] = await to(binanceRest.klines({
		symbol,
		interval,
		limit: 50
	}))
	if (error) return console.error(error)
	if (data.length)
		await Symbol.update({symbol}, {[`historyBars.${interval}`]: data}).exec()
	return true
}

const barsCollector = async () => {
	const symbols = await Symbol.find({})
	return await Promise.all(symbols.map(s => barCollector(s.symbol, '15m')))
		.then( updated => updated.filter(Boolean).length ? console.log('Pairs updated', updated.filter(Boolean).length) : console.log('No pairs updated'))
}

/**
 * Run WebSocket ticker watcher
 * 
 * @param {String} pair 
 */
const tickerRunner = (pair, cb) => {
	if (!pair) return console.error(`Pair "${pair}" is empty, cant run watcher`)
	if (pairsTickers.includes(pair)) return console.error(`Pair "${pair}" is already has WebSocket`)

	pairsTickers.push(pair)
	ws_heartbeat(binanceWS.onTicker(pair, cb), () => {
		pairsTickers.splice(pairsTickers.indexOf(pair), 1)
	})
}

/**
 * Run tickers for all pairs
 * Get pairs from MongoDB and run tickers for each of them.
 * Checks if ticker already exist (pairsTickers array) - skip running new ticker.
 * If it does not exist - run it.
 */
const tickersRunner = () => {
	Symbol.find({}).select({symbol: 1, _id: 0}).exec( (err, symbols) => {
		if (err) return console.error(err)
		const filteredSymbols = symbols
			.map(s => s.symbol)
			.filter(s => !pairsTickers.includes(s))
		filteredSymbols.forEach(s => {
			tickerRunner(s, collectTickers )
		})
		process.stdout.write(filteredSymbols.length ? `-${filteredSymbols.length}-` : '.')
	})
}


module.exports = {
	getter: () => {
		console.log('Symbols getter run.')
		symbolsGetter()
		setInterval( () => {
			symbolsGetter()
		// Run symbols updater once in 20 minutes i think would be enough
		}, 1000*60*20)
	},
	collector: () => {
		console.log('Data collector run.')
		tickersRunner()
		setInterval( () => {
			tickersRunner()
		// If case there might be disconnected tickers i setup it to check every 10 seconds
		}, 1000*10)
	},
	barsCollector
}


 /** =============== RUN APP ==================== **/
// mongo()
// .then( symbolsGetter )
// .then( () => {
// 	tickerRunner('LTCBTC', () => {
// 		console.log('------ 1')
// 	})
// })


// setInterval( () => {
// 	console.log('---- tick ----')
// 	tickersRunner()
// }, 3000)


// Setup pairs updater
// setInterval( async () => {
// 	await symbolsGetter()
// 	tickersRunner()
// }, 5000)