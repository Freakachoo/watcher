/**
 * Helper functions
 */
const config = require('../config/config')

const arraySum = (arr) => arr.filter(Boolean).reduce( (s, e) => s+e, 0)

module.exports = {
	arraySum,
	
	arrayAvg: (arr) => arraySum(arr) / arr.filter(Boolean).length,

	calcDeviation: (current, avg) => 100*(current-avg)/avg,

	validateInterval: (interval) => {
		if (!config.possibleIntervals.includes(interval)) throw Error(`Wrong interval '${interval}', only ${config.possibleIntervals.join(', ')} are possible.`)
		return true
	},

	intervalToMs: (interval) => {
		let seconds = 0
		if (interval.indexOf('m') > 0) seconds = 60
		if (interval.indexOf('h') > 0) seconds = 60*60
		if (interval.indexOf('D') > 0) seconds = 60*60*24
		if (interval.indexOf('W') > 0) seconds = 60*60*24*7
		if (!seconds) throw Error(`Wrong interval ${interval}`)
		return seconds*parseInt(interval)*1000
	}
}
