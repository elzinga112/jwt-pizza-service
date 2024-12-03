const config = require('./config.js');

class MetricBuilder {

  constructor() {
    this.metrics = [];
  }

  addMetric(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;
    this.metrics.push(metric);
  }

  build() {
    return this.metrics;
  }
}

const metricBuilder = new MetricBuilder();
module.exports = metricBuilder;