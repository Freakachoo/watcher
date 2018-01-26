const mongoose = require('mongoose')
const {config} = require('../config/config')

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId

const symbolSchema = new Schema({
	symbol				: { type: String, unique: true, required: true },
	status				: { type: String },
    baseAsset			: { type: String },
    baseAssetPrecision	: { type: Number },
    quoteAsset			: { type: String },
    quotePrecision		: { type: Number },
    orderTypes	 		: { type: Array },
    icebergAllowed		: { type: Boolean },
    filters				: { type: Array }
})

mongoose.model('Symbol', symbolSchema)