/**
 * Script, that went through mongoDB collection 'proxies',
 * take it, and tries to send GET request to https://yobit.net/api/3/ticker/*
 * (it choosing pair randomly from mongodb collection 'pairs')
 * Take only proxies that have 'inUse' value as FALSE (to avoid too much requests
 * from same IP and avoid temporary blocking), and availability is TRUE
 *
 * And change proxy item depends on results:
 * 1. Successfully got JSON with ticker data - mark availability to TRUE
 * 2. Request answered with word CAPTCHA - mark availability to FALSE and 'issues.captcha' to value 1
 * 3. Request answered with word Temporary - mark availability to FALSE and 'issues.temporary_banned' to value current+1
 * 4. Request answered with any other error - mark availability to FALSE and 'issues.not_available' to value 1
 * 
 * Update lastCheck timestamp
 */

process.on('unhandledRejection', console.error)

const _ = require('lodash')
const mongoose = require('mongoose')
const {to} = require('await-to-js')

const config = require('../config/config')
const sendRequest = require('../lib/sendRequest')

const mongo = require('../initializers/mongo')
const Proxy = mongoose.model('Proxy')
const mongodb = mongo()

const proxy = {
    "protocols" : [ 
        "http"
    ],
    "inUse" : false,
    "issues" : [],
    "availability" : 1,
    // "ipAddress" : "5.196.60.68",
    "ipAddress" : "178.136.192.223",
    "port" : 53281,
    "anonymityLevel" : "anonymous",
    "source" : "premproxy",
    "country" : "fr",
    "__v" : 0
}

let i = 0
let successful = 0
const checkProxy = async (proxy) => {
    const [error, result] = await to(sendRequest({uri: `${config.APIOptions.uri}ticker/ltc_eth`}, proxy))
    if (error) {
        process.stdout.write("^")
    } else if(result.indexOf('CAPTCHA')) {
        process.stdout.write("C")
    } else if(result.indexOf('banned')) {
        process.stdout.write("B")
    } else {
        try {
            JSON.parse(result)
            process.stdout.write("+")
            successful++
        } catch (err) {
            process.stdout.write("O")
        }
    }
    // console.log('error, result: ', error, result, proxy.ipAddress)
    return
}

// const checkProxies = async () => {    
//     return new Promise( resolve => {
//         // console.log()
//         // console.log('--------------------------------')
//         Proxy.find().limit(3).skip(3*i)
//         .exec( (err, res) => {
//             if (_.isEmpty(res)) {
//                 console.log('-------------------------')
//                 console.log('+++++', successful)
//                 return clearInterval(interval)
//             }
//             i++
//             // console.log('err: ', err);
//             // console.log('res: ', typeof res);
//             Promise.all( res.map( checkProxy ) )
//             .then( resolve )
//         })
//     })
// 	// const [error, result] = await to(sendRequest({uri: `${config.APIOptions.uri}ticker/ltc_eth`}, proxy))
// 	// console.log('error, result: ', error, result);
// }

var interval
mongodb
.then( () => {
    // checkProxies()
    checkProxy(proxy)
    // interval = setInterval( () => {
    // }, 1000)
})
