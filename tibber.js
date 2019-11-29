
const RP = require('request-promise');

const gqlEndpoint = "https://api.tibber.com/v1-beta/gql"
// const subEndpoint = "wss://api.tibber.com/v1-beta/gql/subscriptions"

// Reference: https://developer.tibber.com/docs/reference#priceinfo
const query = `{ "query": "{  
    viewer{  
     homes {
       currentSubscription {
         priceInfo {
           current {
             total
             startsAt
             level
           }
           today {
             total
             startsAt
             level
           }
           tomorrow {
             total
             startsAt
             level
           }
         }
       }
     }
    }  
 }" }`

const rp = require('request-promise');

exports.getPrices = function (tibberToken) {
    return new Promise((resolve, reject) => {
        rp({
            headers: {
                'Authorization': 'Bearer ' + tibberToken,
                'Content-Type': 'application/json'
            },
            uri: gqlEndpoint,
            body: query.replace(/\n/g, ''),
            method: 'POST',
            resolveWithFullResponse: true,
            followRedirect: false,
        })
            .then(res => {
                resO = JSON.parse(res.body);
                resolve(resO.data.viewer.homes[0].currentSubscription.priceInfo)
            })
            .catch(e => {
                reject(e)
            })
    })
}