'use strict';

const path = require('path');

module.exports = function(context) {

	const hooks = context.hooks;
	const userHome = context.environment.userHome;
	const fs = context.fileSystemJetpack;
	const notifier = context.notifier;
	const React = context.React;

	let configureIntelliJ = (event, site) => {

		let sitePath = site.path.replace('~/', userHome + '/').replace(/\/+$/,'') + '/';

		let publicCWD = fs.cwd(path.join(sitePath, './app/public'));

		let phpXML = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="PhpProjectServersManager">
    <servers>
      <server host="${site.domain}" id="${Math.round(Math.random() * 10000000)}" name="Pressmatic" use_path_mappings="true">
        <path_mappings>
          <mapping local-root="$PROJECT_DIR$" remote-root="/app/public" />
        </path_mappings>
      </server>
    </servers>
  </component>
</project>`;

		let PressmaticXML = `<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="Pressmatic" type="PhpWebAppRunConfigurationType" factoryName="PHP Web Application" singleton="true" server_name="Pressmatic">
    <method />
  </configuration>
</component>`;

		publicCWD.write('./.idea/php.xml', phpXML);
		publicCWD.write('./.idea/runConfigurations/Pressmatic.xml', PressmaticXML);

		event.target.setAttribute('disabled', 'true');

		notifier.notify({
			title: 'Xdebug',
			message: 'IntelliJ IDEs have been configured for Xdebug.'
		});

	};

	hooks.addContent('siteInfoUtilities', (site) => {

		return (
			<li key="intellij-xdebug-integration"><strong>Xdebug</strong>
				<p>
					<button className="btn btn-flat btn-inline" onClick={(event) => {configureIntelliJ(event, site)}} ref="configure-intellij">Configure PhpStorm and IntelliJ IDEs</button>
				</p>
			</li>
		);

	});

};