const mongoose = require('mongoose')
const config = require('../config/config')

require('../models/proxy')

module.exports = () =>
	new Promise( (resolve, reject) => {
		mongoose.connect(config.mongo.connection_string, config.mongo.options)
		const db = mongoose.connection;
		db.on('error', (error) => {
			reject(error)
			console.error('connection error:', error)
		})
		db.once('open', function() {
			console.log('***** MONGO connected')
			resolve(db)
		})
	})