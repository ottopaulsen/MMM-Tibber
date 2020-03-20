function drawPowerGauge(moduleId, tickPositioner, config, gaugeOptions) {
  console.log("drawing power");
  const innerRadius = 60;
  const radius = 100;
  const midRadius = radius - ((radius - innerRadius) * config.markSize) / 100;

  console.log("gaugeOptions: ", gaugeOptions);
  const powerGauge = Highcharts.chart(
    "power-" + moduleId,
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
  return powerGauge;
}
