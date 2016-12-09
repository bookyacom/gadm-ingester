const fs = require('fs');
const pg = require('pg');
const Queue = require('promise-queue');
const LineByLineReader = require('line-by-line');
const settings = require('../config/constant');

const config = {
	port: 5432,
	max: 10,
	idleTimeoutMillis: 30000
};

let pool;
let filesCount = 0;
let sucessImportCount = 0;
let failedImportCount = 0;
const importQueue = new Queue(1, Infinity);

module.exports = postgreSql();

function postgreSql() {
	const postgreSql = {
		importSql
	};
	return postgreSql;
}
/*
 * Function for importing sql to postgreSql from  sql folder
 */
function importSql(options) {
	return new Promise((resolve, reject) => {
		config.user = options.user;
		config.database = options.database;
		config.password = options.password;
		config.host = options.hostname;
		pool = new pg.Pool(config);
		importSqlFromFile(settings.schemaFile, options).then(() => {
			settings.logger.info('Sucessfully imported schema File');
			fs.readdir(settings.sqlPath, (error, folders) => {
				if (error) {
					reject(error);
				}
				folders.forEach(folder => {
					if (fs.lstatSync(settings.sqlPath + folder).isDirectory()) {
						processSqlFolder(folder, resolve, reject, options);
					}
				});
			});
		})
   .catch(err => {
	settings.logger.info('Schema Export Failed');
	settings.logger.info(err);
	resolve('Schema Error');
});
	});
}

/*
Function for processing sql folder
*/
function processSqlFolder(folder, resolve, reject, options) {
	fs.readdir(settings.sqlPath + folder + '/', (error, files) => {
		if (error) {
			reject(error);
		}
		files.filter(file => {
			return file.substr(-4) === '.sql';
		})
       .forEach(file => {
	filesCount++;
	const sqlFile = settings.sqlPath + folder + '/' + file;
	importQueue.add(() => {
		return importSqlFromFile(sqlFile, options);
	})
    .then(() => {
	sucessImportCount++;
	settings.logger.info('Sucessfull Import For Counrty ' + folder.replace(/_/g, ' ') + ' file ' + sqlFile);
	if (filesCount === sucessImportCount + failedImportCount) {
		return resolve('Completed sql generation sucess count ' + sucessImportCount + ' Failed Count ' + failedImportCount);
	}
})
.catch(() => {
	failedImportCount++;
	settings.logger.info('Failed Import For Counrty ' + folder.replace(/_/, ' ') + ' file ' + sqlFile);
	if (filesCount === sucessImportCount + failedImportCount) {
		return resolve('Completed sql generation sucess count ' + sucessImportCount + ' Failed Count ' + failedImportCount);
	}
});
});
	});
}

/*
 * Function for importing an sql file to postgreSql
 */

function importSqlFromFile(file, options)	{
	return new Promise((resolve, reject) => {
		const status = {};
		let sqlQuey = '';
		settings.logger.info('Starting processing' + file);

		pool.connect((err, client, done) => {
			const lr = new LineByLineReader(file);

			lr.on('error', err => {
				done();
				status.sucess = false;
				status.message = 'Error reading file ' + err;
				return reject(status);
			});

			lr.on('line', line => {
				lr.pause();
				sqlQuey = line.toString().replace(/TABLE_NAME/g, options.table);
				if (err) {
					status.sucess = false;
					status.message = 'error fetching client from pool ' + err;
					settings.logger.info(status);
					lr.resume();
				}
				client.query(sqlQuey, () => {
					lr.resume();
				});

				pool.on('error', err => {
					done();
					status.sucess = false;
					status.message = 'idle client error ' + err.message;
					settings.logger.info(status);
				});
			});

			lr.on('end', () => {
				done();
				status.sucess = true;
				status.message = 'Sucess on importing sql';
				return resolve(status);
			});
		});
	});
}
