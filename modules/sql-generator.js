const fs = require('fs');
const shapefile = require('shapefile');
const extract = require('extract-zip');
const Queue = require('promise-queue');
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
			// return convertShapeFileToSql('./downloads/zip/India/IND_adm2.shp');
	return new Promise((resolve, reject) => {
		let totalZipCount = 0;
		let completedZipCount = 0;
		let failedZipCount = 0;
		const processQueue = new Queue(5, Infinity);
		fs.readdir(settings.downloadPath, (error, files) => {
			if (error) {
				reject(error);
			}
			files.filter(file => {
				return file.substr(-4) === '.zip';
			})
      .forEach(file => {
	totalZipCount++;
	processQueue.add(() => {
		return processShapeFileFromZip(file);
	})
        .then(status => {
	settings.logger.info(status.message);
	settings.logger.info('Sql generation pending folders ' + (processQueue.getQueueLength() + processQueue.getPendingLength()));
	completedZipCount++;
	if (totalZipCount === (completedZipCount + failedZipCount)) {
		return resolve('Completed sql generation sucess count ' + completedZipCount + ' Failed Count ' + failedZipCount);
	}
})
        .catch(err => {
	settings.logger.info(err.message);
	settings.logger.info('Sql generation pending folders ' + (processQueue.getQueueLength() + processQueue.getPendingLength()));
	failedZipCount++;
	if (totalZipCount === (completedZipCount + failedZipCount)) {
		return resolve('Completed sql generation sucess count ' + completedZipCount + ' Failed Count ' + failedZipCount);
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
		const extractPath = {};
		const status = {};
		extractPath.dir = settings.downloadPath + file.slice(0, -4);
		extract(settings.downloadPath + file, extractPath, err => {
			if (err) {
				status.message = 'Failed processing Folder ' + file + ' ' + err;
				status.sucess = true;
				return reject(status);
			}
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
		const status = {};
		const folder = settings.downloadPath + folderName;
		fs.readdir(folder, (error, files) => {
			if (error) {
				reject('Failed opening sql folder ' + folder);
			}
			files.filter(file => {
				return file.substr(-4) === '.shp';
			})
      .forEach(file => {
	totalFileCount++;
	convertShapeFileToSql(folder + '/' + file, folderName, file).then(() => {
		completedFileCount++;
		if (completedFileCount + failedFileCount === totalFileCount) {
			status.message = 'Completed processing Folder ' + folderName;
			status.sucess = true;
			resolve(status);
		}
	})
        .catch(() => {
	failedFileCount++;
	status.message = 'Failed processing Folder ' + folderName;
	status.sucess = true;
	reject(status);
});
});
		});
	});
}

/*
 * Function for converting a shape files to sql
 */

function convertShapeFileToSql(file, folderName, fileName) {
	return new Promise((resolve, reject) => {
		let sql = '';
		let name = '';
		let	state = '';
		let	district = '';
		let	country = '';
		let	type = '';
		let provience = '';
		let shapefileFound = false;
		let regionTwo = '';
		let regionOne = '';
		if (!fs.existsSync(settings.sqlPath + folderName)) {
			fs.mkdirSync(settings.sqlPath + folderName);
		}
		const sqlFile = fs.createWriteStream(settings.sqlPath + folderName + '/' + fileName.slice(0, -4) + '.sql');

		shapefile.open(file)
    .then(source => source.read()
     .then(function readSourceFile(result) {
	if (result.done) {
		settings.logger.info('Completed sql conversion for file ' + file);
		sqlFile.end();
		return resolve('Completed sql conversion for file ' + file);
	}
	name = '';
	type = '';
	provience = '';
	state = '';
	district = '';
	regionTwo = '';
	regionOne = '';
	shapefileFound = false;
	if ('properties' in result.value) {
		if ('ENGTYPE_1' in result.value.properties) {
			type = 'state';
			state = result.value.properties.NAME_1;
			name = result.value.properties.NAME_1;
			shapefileFound = true;
		} else if ('ENGTYPE_2' in result.value.properties) {
			type = 'district';
			district = result.value.properties.NAME_2;
			name = result.value.properties.NAME_2;
			state = result.value.properties.NAME_1;
			shapefileFound = true;
		}
		if ('NAME_ISO' in result.value.properties)								{
			type = 'country';
			country = result.value.properties.NAME_ISO;
			name = result.value.properties.NAME_ISO;
			regionOne = result.value.properties.UNREGION1;
			regionTwo = result.value.properties.UNREGION2;
			shapefileFound = true;
		} else							{
			country = result.value.properties.NAME_0;
		}
		if (shapefileFound) {
			let pgZone = '';
			if (result.value.geometry.type === 'Polygon')								{
				pgZone = 'ST_Multi(ST_GeomFromGeoJSON(\'' + JSON.stringify(result.value.geometry) + '\'))';
			} else if (result.value.geometry.type === 'MultiPolygon')								{
				pgZone = 'ST_GeomFromGeoJSON(\'' + JSON.stringify(result.value.geometry) + '\')';
			} else								{
				settings.logger.info(result.value.type);
			}
			sql = 'INSERT INTO TABLE_NAME (name,country, pg_zone, type, provience, district, state, region_1, region_2, created_at, updated_at)  VALUES (\'' + name + '\',\'' + country + '\',' + pgZone + ',\'' + type + '\',\'' + provience + '\',\'' + district + '\',\'' + state + '\',\'' + regionOne + '\',\'' + regionTwo + '\',\'' + new Date().toISOString() + '\',\'' + new Date().toISOString() + '\');\n';
			sqlFile.write(sql);
			return source.read().then(readSourceFile);
		}
		return resolve(sql);
	}
}))
    .catch(err => {
	settings.logger.info('Failed sql conversion for file ' + file);
	settings.logger.info(err.stack);
	return reject(err.stack);
})
    .catch(err => {
	return reject(err.stack);
});
	});
}
