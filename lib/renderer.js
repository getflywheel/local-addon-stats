'use strict';

var path = require('path');

module.exports = function (context) {

		var hooks = context.hooks;
		var userHome = context.environment.userHome;
		var fs = context.fileSystemJetpack;
		var notifier = context.notifier;
		var React = context.React;

		var configureIntelliJ = function configureIntelliJ(event, site) {

				var sitePath = site.path.replace('~/', userHome + '/').replace(/\/+$/, '') + '/';

				var publicCWD = fs.cwd(path.join(sitePath, './app/public'));

				var phpXML = '<?xml version="1.0" encoding="UTF-8"?>\n<project version="4">\n  <component name="PhpProjectServersManager">\n    <servers>\n      <server host="' + site.domain + '" id="' + Math.round(Math.random() * 10000000) + '" name="Pressmatic" use_path_mappings="true">\n        <path_mappings>\n          <mapping local-root="$PROJECT_DIR$" remote-root="/app/public" />\n        </path_mappings>\n      </server>\n    </servers>\n  </component>\n</project>';

				var PressmaticXML = '<component name="ProjectRunConfigurationManager">\n  <configuration default="false" name="Pressmatic" type="PhpWebAppRunConfigurationType" factoryName="PHP Web Application" singleton="true" server_name="Pressmatic">\n    <method />\n  </configuration>\n</component>';

				publicCWD.write('./.idea/php.xml', phpXML);
				publicCWD.write('./.idea/runConfigurations/Pressmatic.xml', PressmaticXML);

				event.target.setAttribute('disabled', 'true');

				notifier.notify({
						title: 'Xdebug',
						message: 'IntelliJ IDEs have been configured for Xdebug.'
				});
		};

		hooks.addContent('siteInfoUtilities', function (site) {

				return React.createElement(
						'li',
						{ key: 'intellij-xdebug-integration' },
						React.createElement(
								'strong',
								null,
								'Xdebug'
						),
						React.createElement(
								'p',
								null,
								React.createElement(
										'button',
										{ className: 'btn btn-flat btn-inline', onClick: function onClick(event) {
														configureIntelliJ(event, site);
												}, ref: 'configure-intellij' },
										'Configure PhpStorm and IntelliJ IDEs'
								)
						)
				);
		});
};