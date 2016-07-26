const {SmoothieChart, TimeSeries} = require('smoothie');
const childProcess = require('child_process');
const readline = require('readline');
const debounce = require('lodash/debounce');

module.exports = function (context) {

	const Component = context.React.Component;
	const React = context.React;
	const $ = context.jQuery;

	const timestampFormatter = (date) => {
		function pad2(number) {
			return (number < 10 ? '0' : '') + number
		}

		return pad2(date.getHours()) + ':' + pad2(date.getMinutes()) + ':' + pad2(date.getSeconds());
	};

	return class SiteInfoStats extends Component {
		constructor(props) {
			super(props);

			this.statsProcess = undefined;
			this.memorySeries = undefined;
			this.cpuSeries = undefined;

			this.state = {
				cpu: null,
				memory: null
			}
		}

		componentDidMount() {

			this.startCPUChart();
			this.startMemoryChart();

			this.getDockerStats();

		}

		getDockerStats() {

			let siteID = this.props.params.siteID;
			let site = this.props.sites[siteID];

			this.statsProcess = childProcess.spawn(context.environment.dockerPath, ['stats', site.container], {env: context.environment.dockerEnv});

			readline.createInterface({
				input: this.statsProcess.stdout,
				terminal: false
			}).on('line', debounce((line) => {

				if (!this.memorySeries || !this.cpuSeries) {
					return;
				}

				if (line.indexOf(site.container) !== -1) {

					let matches = (/^[a-z0-9]+\s+([0-9.%]+)\s+([0-9.]+ MiB)/gmi).exec(line);

					if ( !matches ) {
						return;
					}
					
					let time = new Date().getTime();

					let cpuResult = matches[1].replace('%', '');
					let memoryResult = matches[2].replace(' MiB', '');

					this.cpuSeries.append(time, cpuResult);
					this.memorySeries.append(time, matches[2].replace(' MiB', ''));

					this.setState({
						cpu: cpuResult,
						memory: memoryResult
					});

				}

			}), 500);

		}

		startCPUChart() {

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
				yMinFormatter: function (min, precision) {
					return parseFloat(min).toFixed(precision) + '%';
				},
				yMaxFormatter: function (max, precision) {
					return parseFloat(max).toFixed(precision) + '%';
				},
				labels: {
					fillStyle: '#000000'
				},
				timestampFormatter: timestampFormatter
			});

			this.cpuSeries = new TimeSeries();

			chart.addTimeSeries(this.cpuSeries, {lineWidth: 1, strokeStyle: '#4e95c6'});
			chart.streamTo(this.refs['chart-cpu'], 1000);

		};

		startMemoryChart() {

			let siteID = this.props.params.siteID;
			let site = this.props.sites[siteID];

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
				yMinFormatter: function (min, precision) {
					return parseFloat(min).toFixed(precision) + ' MiB';
				},
				yMaxFormatter: function (max, precision) {
					return parseFloat(max).toFixed(precision) + ' MiB';
				},
				labels: {
					fillStyle: '#000000'
				},
				timestampFormatter: timestampFormatter
			});

			this.memorySeries = new TimeSeries();

			chart.addTimeSeries(this.memorySeries, {lineWidth: 1, strokeStyle: '#7f4eb3'});
			chart.streamTo(this.refs['chart-memory'], 1000);

			childProcess.execFile(context.environment.dockerPath, ['stats', '--no-stream', site.container], {env: context.environment.dockerEnv}, (error, stdout, stderr) => {
				let maxMemoryMatch = (/\/ ([0-9.]+ MiB)/gmi).exec(stdout);

				chart.options.maxValue = parseInt(maxMemoryMatch[1].replace(' MiB', ''));
				chart.options.minValue = 0;
				chart.updateValueRange();
			});

		}

		componentWillUnmount() {

			if ( this.statsProcess ) {

				this.statsProcess.stdin.pause();
				this.statsProcess.kill();

				this.statsProcess = undefined;

			}

		}

		render() {

			return (
				<div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
					<div style={{height: '50%', boxSizing: 'border-box', padding: '15px 0'}} ref="chart-cpu-container">
						<h4 className="padded-horizontally-more" style={{marginTop: 0}}>
							CPU Usage
							<span style={{float: 'right', fontFamily: 'monospace', color: '#4e95c6'}}>{this.state.cpu ? this.state.cpu + '%' : ''}</span>
						</h4>

						<canvas width="" height="" ref="chart-cpu"></canvas>
					</div>
					<div style={{height: '50%', boxSizing: 'border-box', padding: '0'}} ref="chart-memory-container">
						<h4 className="padded-horizontally-more" style={{marginTop: 0}}>
							Memory Usage
							<span style={{float: 'right', fontFamily: 'monospace', color: '#7f4eb3'}}>{this.state.memory ? this.state.memory + ' MiB' : ''}</span>
						</h4>

						<canvas width="400" height="200" ref="chart-memory"></canvas>
					</div>
				</div>
			);
		}
	}

}