function drawPowerGauge(tickPositioner, config) {
  console.log("drawing gauges");
  const innerRadius = 60;
  const radius = 100;
  const midRadius = radius - ((radius - innerRadius) * config.markSize) / 100;
  const gaugeOptions = {
    chart: {
      type: "solidgauge",
      backgroundColor: "#000"
    },

    title: null,

    pane: {
      center: ["50%", "85%"],
      size: "140%",
      startAngle: -90,
      endAngle: 90,
      background: {
        backgroundColor: "#000",
        borderColor: "#444",
        innerRadius: "60%",
        outerRadius: "100%",
        shape: "arc"
      }
    },

    // the value axis
    yAxis: {
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 2,
      categories: [],
      title: {
        y: 25,
        style: {
          fontSize: config.titleFontSize
        }
      },
      labels: {
        distance: 18,
        formatter: function() {
          return (this.value / 1000).toFixed(1);
        },
        style: {
          fontSize: config.labelFontSize + "px"
        }
      }
    },

    plotOptions: {
      solidgauge: {
        dataLabels: {
          enabled: false,
          y: 5,
          borderWidth: 0,
          useHTML: true,
          style: { color: "#777" }
        }
      }
    }
  };

  // The consumption gauge
  const consumptionChart = Highcharts.chart(
    "gauges",
    Highcharts.merge(gaugeOptions, {
      yAxis: {
        min: 0,
        max: config.maxPower,
        title: {
          text: config.title
        },
        tickPositioner: tickPositioner
      },

      credits: {
        enabled: false
      },

      series: [
        {
          name: "Min1",
          data: [{ y: 0, color: "#000" }],
          zIndex: 12,
          innerRadius: midRadius,
          radius: radius - 1
        },
        {
          name: "Min2",
          data: [{ y: 0, color: config.minTickColor }],
          zIndex: 10,
          innerRadius: midRadius,
          radius: radius - 1
        },
        {
          name: "Current",
          data: [{ y: 0, color: "#00A" }],
          innerRadius: innerRadius,
          radius: midRadius,
          dataLabels: {
            enabled: true,
            format:
              '<div style="text-align:center">' +
              '<span style="font-size:' +
              config.powerFontSize +
              'px">{y}</span><br/>' +
              "</div>"
          }
        },
        {
          name: "Avg1",
          data: [{ y: 0, color: "#000" }],
          zIndex: 9,
          innerRadius: midRadius - 1,
          radius: radius - 1
        },
        {
          name: "Avg2",
          data: [{ y: 0, color: config.avgTickColor }],
          zIndex: 7,
          innerRadius: midRadius,
          radius: radius - 1
        },
        {
          name: "Max1",
          data: [{ y: 0, color: "#000" }],
          zIndex: 5,
          innerRadius: midRadius - 1,
          radius: radius - 1
        },
        {
          name: "Max2",
          data: [{ y: 0, color: config.maxTickColor }],
          zIndex: 3,
          innerRadius: midRadius,
          radius: radius - 1
        }
      ]
    })
  );
  return consumptionChart;
}
