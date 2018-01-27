/**
 * Helper functions work with symbols data to detect deviations
 */
const mongoose = require('mongoose')
const Symbol = mongoose.model('Symbol')

/**
 * Collect data from ticker.
 * Save average price and values for:
 * 1. last 200 ticks
 * 2. 
 */
const collectStatistics = pairInfo => {
	Symbol.update(
		{symbol: pairInfo.symbol},
		{ $push: {
			"statistics.lastAvgPrice": {
				$position: 0,
				$each: [pairInfo.weightedAveragePrice],
				$slice: 200
			},
			"statistics.lastQuoteAssetVolume": {
				$position: 0,
				$each: [pairInfo.quoteAssetVolume],
				$slice: 200
			}
		}}
	)
	.exec()
	.catch( console.error )
}

module.exports = {
	collectStatistics
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