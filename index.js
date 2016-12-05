const vorpal = require('vorpal')();
const vorpalLog = require('vorpal-log');
const scraper = require('./modules/scraper');
const settings = require('./config/constant');
const sqlGenerator = require('./modules/sql-generator');
/*
 * Initialising vopral to work with vorpal Logger
 */
vorpal.use(vorpalLog)
        .delimiter('gadm-ingester $')
        .show();

settings.logger = vorpal.logger;
/*
 * Command for downloading shape file from gadm
 */

vorpal
        .command('download', 'Download shape file from http://gadm.org/ to download/zip folder')
        .action((args, callback) => {
	settings.logger.info('Starting Downloading');
	scraper.download().then(message => {
		console.log(message);
		callback();
	}).catch(err => {
		console.log(err);
		callback();
	});
});

vorpal
        .command('generateSql', 'Generate postgresql from downloaded shape file')
        .action(function (args, callback) {
	sqlGenerator.generate().then(message => {
		console.log(message);
		callback();
	}).catch(err => {
		console.log(err);
		callback();
	});
});
