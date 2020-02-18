const RP = require("request-promise");

const gqlEndpoint = "https://api.tibber.com/v1-beta/gql";
// const subEndpoint = "wss://api.tibber.com/v1-beta/gql/subscriptions"

// Reference: https://developer.tibber.com/docs/reference#priceinfo
const tibberQuery = `{ "query": "{  
    viewer{  
      homes {
        address {
          address1
          postalCode
          city
        }
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
        consumption(resolution: HOURLY, last: HISTHOURS) {
          nodes {
            from
            to
            cost
            unitPrice
            unitPriceVAT
            consumption
            consumptionUnit
          }
        }
      }
    }  
 }" }`;

exports.getTibber = function(tibberToken, homeNumber = 0, hoursHistory = 24) {
  return new Promise((resolve, reject) => {
    RP({
      headers: {
        Authorization: "Bearer " + tibberToken,
        "Content-Type": "application/json"
      },
      uri: gqlEndpoint,
      body: tibberQuery.replace(/\n/g, "").replace("HISTHOURS", hoursHistory),
      method: "POST",
      resolveWithFullResponse: true,
      followRedirect: false
    })
      .then(res => {
        resO = JSON.parse(res.body);
        resolve(resO.data.viewer.homes[homeNumber]);
      })
      .catch(e => {
        reject(e);
      });
  });
};
