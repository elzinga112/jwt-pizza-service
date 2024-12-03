const config = require('./config.json');

export class MetricBuilder {

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