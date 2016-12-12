const fs = require('fs');
const cheerio = require('cheerio');
const got = require('got');
const Queue = require('promise-queue');
const settings = require('../config/constant');

module.exports = scraper();

function scraper() {
	const scraper = {
		download,
		downloadZip
	};
	return scraper;
}

/*
 * Function for scraping country name from http://gadm.org/gadmcountry and passing it to download function
 */

function download() {
	return new Promise((resolve, reject) => {
		return got(settings.url)
    .then(response => {
	let $ = '';
	if (process.env.NODE_ENV === 'test') {
		$ = cheerio.load('<html><body><p><a href="http://gadm.org/gadmcountry">Country</a><br><select name="cnt"><option value="ZWE_Zimbabwe_3">Zimbabwe</option></select></p></body></html>');
	}	else {
		$ = cheerio.load(response.body);
	}
	const downloadQueue = new Queue(5, Infinity);
	let countryCount = 0;
	let completedCount = 0;
	let failedCount = 0;
	$('select[name=cnt] option').each(function () {
		const optionValue = $(this).attr('value');
		const optionValueSplit = optionValue.split('_');
		countryCount++;
		downloadQueue.add(() => {
			return downloadZip(optionValueSplit[0], optionValueSplit[1]);
		})
      .then(status => {
	if (process.env.NODE_ENV !== 'test') {
		settings.logger.info(status.message);
	}
	completedCount++;
	if (countryCount === (completedCount + failedCount)) {
		return resolve('Completed Downloading Sucess count ' + completedCount + ' Failed Count ' + failedCount);
	}
})
      .catch(status => {
	if (process.env.NODE_ENV !== 'test') {
		settings.logger.info(status.message);
	}
	failedCount++;
	if (countryCount === (completedCount + failedCount)) {
		return resolve('Completed Downloading Sucess count ' + completedCount + ' Failed Count ' + failedCount);
	}
});
	});
})
    .catch(error => {
	return reject(error);
});
	});
}

/*
 * Function to download shape file from http://gadm.org
 */

function downloadZip(fileName, countryName) {
	return new Promise((resolve, reject) => {
		const status = {};
		if (process.env.NODE_ENV !== 'test') {
			settings.logger.info('Starting downloading ' + countryName);
		}
		if (!fileName || !countryName) {
			status.message = 'Error with filename';
			status.sucess = false;
			return reject(status);
		}
		const file = fs.createWriteStream(settings.downloadPath + countryName.replace(/ /g, '_') + '.zip');
		const downloadRequest = got.stream(settings.downloadUrl.replace('XXXX', fileName));

		downloadRequest.pipe(file).on('finish', () => {
			file.close();
			status.message = 'Completed downloading ' + countryName;
			status.sucess = true;
			return resolve(status);
		});
		downloadRequest.on('error', error => {
			file.close();
			fs.unlinkSync(settings.downloadPath + countryName.replace(/ /g, '_') + '.zip');
			status.message = 'Error on downloading ' + countryName + ' ' + error;
			status.sucess = false;
			return reject(status);
		});
	});
}
