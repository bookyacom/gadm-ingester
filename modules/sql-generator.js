		let fs = require('fs');
		let shapefile = require('shapefile');
		let unzip = require('unzip');
		const settings = require('../config/constant');

		module.exports = sqlGenerator();

		function sqlGenerator() {
			const sqlGenerator = {
				generate
			};
			return sqlGenerator;
		}
/*
 * Function to generate  sql file from zip folder
 */
		function generate() {
			// return convertShapeFileToSql('./downloads/zip/India/IND_adm2.shp', 'IND_adm1.shp');
			return new Promise((resolve, reject) => {
				let totalZipCount = 0;
				let completedZipCount = 0;
				let failedZipCount = 0;
				fs.readdir(settings.downloadPath, (error, files) => {
					if (error) {
						reject(error);
					}
					files.filter(file => {
						return file.substr(-4) === '.zip';
					})
					.forEach(file => {
						totalZipCount++;
						processShapeFileFromZip(file).then(response => {
							completedZipCount++;
							if (totalZipCount === (completedZipCount + failedZipCount)) {
								return resolve('Completed extracting all zip');
							}
						})
						.catch(err => {
							failedZipCount++;
							if (totalZipCount === (completedZipCount + failedZipCount)) {
								return resolve('Completed extracting all zip');
							}
						});
					});
				});
			});
		}

/*
 * Function for processing zip folder
 */
		function processShapeFileFromZip(file) {
			return new Promise((resolve, reject) => {
				fs.createReadStream(settings.downloadPath + file).pipe(unzip.Extract({path: settings.downloadPath + file.slice(0, -4)}))
				.on('close', response => {
					settings.logger.info('unzip file ' + file);
					processShapeFileInFolder(file.slice(0, -4)).then(response => {
						return resolve(response);
					})
					.catch(err => {
						return reject(err);
					});
				});
			});
		}

/*
 * Function for processing files in zip folder
 */
		function processShapeFileInFolder(folderName) {
			// let sql = '';
			return new Promise((resolve, reject) => {
				let totalFileCount = 0;
				let completedFileCount = 0;
				let failedFileCount = 0;
				let folder = settings.downloadPath + folderName;
				fs.readdir(folder, (error, files) => {
					if (error) {
						reject('Failed opening sql folder ' + folder);
					}
					files.filter(file => {
						return file.substr(-4) === '.shp';
					})
					.forEach(file => {
						totalFileCount++;
						convertShapeFileToSql(folder + '/' + file, file).then(response => {
							if (!fs.existsSync(settings.sqlPath + folderName)) {
								fs.mkdirSync(settings.sqlPath + folderName);
							}
							fs.writeFile(settings.sqlPath + folderName + '/' + file.slice(0, -4) + '.sql', (response, err) => {
								if (err) {
									settings.logger.error(err);
								}
								completedFileCount++;
								if (completedFileCount + failedFileCount === totalFileCount) {
									return resolve('Completed processing Folder');
								}
							});
						})
						.catch(err => {
							failedFileCount++;
							if (completedFileCount + failedFileCount === totalFileCount) {
								return resolve('Completed processing Folder');
							}
						});
					});
				});
			});
		}

/*
 * Function for converting a shape files to sql
 */

		function convertShapeFileToSql(file, fileName) {
			return new Promise((resolve, reject) => {
				let sql = '';
				let name = '';
				let	state = '';
				let	district = '';
				let	country = '';
				let	type = '';
				let provience = '';
				let shapefileFound = false;
				shapefile.open(file)
				.then(source => source.read()
					.then(function readSourceFile(result) {
						if (result.done) {
							settings.logger.info('Completed sql conversion for file ' + file);
							return resolve(sql);
						}
						name = fileName.slice(0, -4);
						type = '';
						provience = '';
						state = '';
						district = '';
						shapefileFound = false;
						if ('properties' in result.value) {
							if ('ENGTYPE_1' in result.value.properties) {
								if (result.value.properties.ENGTYPE_1 === 'State')	{
									type = 'state';
									state = result.value.properties.NAME_1;
									shapefileFound = true;
								} else	{
									type = 'provience';
									provience = result.value.properties.NAME_1;
									shapefileFound = true;
								}
							} else if ('ENGTYPE_2' in result.value.properties) {
								if (result.value.properties.ENGTYPE_2 === 'District') {
									type = 'district';
									district = result.value.properties.NAME_2;
									state = result.value.properties.NAME_1;
									shapefileFound = true;
								} else {
									type = 'district';
									district = result.value.properties.NAME_2;
									state = result.value.properties.NAME_1;
									shapefileFound = true;
								}
							}
							if ('NAME_ISO' in result.value.properties)								{
								type = 'country';
								country = result.value.properties.NAME_ISO;
								shapefileFound = true;
							} else							{
								country = result.value.properties.NAME_0;
							}
							if (shapefileFound)							{
								let pgZone = '';
								if (result.value.geometry.type === 'Polygon')								{
									pgZone = 'ST_Multi(ST_GeomFromGeoJSON(\'' + JSON.stringify(result.value.geometry) + '\'))';
								} else if (result.value.geometry.type === 'MultiPolygon')								{
									pgZone = 'ST_GeomFromGeoJSON(\'' + JSON.stringify(result.value.geometry) + '\')';
								} else								{
									settings.logger.info(result.value.type);
								}
								sql = sql + 'INSERT INTO TABLE_NAME (name,country, pg_zone, type, provience, district, state, created_at, updated_at)  VALUES (\'' + name + '\',\'' + country + '\',' + pgZone + ',\'' + type + '\',\'' + provience + '\',\'' + district + '\',\'' + state + '\',\'' + new Date().toISOString() + '\',\'' + new Date().toISOString() + '\');';
								return source.read().then(readSourceFile);
							}
						}
					}))
				.catch(err => {
					settings.logger.info('Failed sql conversion for file ' + file);
					settings.logger.info(err.stack);
					reject(err.stack);
				})
				.catch(err => {
					reject(err.stack);
				});
			});
		}
