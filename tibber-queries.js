const homesQuery = `
{ viewer { homes {
    id
    address {
      address1
      postalCode
      city
      country
      latitude
      longitude
} } } }
`;

const dataPerHourQuery = `  
{ viewer {
    websocketSubscriptionUrl
    home(id: \"HOMEID\") {
      id
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
 }`;

const liveQuery = `
subscription {
 liveMeasurement(homeId: \"HOMEID\") {
   timestamp
   power
   accumulatedConsumption
   accumulatedCost
   currency
   minPower
   averagePower
   maxPower
   voltagePhase1
   voltagePhase2
   voltagePhase3
   currentL1
   currentL2
   currentL3
 }
}
`;

const realTimeEnabled = `
{
  viewer {
    home(id: \"HOMEID\") {
      features {
        realTimeConsumptionEnabled
      }
      address {
        address1
        city
      }
    }
  }
}`;

const user = `
{
  viewer {
    name
  }
}`;

const gqlSubscriptionEndpointQuery = ` { viewer { websocketSubscriptionUrl } } `;

module.exports = { homesQuery, dataPerHourQuery, liveQuery, gqlSubscriptionEndpointQuery, realTimeEnabled, user };
