const { SmoothieChart, TimeSeries } = require('smoothie');
const childProcess = require('child_process');
const readline = require('readline');
const debounce = require('lodash.debounce');

module.exports = function (context) {

	const Component = context.React.Component;
	const React = context.React;
	const $ = context.jQuery;

	const timestampFormatter = (date) => {
		function pad2 (number) {
			return (number < 10 ? '0' : '') + number;
		}

		return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
	};

	return class SiteInfoStats extends Component {
		constructor (props) {
			super(props);

			this.statsProcess = undefined;
			this.memorySeries = undefined;
			this.cpuSeries = undefined;

			this.state = {
				cpu: null,
				memory: null,
			};
		}

		componentDidMount () {

			this.startCPUChart();
			this.startMemoryChart();

			this.getDockerStats();

		}

		getDockerStats () {

			const siteID = this.props.params.siteID;
			const site = this.props.sites[siteID];

			this.statsProcess = childProcess.spawn(context.environment.dockerPath, ['stats', site.container], { env: context.environment.dockerEnv });

			readline.createInterface({
				input: this.statsProcess.stdout,
				terminal: false,
			}).on('line', debounce((line) => {

				if (!this.memorySeries || !this.cpuSeries) {
					return;
				}

				if (line.indexOf(site.container) !== -1) {

					const matches = (/^[a-z0-9]+\s+([0-9.%]+)\s+([0-9.]+\s*MiB)/gmi).exec(line);

					if (!matches) {
						return;
					}

					const time = new Date().getTime();

					const cpuResult = matches[1].replace('%', '');
					const memoryResult = matches[2].replace(/\s*MiB/, '');

					this.cpuSeries.append(time, parseFloat(cpuResult));
					this.memorySeries.append(time, parseFloat(memoryResult));

					this.setState({
						cpu: cpuResult,
						memory: memoryResult,
					});

				}

			}), 500);

		}

		startCPUChart () {

			$(this.refs['chart-cpu']).attr('width', $(this.refs['chart-cpu-container']).width());
			$(this.refs['chart-cpu']).attr('height', $(this.refs['chart-cpu-container']).height() - 50);

			const chart = new SmoothieChart({
				millisPerPixel: 100,
				interpolation: 'linear',
				grid: {
					strokeStyle: 'rgba(0,0,0,0.05)',
					verticalSections: 5,
					fillStyle: 'transparent',
					borderVisible: false,
					millisPerLine: 10000,
				},
				maxValue: 100,
				minValue: 0,
				yMinFormatter: function (min, precision) {
					return parseFloat(min).toFixed(precision) + '%';
				},
				yMaxFormatter: function (max, precision) {
					return parseFloat(max).toFixed(precision) + '%';
				},
				labels: {
					fillStyle: '#000000',
				},
				timestampFormatter: timestampFormatter,
			});

			this.cpuSeries = new TimeSeries();

			chart.addTimeSeries(this.cpuSeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
			chart.streamTo(this.refs['chart-cpu'], 1000);

		}

		startMemoryChart () {

			const siteID = this.props.params.siteID;
			const site = this.props.sites[siteID];

			$(this.refs['chart-memory']).attr('width', $(this.refs['chart-memory-container']).width());
			$(this.refs['chart-memory']).attr('height', $(this.refs['chart-memory-container']).height() - 50);

			const chart = new SmoothieChart({
				millisPerPixel: 100,
				interpolation: 'linear',
				grid: {
					strokeStyle: 'rgba(0,0,0,0.05)',
					verticalSections: 5,
					fillStyle: 'transparent',
					borderVisible: false,
					millisPerLine: 10000,
				},
				yMinFormatter: function (min, precision) {
					return parseFloat(min).toFixed(precision) + ' MiB';
				},
				yMaxFormatter: function (max, precision) {
					return parseFloat(max).toFixed(precision) + ' MiB';
				},
				labels: {
					fillStyle: '#000000',
				},
				timestampFormatter: timestampFormatter,
			});

			this.memorySeries = new TimeSeries();

			chart.addTimeSeries(this.memorySeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
			chart.streamTo(this.refs['chart-memory'], 1000);

			childProcess.execFile(context.environment.dockerPath, ['stats', '--no-stream', site.container], { env: context.environment.dockerEnv }, (error, stdout, stderr) => {
				const maxMemoryMatch = (/\/ ([0-9.]+\s*MiB)/gmi).exec(stdout);

				chart.options.maxValue = parseInt(maxMemoryMatch[1].replace(/\s*MiB/, ''));
				chart.options.minValue = 0;
				chart.updateValueRange();
			});

		}

		componentWillUnmount () {

			if (this.statsProcess) {

				this.statsProcess.stdin.pause();
				this.statsProcess.kill();

				this.statsProcess = undefined;

			}

		}

		render () {

			return (
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '15px 0' }}>
					<div style={{ height: '50%', boxSizing: 'border-box', padding: '15px 0' }} ref="chart-cpu-container">
						<h4 className="padded-horizontally-more" style={{ margin: '0 30px 15px' }}>
							CPU Usage
							<span style={{ float: 'right', fontFamily: 'monospace', color: '#51bb7b' }}>{this.state.cpu ? this.state.cpu + '%' : ''}</span>
						</h4>

						<canvas width="" height="" ref="chart-cpu"></canvas>
					</div>
					<div style={{ height: '50%', boxSizing: 'border-box', padding: '0' }} ref="chart-memory-container">
						<h4 className="padded-horizontally-more" style={{ margin: '0 30px 15px' }}>
							Memory Usage
							<span style={{ float: 'right', fontFamily: 'monospace', color: '#51bb7b' }}>{this.state.memory ? this.state.memory + ' MiB' : ''}</span>
						</h4>

						<canvas width="400" height="200" ref="chart-memory"></canvas>
					</div>
				</div>
			);
		}
	};

};
