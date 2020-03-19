"use strict";

function drawTibber(moduleId, tibberData, config) {
  const consumption = tibberData.consumption;
  const prices = tibberData.prices;

  const showFromTime = new Date().addHours(-config.historyHours - 1);
  const showToTime = new Date().addHours(config.futureHours);

  const minConsumption = getMinConsumption(consumption);
  const maxConsumption = getMaxConsumption(consumption);
  const consumptionUnit = tibberData.consumption[0]
    ? tibberData.consumption[0].consumptionUnit
    : "";

  const firstPriceTime = prices.twoDays[0].startsAt;
  const priceData = extractPriceDataFromConsumption(
    consumption,
    firstPriceTime,
    config
  )
    .concat(extractPriceDataFromPrices(prices, config))
    .filter(p => {
      return p.x >= showFromTime && p.x <= showToTime;
    });

  const minPrice = getMinPrice(priceData);
  const maxPrice = getMaxPrice(priceData);

  let curPriceBackgroundColor;
  const curPrice = prices.current.total;

  const consumptionData = extractConsumptionData(
    consumption,
    minConsumption,
    maxConsumption
  );

  //   this.log("Consumption: ", consumptionData);

  // Show time in local timezone
  Highcharts.setOptions({
    time: {
      useUTC: false
    }
  });

  Highcharts.chart("tibberdata-" + moduleId, {
    chart: {
      zoomType: "xy",
      backgroundColor: "#000000",
      marginTop: 10 + config.adjustMargins.top,
      marginLeft: 80 + config.adjustMargins.left,
      marginRight: 60 + config.adjustMargins.right
    },
    title: {
      text: ""
    },
    xAxis: {
      type: "datetime",
      labels: {
        style: {
          color: config.xAxisLabelColor
        }
      },
      lineColor: config.xAxisLineColor
    },
    yAxis: [
      {
        // Primary yAxis (price, left)
        startOnTick: false,
        title: {
          text: ""
        },
        gridLineColor: "#000000",
        labels: {
          style: {
            color: "#000000"
          }
        },
        min: 0,
        max: Math.ceil(maxPrice * 10) / 10,
        plotLines: [
          {
            // Min price line
            color: config.minPriceColor,
            width: config.showMinPrice ? config.minPriceLineWidth : 0,
            value: minPrice,
            zIndex: 9,
            label: {
              text: config.showMinPrice
                ? formatNumber(
                    minPrice,
                    config.priceDecimals,
                    config.decimalSeparator
                  ) +
                  " " +
                  config.priceUnit
                : "",
              align: "right",
              verticalAlign: "top",
              style: {
                color: config.minPriceColor,
                fontSize: config.priceFontSize
              },
              x: 57 + config.adjustPriceLabelsX,
              y: 5
            }
          },
          {
            // Max price line
            color: config.maxPriceColor,
            width: config.showMaxPrice ? config.maxPriceLineWidth : 0,
            value: maxPrice,
            zIndex: 9,
            label: {
              text: config.showMaxPrice
                ? formatNumber(
                    maxPrice,
                    config.priceDecimals,
                    config.decimalSeparator
                  ) +
                  " " +
                  config.priceUnit
                : "",
              align: "right",
              verticalAlign: "top",
              style: {
                color: config.maxPriceColor,
                fontSize: config.priceFontSize
              },
              x: 57 + config.adjustPriceLabelsX,
              y: 5
            }
          }
        ]
      },
      {
        // Secondary yAxis (consumption, right)
        title: {
          text: "Consumption",
          style: {
            color: "#000000"
          }
        },
        labels: {
          format: "{value} kWh",
          style: {
            color: "#000000"
          }
        },
        gridLineColor: "#000000",
        min: 0,
        max: Math.ceil(maxConsumption),
        opposite: true
      }
    ],
    legend: {
      enabled: false
    },
    plotOptions: {
      column: {
        pointPadding: 0.0,
        groupPadding: 0.0,
        borderWidth: 0
      },
      series: {
        animation: false
      }
    },
    series: [
      config.showPrice
        ? {
            name: "Strømpris",
            type: config.priceChartType,
            step: "center",
            color: config.priceColor,
            zIndex: config.priceChartType === "column" ? 5 : 7,
            lineWidth: config.priceLineWidth,
            marker: {
              enabled: false
            },
            data: priceData
          }
        : {},
      config.showConsumption
        ? {
            name: "Forbruk",
            type: config.consumptionChartType,
            zIndex: config.consumptionChartType === "column" ? 5 : 7,
            step: "center",
            color: config.consumptionColor,
            lineWidth: config.consumptionLineWidth,
            marker: {
              enabled: false
            },
            yAxis: 1,
            data: consumptionData
          }
        : {}
    ],
    annotations: [
      {
        labels: [
          {
            // Current price
            point: config.showCurrentPrice ? "cur" : "dontshow",
            text:
              formatNumber(
                curPrice,
                config.priceDecimals,
                config.decimalSeparator
              ) +
              " " +
              config.priceUnit,
            backgroundColor: curPriceBackgroundColor,
            borderColor: config.curPriceColor,
            y: -10,
            style: {
              color: config.curPriceColor,
              fontSize: config.priceFontSize
            },
            zIndex: 15
          },
          {
            // Min consumption
            point: config.showMinConsumption
              ? {
                  x: -80 + config.adjustConsumptionLabelsX,
                  y: minConsumption,
                  yAxis: 1
                }
              : "dontshow",
            text:
              formatNumber(
                minConsumption,
                config.consumptionDecimals,
                config.decimalSeparator
              ) +
              " " +
              consumptionUnit,
            backgroundColor: "#000",
            borderColor: "#000",
            y: 0,
            align: "left",
            verticalAlign: "middle",
            crop: false,
            overflow: "none",
            style: {
              color: config.consumptionColor,
              fontSize: config.priceFontSize
            }
          },
          {
            // Max consumption
            point: config.showMaxConsumption
              ? {
                  x: -80 + config.adjustConsumptionLabelsX,
                  y: maxConsumption,
                  yAxis: 1
                }
              : "dontshow",
            text:
              formatNumber(
                maxConsumption,
                config.consumptionDecimals,
                config.decimalSeparator
              ) +
              " " +
              consumptionUnit,
            backgroundColor: "#000",
            borderColor: "#000",
            y: 0,
            align: "left",
            verticalAlign: "middle",
            crop: false,
            overflow: "none",
            style: {
              color: config.consumptionColor,
              fontSize: config.priceFontSize
            }
          }
        ]
      }
    ],
    credits: {
      enabled: false
    }
  });
}

function getMinPrice(prices) {
  return prices.reduce((min, p) => (p.y < min ? p.y : min), prices[0].y);
}

function getMaxPrice(prices) {
  return prices.reduce((max, p) => (p.y > max ? p.y : max), prices[0].y);
}

function getMinConsumption(consumption) {
  return consumption.reduce(
    (min, c) => (c.consumption < min ? c.consumption : min),
    consumption[0] ? consumption[0].consumption : null
  );
}

function getMaxConsumption(consumption) {
  return consumption.reduce(
    (max, c) => (c.consumption > max ? c.consumption : max),
    consumption[0] ? consumption[0].consumption : null
  );
}

function extractPriceDataFromPrices(prices, config) {
  return prices.twoDays.map(p => {
    const now = Date.parse(prices.current.startsAt);
    const t = Date.parse(p.startsAt);
    const ci = t < now ? 0 : t === now ? 1 : 2;
    return {
      x: t,
      y: p.total,
      color: config.priceColumnColors[p.level][ci],
      id: t === now ? "cur" : ""
    };
  });
}

function extractConsumptionData(consumption, minConsumption, maxConsumption) {
  return consumption.map(c => {
    let t = Date.parse(c.from);
    return {
      x: t,
      y: c.consumption,
      id:
        c.consumption === maxConsumption
          ? "maxCon"
          : c.consumption === minConsumption
          ? "minCon"
          : ""
    };
  });
}

function extractPriceDataFromConsumption(consumption, untilTime, config) {
  return consumption
    .filter(c => {
      return c.to <= untilTime;
    })
    .map(c => {
      return {
        x: Date.parse(c.from),
        y: c.unitPrice,
        color: config.priceColumnColors["UNKNOWN"][0],
        id: ""
      };
    });
}

function formatNumber(n, d, decimalSeparator) {
  // Set number of decimals (d)
  if (n == null) {
    return "";
  }
  const x = Math.floor(n);
  const y = "" + (n - x);
  return "" + x + decimalSeparator + y.substr(2, d);
}
