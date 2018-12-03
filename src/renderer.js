import React from 'react';
import SiteInfoStats from './SiteInfoStats';

module.exports = function (context) {

	const hooks = context.hooks;
	const { Route } = context.ReactRouter;

	hooks.addContent('routesSiteInfo', () => <Route key="site-info-stats" path="/site-info/:siteID/stats"
		render={(props) => <SiteInfoStats {...props} dockerode={context.docker.docker()}/>} />);

	hooks.addFilter('siteInfoMoreMenu', function (menu, site) {

		menu.push({
			label: 'Stats',
			enabled: !this.context.router.isActive(`/site-info/${site.id}/stats`),
			click: () => {
				context.events.send('goToRoute', `/site-info/${site.id}/stats`);
			},
		});

		return menu;

	});

};
