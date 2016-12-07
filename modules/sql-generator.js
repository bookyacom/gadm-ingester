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

		function generate() {
			// return convertShapeFileToSql('./downloads/zip/India/IND_adm2.shp', 'IND_adm1.shp');
			return new Promise((resolve, reject) => {
				fs.readdir(settings.downloadPath, (error, files) => {
					if (error) {
						reject(error);
					}
					files.filter(file => {
						return file.substr(-4) === '.zip';
					})
					.forEach(file => {
						processShapeFileFromZip(file);
					});
				});
			});
		}

		function processShapeFileFromZip(file) {
			fs.createReadStream(settings.downloadPath + file).pipe(unzip.Extract({path: settings.downloadPath + file.slice(0, -4)}))
			.on('finish', response => {
				settings.logger.info('unzip file' + file);
				processShapeFileInFolder(file.slice(0, -4));
			});
		}

		function processShapeFileInFolder(folderName) {
			// let sql = '';
			let folder = settings.downloadPath + folderName;
			fs.readdir(folder, (error, files) => {
				if (error) {
					return error;
				}
				files.filter(file => {
					return file.substr(-4) === '.shp';
				})
				.forEach(file => {
					convertShapeFileToSql(folder + '/' + file, file).then(response => {
						if (!fs.existsSync(settings.sqlPath + folderName)) {
							fs.mkdirSync(settings.sqlPath + folderName);
						}
						fs.writeFile(settings.sqlPath + folderName + '/' + file.slice(0, -4) + '.sql', response, function (err) {
							if (err) {
								settings.logger.error(err);
								return err;
							}
						});
					});
				});
			});
		}

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
							settings.logger.log('Completed sql conversion for file' + file);
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
								if (result.value.properties.ENGTYPE_1 === 'Sovereign Base Area') {
									type = 'provience';
									provience = result.value.properties.NAME_1;
									shapefileFound = true;
								} else if (result.value.properties.ENGTYPE_1 === 'Province') {
									type = 'provience';
									provience = result.value.properties.NAME_1;
									shapefileFound = true;
								} else if (result.value.properties.ENGTYPE_1 === 'State')	{
									type = 'state';
									state = result.value.properties.NAME_1;
									shapefileFound = true;
								} else if (result.value.properties.ENGTYPE_1 === 'Union Territory')	{
									type = 'provience';
									provience = result.value.properties.NAME_1;
									shapefileFound = true;
								} else {
									settings.logger.log(result.value.properties);
								}
							} else if ('ENGTYPE_2' in result.value.properties) {
								if (result.value.properties.ENGTYPE_2 === 'District') {
									type = 'district';
									district = result.value.properties.NAME_2;
									state = result.value.properties.NAME_1;
									shapefileFound = true;
								} else {
									settings.logger.log(result.value.properties);
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
									settings.logger.log(result.value.type);
								}
								sql = sql + 'INSERT INTO locations (name,country, pg_zone, type, provience, district, state)  VALUES (\'' + name + '\',\'' + country + '\',' + pgZone + ',\'' + type + '\',\'' + provience + '\',\'' + district + '\',\'' + state + '\');';
								return source.read().then(readSourceFile);
							}
						}
					}))
				.catch(err => {
					settings.logger.log('Failed sql conversion for file' + file);
					settings.logger.log(err.stack);
					reject(err.stack);
				});
			});
		}
