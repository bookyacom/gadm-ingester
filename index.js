const vorpal = require('vorpal')();
const vorpalLog = require('vorpal-log');
const scraper = require('./modules/scraper');
const settings = require('./config/constant');
const sqlGenerator = require('./modules/sql-generator');
const postgreSql = require('./modules/postgre-sql');
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
 .action((args, callback) => {
	settings.logger.info('Starting generating sql');
	sqlGenerator.generate().then(message => {
		console.log(message);
		callback();
	}).catch(err => {
		console.log(err);
		callback();
	});
});

vorpal
 .command('importSql', 'Export data to postgresql')
 .option('-h, --hostname <hostName>', 'postgresql Host Name.')
 .option('-u, --user <userName>', 'postgresql User Name.')
 .option('-p, --password <Password>', 'postgresql Password.')
 .option('-d, --database <databaseName>', 'postgresql Database Name.')
 .option('-t, --table <tableName>', 'postgresql table Name.')
 .action((args, callback) => {
	settings.logger.info('Starting importing sql');
	postgreSql.importSql(args.options).then(message => {
		console.log(message);
		callback();
	}).catch(err => {
		console.log(err);
		callback();
	});
});
