const mongoDB = 'watcher'
const mongoHost = 'localhost'

module.exports = {
	mongo: {
		// The MongoDB server host name
		host: mongoHost,
		// The name of the database
		db: mongoDB,
		// The database port
		port: 27017,
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
		connection_string: `mongodb://${mongoHost}/${mongoDB}`
	},

}