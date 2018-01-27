const mongoose = require('mongoose')
const {config} = require('../config/config')

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId

const statisticsSchema = new Schema({
	lastAvgPrice		: { type: Array, default: [] },
	lastAvgVolume		: { type: Array, default: [] },
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
	statistics		: [statisticsSchema]
})

mongoose.model('Symbol', symbolSchema)