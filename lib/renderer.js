'use strict';

var path = require('path');

module.exports = function (context) {

	var hooks = context.hooks;
	var React = context.React;
	var _context$ReactRouter = context.ReactRouter,
	    Link = _context$ReactRouter.Link,
	    Route = _context$ReactRouter.Route;


	var SiteInfoStats = require('./SiteInfoStats')(context);

	hooks.addContent('routesSiteInfo', function () {
		return React.createElement(Route, { key: 'site-info-stats', path: '/site-info/:siteID/stats', component: SiteInfoStats });
	});

	hooks.addFilter('siteInfoMoreMenu', function (menu, site) {

		menu.push({
			label: 'Stats',
			enabled: !this.context.router.isActive('/site-info/' + site.id + '/stats'),
			click: function click() {
				context.events.send('goToRoute', '/site-info/' + site.id + '/stats');
			}
		});

		return menu;
	});
};