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
			convertShapeFileToSql(folder + '/' + file).then(response => {
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

function convertShapeFileToSql(file) {
	return new Promise((resolve, reject) => {
		let sql = '';
		shapefile.open(file)
		.then(source => source.read()
			.then(function readSourceFile(result) {
				if (result.done) {
					settings.logger.log('Completed sql conversion for file' + file);
					return resolve(sql);
				}
				sql = sql + ' ST_GeomFromGeoJSON(' + JSON.stringify(result.value.geometry) + ')';
				return source.read().then(readSourceFile);
			}))
		.catch(err => {
			settings.logger.log('Failed sql conversion for file' + file);
			settings.logger.log(err.stack);
		});
	});
}
