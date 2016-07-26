'use strict';

const path = require('path');

module.exports = function(context) {

	const hooks = context.hooks;
	const React = context.React;
	const {Link, Route} = context.ReactRouter;

	const SiteInfoStats = require('./SiteInfoStats')(context);

	hooks.addContent('routesSiteInfo', () => {
		return <Route key="site-info-stats" path="/site-info/:siteID/stats" component={SiteInfoStats}/>
	});
	
	hooks.addFilter('siteInfoMoreMenu', function(menu, site) {
		
		menu.push({
			label: 'Stats',
			enabled: !this.context.router.isActive(`/site-info/${site.id}/stats`),
			click: () => {
				context.events.send('goToRoute', `/site-info/${site.id}/stats`);
			}
		});

		return menu;

	});

};