/**
 * Helper functions work with symbols data to detect deviations
 */
const mongoose = require('mongoose')
const Symbol = mongoose.model('Symbol')
const config = require('../config/config')
const moment = require('moment')

const {arraySum, arrayAvg, calcDeviation, validateInterval} = require('./helperFunctions')

const collectBars = (symbol, pairBars, interval) => {
	validateInterval(interval)
	Symbol.update(
		{symbol: symbol},
		{[`historyBars.${interval}`]: pairBars}
	)
	.exec()
	.catch( console.error )
}

/**
 * Collect data from ticker.
 * Save average price and values for:
 * 1. last 200 ticks
 * 2. 
 */
const collectTickers = pairInfo => {
	Symbol.update(
		{symbol: pairInfo.symbol},
		{ $push: {
			"statistics.lastAvgPrice": {
				$position: 0,
				$each: [Number(pairInfo.weightedAveragePrice)],
				$slice: config.statistics.lastPriceMax
			},
			"statistics.lastQuoteAssetVolume": {
				$position: 0,
				$each: [Number(pairInfo.quoteAssetVolume)],
				$slice: config.statistics.lastValueMax
			},
			"statistics.lastBaseAssetVolume": {
				$position: 0,
				$each: [Number(pairInfo.baseAssetVolume)],
				$slice: config.statistics.lastValueMax
			}
		}}
	)
	.exec()
	.catch( console.error )
}

const getPriceDeviations = pairInfo => {
	const deviationPeriods = [config.statistics.lastPriceMax, ...config.statistics.deviationPeriods]
	if (!pairInfo.statistics[0] || !pairInfo.statistics[0].lastAvgPrice) return deviationPeriods.reduce( (acc, dp) => Object.assign(acc, {dp: 0}), {})
	const lastAvgPrice = pairInfo.statistics[0].lastAvgPrice.map( Number )
	return deviationPeriods.reduce( (acc, dp) =>
		// Object.assign(acc, { [dp]: calcDeviation(lastAvgPrice[0], arrayAvg(lastAvgPrice.slice(0, dp-1))).toFixed(2) })
		Object.assign(acc, { [dp]: calcDeviation(arrayAvg(lastAvgPrice.slice(0, dp-1)), arrayAvg(lastAvgPrice.slice(0, config.statistics.lastPriceMax-1))).toFixed(2) })
	, {})
}

const getQuoteAssetVolumeDeviations = pairInfo => {
	const deviationPeriods = [config.statistics.lastValueMax, ...config.statistics.deviationPeriods]
	if (!pairInfo.statistics[0] || !pairInfo.statistics[0].lastQuoteAssetVolume) return deviationPeriods.reduce( (acc, dp) => Object.assign(acc, {dp: 0}), {})
	const lastQuoteAssetVolume = pairInfo.statistics[0].lastQuoteAssetVolume.map( Number )
	return deviationPeriods.reduce( (acc, dp) =>
		// Object.assign(acc, { [dp]: calcDeviation(lastAvgPrice[0], arrayAvg(lastAvgPrice.slice(0, dp-1))).toFixed(2) })
		Object.assign(acc, { [dp]: calcDeviation(arrayAvg(lastQuoteAssetVolume.slice(0, dp-1)), arrayAvg(lastQuoteAssetVolume.slice(0, config.statistics.lastValueMax-1))).toFixed(2) })
	, {})
}

const getBaseAssetVolumeDeviations = pairInfo => {
	const deviationPeriods = [config.statistics.lastValueMax, ...config.statistics.deviationPeriods]
	if (!pairInfo.statistics[0] || !pairInfo.statistics[0].lastBaseAssetVolume) return deviationPeriods.reduce( (acc, dp) => Object.assign(acc, {dp: 0}), {})
	const lastBaseAssetVolume = pairInfo.statistics[0].lastBaseAssetVolume.map( Number )
	return deviationPeriods.reduce( (acc, dp) =>
		// Object.assign(acc, { [dp]: calcDeviation(lastAvgPrice[0], arrayAvg(lastAvgPrice.slice(0, dp-1))).toFixed(2) })
		Object.assign(acc, { [dp]: calcDeviation(arrayAvg(lastBaseAssetVolume.slice(0, dp-1)), arrayAvg(lastBaseAssetVolume.slice(0, config.statistics.lastValueMax-1))).toFixed(2) })
	, {})
}

const analyzeBars = (symbol) => {
	if (!symbol.historyBars || !symbol.historyBars[0] || !symbol.historyBars[0]['15m']) return
	const historyBars = symbol.historyBars[0]['15m']
	const historyVolumes = historyBars.map( hb => parseFloat(hb.volume))
	const historyHighPrice = historyBars.map( hb => parseFloat(hb.high))
	// Calculate deviations of values
	const deviationIntervals = [50, 25, 15, 10, 5]
	const avgVolumeForIntervals = deviationIntervals.map( di => arrayAvg(historyVolumes.slice(-1*di)))
	const avgHighForIntervals = deviationIntervals.map( di => arrayAvg(historyHighPrice.slice(-1*di)))
	// Calculate deviations.
	// If any deviation more than filter - print it
	deviationIntervals.forEach( (interval, i) => {
		avgVolumeForIntervals.slice(0, i+1).forEach( (avgi, j) => {
			const deviationVolume = calcDeviation(avgVolumeForIntervals[i], avgi)
			const deviationHigh = calcDeviation(avgHighForIntervals[i], avgHighForIntervals[j])
			if (deviationHigh >= config.deviationFilterBars.price && deviationVolume >= config.deviationFilterBars.volume)
				console.log(`${symbol.symbol} | ${deviationIntervals[j]} - ${interval}: vol: ${deviationVolume.toFixed(2)}% | price: ${deviationHigh.toFixed(2)}%`, moment().format('MMMM Do YYYY, h:mm:ss a'))
		})
	})
}

module.exports = {
	collectTickers,
	getPriceDeviations,
	getQuoteAssetVolumeDeviations,
	getBaseAssetVolumeDeviations,
	collectBars,
	analyzeBars
}

// i++
// console.log('.', i)
// Object.keys(pairsTickers).forEach( pt => {
// 	const {updated, avg, vol} = pairsTickers[pt]
// 	if (!pairsInfo[pt])
// 		pairsInfo[pt] = {
// 			lastTickerTime: updated,
// 			avgUpdateTime: 0,
// 			updatesCounter: 0,
// 			lastTenUpdateTimes: Array(10),
// 			lastFiveUpdateTimes: Array(5),
// 			lastTwentyMinutesAvgPrice: Array(Times['TwentyMinutes']),
// 			lastHalfMinuteAvgPrice: Array(Times['HalfMinute']),
// 			lastTenSecondsAvgPrice: Array(Times['TenSeconds']),
// 			lastTwentyMinutesVolume: Array(Times['TwentyMinutes']),
// 			lastHalfMinuteVolume: Array(Times['HalfMinute']),
// 			lastTenSecondsVolume: Array(Times['TenSeconds']),
// 		}

// 	const {lastTickerTime, avgUpdateTime, updatesCounter} = pairsInfo[pt]

// 	let consoleInfo = ''
// 	pairsInfo[pt]['lastTickerTime'] = updated
// 	let deviationAlert = false
// 	Object.keys(Times).forEach( timesLabel => {
// 		pairsInfo[pt][`last${timesLabel}AvgPrice`] = addTrimStack(avg, pairsInfo[pt][`last${timesLabel}AvgPrice`], timesLabel)
// 		pairsInfo[pt][`last${timesLabel}Volume`] = addTrimStack(vol, pairsInfo[pt][`last${timesLabel}Volume`], timesLabel)

// 		// Get only deviation in percentage
// 		// consoleInfo += `${timesLabel}: ${arrayAvg(pairsInfo[pt][`last${timesLabel}AvgPrice`])}, ${arrayAvg(pairsInfo[pt][`last${timesLabel}Volume`])} \n`
// 		const avgAvgPrice = arrayAvg(pairsInfo[pt][`last${timesLabel}AvgPrice`])
// 		const avgPriceDeviation = calcDeviation(avg, avgAvgPrice).toFixed(2)
// 		const avgVolume = arrayAvg(pairsInfo[pt][`last${timesLabel}Volume`])
// 		const avgVolumeDeviation = calcDeviation(vol, avgVolume).toFixed(2)
// 		// console.log('avgVolumeDeviation: ', avgVolumeDeviation);
// 		if (Math.abs(avgPriceDeviation) >= Math.abs(deviationPriceFilter) || Math.abs(avgVolumeDeviation) >= Math.abs(deviationVolumeFilter)) deviationAlert = true
// 		consoleInfo += `${timesLabel}: price ${avgAvgPrice} ${avgPriceDeviation}%, vol: ${avgVolume} ${avgVolumeDeviation}% \n`
// 	})

// 	if (deviationAlert) {
// 		console.log('=========================', pt, i)
// 		console.log(consoleInfo)
// 	}