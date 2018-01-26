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
	const [error, symbols] = await to(binanceRest.exchangeInfo())
	if (error) return console.error(error)
	console.log('InfoUpdate')
	// Save all received symbols to DB
	// If there is an error - just print it for now
	// TODO: make it somehow with Promises, but don't stop on errors... or stop... don't know... ok maybe stop
	data.symbols
	.forEach( s => Symbol.findOneAndUpdate({symbol: s.symbol}, s, {upsert: true}, (err, res) => {
		if (err) return console.error(err)
	}))
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
		symbols
		.map(s => s.symbol)
		.filter(s => !pairsTickers.includes(s))
		.forEach(s => {
			tickerRunner(s, () => {
				console.log('---- WS -----', s)
			})
		})
	})
}

mongo()
// .then( symbolsGetter )
// .then( () => {
// 	tickerRunner('LTCBTC', () => {
// 		console.log('------ 1')
// 	})
// })


setInterval( () => {
	console.log('---- tick ----')
	tickersRunner()
}, 3000)


// Setup pairs updater
// setInterval( () => {
// 	symbolsGetter()
// tickersRunner()
// }, 15000)