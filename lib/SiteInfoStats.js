'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('smoothie'),
    SmoothieChart = _require.SmoothieChart,
    TimeSeries = _require.TimeSeries;

var childProcess = require('child_process');
var readline = require('readline');
var debounce = require('lodash/debounce');

module.exports = function (context) {

	var Component = context.React.Component;
	var React = context.React;
	var $ = context.jQuery;

	var timestampFormatter = function timestampFormatter(date) {
		function pad2(number) {
			return (number < 10 ? '0' : '') + number;
		}

		return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
	};

	return function (_Component) {
		_inherits(SiteInfoStats, _Component);

		function SiteInfoStats(props) {
			_classCallCheck(this, SiteInfoStats);

			var _this = _possibleConstructorReturn(this, (SiteInfoStats.__proto__ || Object.getPrototypeOf(SiteInfoStats)).call(this, props));

			_this.statsProcess = undefined;
			_this.memorySeries = undefined;
			_this.cpuSeries = undefined;

			_this.state = {
				cpu: null,
				memory: null
			};
			return _this;
		}

		_createClass(SiteInfoStats, [{
			key: 'componentDidMount',
			value: function componentDidMount() {

				this.startCPUChart();
				this.startMemoryChart();

				this.getDockerStats();
			}
		}, {
			key: 'getDockerStats',
			value: function getDockerStats() {
				var _this2 = this;

				var siteID = this.props.params.siteID;
				var site = this.props.sites[siteID];

				this.statsProcess = childProcess.spawn(context.environment.dockerPath, ['stats', site.container], { env: context.environment.dockerEnv });

				readline.createInterface({
					input: this.statsProcess.stdout,
					terminal: false
				}).on('line', debounce(function (line) {

					if (!_this2.memorySeries || !_this2.cpuSeries) {
						return;
					}

					if (line.indexOf(site.container) !== -1) {

						var matches = /^[a-z0-9]+\s+([0-9.%]+)\s+([0-9.]+\s*MiB)/gmi.exec(line);

						if (!matches) {
							return;
						}

						var time = new Date().getTime();

						var cpuResult = matches[1].replace('%', '');
						var memoryResult = matches[2].replace(/\s*MiB/, '');

						_this2.cpuSeries.append(time, cpuResult);
						_this2.memorySeries.append(time, matches[2].replace(/\s*MiB/, ''));

						_this2.setState({
							cpu: cpuResult,
							memory: memoryResult
						});
					}
				}), 500);
			}
		}, {
			key: 'startCPUChart',
			value: function startCPUChart() {

				$(this.refs['chart-cpu']).attr('width', $(this.refs['chart-cpu-container']).width());
				$(this.refs['chart-cpu']).attr('height', $(this.refs['chart-cpu-container']).height() - 50);

				var chart = new SmoothieChart({
					millisPerPixel: 100,
					interpolation: 'linear',
					grid: {
						strokeStyle: 'rgba(0,0,0,0.05)',
						verticalSections: 5,
						fillStyle: 'transparent',
						borderVisible: false,
						millisPerLine: 10000
					},
					maxValue: 100,
					minValue: 0,
					yMinFormatter: function yMinFormatter(min, precision) {
						return parseFloat(min).toFixed(precision) + '%';
					},
					yMaxFormatter: function yMaxFormatter(max, precision) {
						return parseFloat(max).toFixed(precision) + '%';
					},
					labels: {
						fillStyle: '#000000'
					},
					timestampFormatter: timestampFormatter
				});

				this.cpuSeries = new TimeSeries();

				chart.addTimeSeries(this.cpuSeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
				chart.streamTo(this.refs['chart-cpu'], 1000);
			}
		}, {
			key: 'startMemoryChart',
			value: function startMemoryChart() {

				var siteID = this.props.params.siteID;
				var site = this.props.sites[siteID];

				$(this.refs['chart-memory']).attr('width', $(this.refs['chart-memory-container']).width());
				$(this.refs['chart-memory']).attr('height', $(this.refs['chart-memory-container']).height() - 50);

				var chart = new SmoothieChart({
					millisPerPixel: 100,
					interpolation: 'linear',
					grid: {
						strokeStyle: 'rgba(0,0,0,0.05)',
						verticalSections: 5,
						fillStyle: 'transparent',
						borderVisible: false,
						millisPerLine: 10000
					},
					yMinFormatter: function yMinFormatter(min, precision) {
						return parseFloat(min).toFixed(precision) + ' MiB';
					},
					yMaxFormatter: function yMaxFormatter(max, precision) {
						return parseFloat(max).toFixed(precision) + ' MiB';
					},
					labels: {
						fillStyle: '#000000'
					},
					timestampFormatter: timestampFormatter
				});

				this.memorySeries = new TimeSeries();

				chart.addTimeSeries(this.memorySeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
				chart.streamTo(this.refs['chart-memory'], 1000);

				childProcess.execFile(context.environment.dockerPath, ['stats', '--no-stream', site.container], { env: context.environment.dockerEnv }, function (error, stdout, stderr) {
					var maxMemoryMatch = /\/ ([0-9.]+\s*MiB)/gmi.exec(stdout);

					chart.options.maxValue = parseInt(maxMemoryMatch[1].replace(/\s*MiB/, ''));
					chart.options.minValue = 0;
					chart.updateValueRange();
				});
			}
		}, {
			key: 'componentWillUnmount',
			value: function componentWillUnmount() {

				if (this.statsProcess) {

					this.statsProcess.stdin.pause();
					this.statsProcess.kill();

					this.statsProcess = undefined;
				}
			}
		}, {
			key: 'render',
			value: function render() {

				return React.createElement(
					'div',
					{ style: { display: 'flex', flexDirection: 'column', flex: 1, padding: '15px 0' } },
					React.createElement(
						'div',
						{ style: { height: '50%', boxSizing: 'border-box', padding: '15px 0' }, ref: 'chart-cpu-container' },
						React.createElement(
							'h4',
							{ className: 'padded-horizontally-more', style: { margin: '0 30px 15px' } },
							'CPU Usage',
							React.createElement(
								'span',
								{ style: { float: 'right', fontFamily: 'monospace', color: '#51bb7b' } },
								this.state.cpu ? this.state.cpu + '%' : ''
							)
						),
						React.createElement('canvas', { width: '', height: '', ref: 'chart-cpu' })
					),
					React.createElement(
						'div',
						{ style: { height: '50%', boxSizing: 'border-box', padding: '0' }, ref: 'chart-memory-container' },
						React.createElement(
							'h4',
							{ className: 'padded-horizontally-more', style: { margin: '0 30px 15px' } },
							'Memory Usage',
							React.createElement(
								'span',
								{ style: { float: 'right', fontFamily: 'monospace', color: '#51bb7b' } },
								this.state.memory ? this.state.memory + ' MiB' : ''
							)
						),
						React.createElement('canvas', { width: '400', height: '200', ref: 'chart-memory' })
					)
				);
			}
		}]);

		return SiteInfoStats;
	}(Component);
};