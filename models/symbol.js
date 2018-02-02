const mongoose = require('mongoose')
const {config} = require('../config/config')

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId

const statisticsSchema = new Schema({
	lastAvgPrice			: [Number],
	lastQuoteAssetVolume	: [Number],
	lastBaseAssetVolume	: [Number],
}, {_id: false})

const barSchema = new Schema({
	openTime				: Number,
	open					: String,
	high					: String,
	low						: String,
	close					: String,
	volume					: String,
	closeTime				: Number,
	quoteAssetVolume		: String,
	trades					: Number,
	takerBaseAssetVolume	: String,
	takerQuoteAssetVolume	: String,
	ignored					: String
})

const historyBarsSchema = new Schema({
	'1m'			: [barSchema],
	'5m'			: [barSchema],
	'15m'			: [barSchema],
	'30m'			: [barSchema],
	'1h'			: [barSchema],
	'2h'			: [barSchema],
	'4h'			: [barSchema],
	'6h'			: [barSchema],
	'12h'			: [barSchema],
	'1D'			: [barSchema],
	'1W'			: [barSchema]
}, {_id: false})

const symbolSchema = new Schema({
	symbol				: { type: String, unique: true, required: true },
	status				: { type: String },
    baseAsset			: { type: String },
    baseAssetPrecision	: { type: Number },
    quoteAsset			: { type: String },
    quotePrecision		: { type: Number },
    orderTypes	 		: { type: Array },
    icebergAllowed		: { type: Boolean },
	filters				: { type: Array },
	statistics			: [statisticsSchema],
	historyBars			: [historyBarsSchema]
})

mongoose.model('Symbol', symbolSchema)