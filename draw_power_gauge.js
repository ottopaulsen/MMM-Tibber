function drawPowerGauge(moduleId, tickPositioner, config, gaugeOptions) {
  const innerRadius = 60;
  const radius = 100;
  const midRadius =
    radius - ((radius - innerRadius) * config.powerGaugeMarkSize) / 100;

  const powerGauge = Highcharts.chart(
    "power-" + moduleId,
    Highcharts.merge(gaugeOptions, {
      yAxis: {
        min: 0,
        max: config.powerGaugeMaxValue,
        title: {
          text: config.powerGaugeTitle
        },
        tickPositioner: tickPositioner,
        labels: {
          distance: 18,
          formatter: function() {
            return (this.value / 1000).toFixed(1);
          }
        }
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
          data: [{ y: 0, color: config.powerGaugeMinTickColor }],
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
              config.gaugesValueFontSize +
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
          data: [{ y: 0, color: config.powerGaugeAvgTickColor }],
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
          data: [{ y: 0, color: config.powerGaugeMaxTickColor }],
          zIndex: 3,
          innerRadius: midRadius,
          radius: radius - 1
        }
      ]
    })
  );
  return powerGauge;
}
