const mongoose = require('mongoose')
const {config} = require('../config/config')

const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId

const issueSchema = new Schema({
	captcha: Boolean,
	temporary_banned: Boolean,
	not_available: Boolean
}, {_id : false})

const proxySchema = new Schema({
	id		 	   : ObjectId,
	lastCheck      : Date,
	ipAddress	   : { type: String, unique: true, required: true },
	port		   : Number,
	anonymityLevel : String,
	protocols	   : Array,
	source		   : String,
	country		   : String,
	inUse		   : { type: Boolean, default: false },
	issues		   : [issueSchema],
	availability   : Number
})

mongoose.model('Proxy', proxySchema)