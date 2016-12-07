	let fs = require('fs');
	let pg = require('pg');

	const settings = require('../config/constant');

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
			let filesCount = 0;
			let sucessImportCount = 0;
			let failedImportCount = 0;
			importSqlFromFile(settings.schemaFile, options).then(response => {
				settings.logger.log('Sucessfully imported schema File');
				fs.readdir(settings.sqlPath, (error, folders) => {
					if (error) {
						reject(error);
					}
					folders.forEach(folder => {
						if (fs.lstatSync(settings.sqlPath + folder).isDirectory()) {
							fs.readdir(settings.sqlPath + folder + '/', (error, files) => {
								if (error) {
									reject(error);
								}
								files.filter(file => {
									return file.substr(-4) === '.sql';
								})
								.forEach(file => {
									filesCount++;
									let sqlFile = settings.sqlPath + folder + '/' + file;
									importSqlFromFile(sqlFile, options).then(response => {
										sucessImportCount++;
										settings.logger.log('Sucessfull Import For Counrty ' + folder.replace(/_/g, ' ') + ' file ' + sqlFile);
										if (filesCount === sucessImportCount + failedImportCount) {
											resolve('Sucessfull Import of ' + sucessImportCount + ' file  and failed for ' + failedImportCount);
										}
									})
									.catch(err => {
										failedImportCount++;
										settings.logger.log('Failed Import For Counrty ' + folder.replace(/_/, ' ') + ' file ' + sqlFile);
										settings.logger.log(err);
										if (filesCount === sucessImportCount + failedImportCount) {
											resolve('Sucessfull Import of ' + sucessImportCount + ' file  and failed for ' + failedImportCount);
										}
									});
								});
							});
						}
					});
				});
			});
		})
		.catch(err => {
			settings.logger.log('Schema Export Failed');
			settings.logger.log(err);
			resolve('Schema Error');
		});
	}

/*
 * Function for importing an sql file to postgreSql
 */

	function importSqlFromFile(file, options)	{
		return new Promise((resolve, reject) => {
			let config = {
				user: options.user,
				database: options.database,
				password: options.password,
				host: options.hostname,
				port: 5432,
				max: 10,
				idleTimeoutMillis: 30000
			};

			let pool = new pg.Pool(config);
			pool.connect((err, client, done) => {
				if (err) {
					reject('error fetching client from pool ' + err);
				}
				let sqlFile = fs.readFileSync(file).toString().replace(/TABLE_NAME/g, options.table);
				client.query(sqlFile, (err, result) => {
					if (err) {
						reject('error running query ' + err);
					}
					done();
					resolve('Sucess on export');
				});
			});
			pool.on('error', (err, client) => {
				reject('idle client error ' + err.message);
			});
		});
	}
