const mongoDB = 'watcher'
const mongoHost = 'localhost'

modeule.exports = {
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

	proxyOptions: {
		protocols: ['http', 'https'],
		anonymityLevels: ['anonymous', 'elite'],
		// countries: ['de', 'us', 'uk', 'ru']
	},

	// Scan for new proxies every half minute
	proxyGetterTimeout: 1000*30
}