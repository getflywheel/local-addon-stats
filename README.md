# Pressmatic Addon: Stats

Graphs and resource stats for Pressmatic sites.

![Pressmatic Addon: Stats Screenshot](/screenshot.png?raw=true)

## Installation

Clone or download a release of this addon and place the folder into the following directory depending on your platform:

- macOS: ~/Library/Application Support/Pressmatic/addons

If you chose to clone instead of downloading a release you will need to use npm to install any production dependencies. This can be done by opening the directory in your shell of choice and typing `npm i --production`.

## Developing

### Pressmatic Addon API

This addon interfaces with Pressmatic using the [Pressmatic Addon API](https://pressmatic.gitbooks.io/addon-api/content/).

### Installing Dev Dependencies
`npm install`

### Folder Structure
All files in `src` will be transpiled to `lib` using babel. Anything in `lib` will be overwritten.

### Transpiling
`npm run-script build`

## Dependencies

- [lodash](https://github.com/lodash/lodash): Lodash modular utilities.
- [smoothie](https://github.com/joewalnes/smoothie): Smoothie Charts: smooooooth JavaScript charts for realtime streaming data

## Dev Dependencies

- [babel](https://github.com/babel/babel/tree/master/packages): Turn ES6 code into readable vanilla ES5 with source maps
- [babel-cli](https://github.com/babel/babel/tree/master/packages): Babel command line.
- [babel-preset-es2015](https://github.com/babel/babel/tree/master/packages): Babel preset for all es2015 plugins.
- [babel-preset-react](https://github.com/babel/babel/tree/master/packages): Babel preset for all React plugins.
- [babel-preset-stage-0](https://github.com/babel/babel/tree/master/packages): Babel preset for stage 0 plugins


## License

MIT