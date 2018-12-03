import React from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';
import throttle from 'lodash.throttle';
import round from 'lodash.round';

const timestampFormatter = (date) => {
	const pad = (number) => {
		return (number < 10 ? '0' : '') + number;
	};

	return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
};

class ExpandingCanvas extends React.Component {

	constructor (props) {
		super(props);

		this.onParentResize = this.onParentResize.bind(this);
	}

	componentDidMount () {
		this.createResizeObserver();
	}

	componentWillUnmount () {

		if (this.ro) {
			this.ro.disconnect();
			delete this.ro;
		}

	}

	createResizeObserver () {

		const canvas = this.props.canvasRef.current;

		this.ro = new ResizeObserver(throttle(this.onParentResize, 100));
		this.ro.observe(canvas.parentElement);

	}

	onParentResize () {

		const canvas = this.props.canvasRef.current;

		if (!canvas || !canvas.parentElement) {
			return;
		}

		canvas.width = canvas.parentElement.clientWidth;
		canvas.height = canvas.parentElement.clientHeight;

	}

	render () {

		return <canvas ref={this.props.canvasRef} />;

	}

}

export default class SiteInfoStats extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			cpu: null,
			memory: null,
			memoryMax: null,
		};

		this.cpuChartCanvas = React.createRef();
		this.memoryChartCanvas = React.createRef();
	}

	componentDidMount () {

		this.startCPUChart();
		this.startMemoryChart();

		this.getDockerStats();

	}

	componentWillUnmount () {

		if (this.statsStream) {
			this.statsStream.destroy();
		}

	}

	getDockerStats () {

		const siteID = this.props.match.params.siteID;
		const site = this.props.sites[siteID];

		const container = this.props.dockerode.getContainer(site.container);

		const stats = container.stats();

		stats.then((statsStream) => {
			/* Destroy existing stream if present. */
			if (this.statsStream) {
				this.statsStream.destroy();
			}

			this.statsStream = statsStream;

			this.statsStream.on('data', (statsData) => {
				let data;

				try {
					data = JSON.parse(statsData.toString());
				} catch (e) {
					return;
				}

				if (!this.memorySeries || !this.cpuSeries) {
					return;
				}

				const time = new Date(data.read);

				if (data.cpu_stats) {
					const cpuDelta = data.cpu_stats.cpu_usage.total_usage - data.precpu_stats.cpu_usage.total_usage;
					const systemDelta = data.cpu_stats.system_cpu_usage - data.precpu_stats.system_cpu_usage;

					const cpuUsagePercentage = round((cpuDelta / systemDelta) * 100, 2);

					this.cpuSeries.append(time, cpuUsagePercentage);

					this.setState({ cpu: cpuUsagePercentage });
				}

				if (data.memory_stats) {
					const byteToMebibyte = 1.049e+6;
					const usage = round(data.memory_stats.usage / byteToMebibyte, 2);

					this.memorySeries.append(time, usage);

					this.memoryChart.options.maxValue = Math.round(data.memory_stats.limit / byteToMebibyte);
					this.memoryChart.options.minValue = 0;
					this.memoryChart.updateValueRange();

					this.setState({ memory: usage });
				}
			});
		});

	}

	startCPUChart () {

		this.cpuChart = new SmoothieChart({
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

		this.cpuChart.addTimeSeries(this.cpuSeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
		this.cpuChart.streamTo(this.cpuChartCanvas.current, 1000);

	}

	startMemoryChart () {

		this.memoryChart = new SmoothieChart({
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

		this.memoryChart.addTimeSeries(this.memorySeries, { lineWidth: 1, strokeStyle: '#51bb7b' });
		this.memoryChart.streamTo(this.memoryChartCanvas.current, 1000);


	}

	render () {

		return (
			<div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '15px 0' }}>
				<h4 className="padded-horizontally-more" style={{ margin: '0 30px 15px', flex: '0' }}>
					CPU Usage
					<span style={{ float: 'right', fontFamily: 'monospace', color: '#51bb7b' }}>{this.state.cpu !== null ? this.state.cpu + '%' : ''}</span>
				</h4>

				<div style={{ flex: '1', overflow: 'hidden' }}>
					<ExpandingCanvas canvasRef={this.cpuChartCanvas} />
				</div>

				<h4 className="padded-horizontally-more" style={{ margin: '30px 15px', flex: '0' }}>
					Memory Usage
					<span style={{ float: 'right', fontFamily: 'monospace', color: '#51bb7b' }}>{this.state.memory !== null ? this.state.memory + ' MiB' : ''}</span>
				</h4>

				<div style={{ flex: '1', overflow: 'hidden' }}>
					<ExpandingCanvas canvasRef={this.memoryChartCanvas} />
				</div>
			</div>
		);
	}
};
