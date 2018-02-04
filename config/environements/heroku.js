const mongoDB = 'heroku_3dl0gfzn'
const mongoHost = 'ds219318.mlab.com'
const mongoPort = 19318

module.exports = {
	mongo: {
		// The MongoDB server host name
		host: mongoHost,
		// The name of the database
		db: mongoDB,
		// The database port
		port: mongoPort,
		// The database options
		server: {
			socketOptions: {
				keepAlive: 1
			}
		},
		replset: {
			socketOptions: {
				keepAlive: 1
			}
		},
		// The database connection string
		connection_string: `mongodb://${mongoDB}:pnc7hrbqt2ejvs6smptqht65sn@${mongoHost}:${mongoPort}/${mongoDB}`
	},

}