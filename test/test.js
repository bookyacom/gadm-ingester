const fs = require('fs');
const chai = require('chai');
const scraper = require('../modules/scraper');
const settings = require('../config/constant.js');
const sqlGenerator = require('../modules/sql-generator.js');

const expect = chai.expect;
chai.use(require('chai-fs'));

const deleteFolderRecursive = function (path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach((file, index) => {
			const curPath = path + '/' + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

describe('gadm-ingester Test Case', function () {
	this.timeout(20000);
	describe('Downloading zip folder from gadm', () => {
		before(() => {
			if (fs.existsSync(settings.downloadPath + 'XAD.zip')) {
				fs.unlink(settings.downloadPath + 'XAD.zip');
			}
			if (fs.existsSync(settings.downloadPath + 'Zimbabwe.zip')) {
				fs.unlink(settings.downloadPath + 'Zimbabwe.zip');
			}
		});

		it('should throw message file not available', () => {
			return scraper.downloadZip(null, null).catch(data => {
				expect(data.status).to.not.be.false;
			});
		});
		it('Download a file failure from gadm', () => {
			return scraper.downloadZip('_XAD', 'XAD').catch(data => {
				expect(settings.downloadPath + 'XAD.zip').to.not.be.a.path();
				expect(data.status).to.not.be.false;
			});
		});
		it('Download a file from gadm', () => {
			return scraper.downloadZip('XAD', 'XAD').then(data => {
				expect(settings.downloadPath + 'XAD.zip').to.be.a.file();
				expect(data.sucess).to.be.true;
			});
		});
		it('Scrape from gadm and check download zip exists', () => {
			return scraper.download().then(data => {
				expect(settings.downloadPath + 'Zimbabwe.zip').to.be.a.file();
			});
		});
	});

	describe('Generating sql from downloaded zip folder', () => {
		before(() => {
			if (fs.existsSync(settings.downloadPath + 'XAD')) {
				deleteFolderRecursive(settings.downloadPath + 'XAD');
			}
			if (fs.existsSync(settings.downloadPath + 'Zimbabwe')) {
				deleteFolderRecursive(settings.downloadPath + 'Zimbabwe');
			}
			if (fs.existsSync(settings.sqlPath + 'Zimbabwe')) {
				deleteFolderRecursive(settings.sqlPath + 'Zimbabwe');
			}
			if (fs.existsSync(settings.sqlPath + 'XAD')) {
				deleteFolderRecursive(settings.sqlPath + 'XAD');
			}
			if (fs.existsSync(settings.sqlPath + 'sample')) {
				deleteFolderRecursive(settings.sqlPath + 'sample');
			}
		});

		it('converting shape file to sql', () => {
			return sqlGenerator.convertShapeFileToSql(settings.downloadPath + 'sample/ZWE_adm1.shp', 'sample', 'sample.shp').then(data => {
				expect(settings.sqlPath + 'sample/sample.sql').to.be.a.file();
			});
		});
		it('converting shape file from folder', () => {
			return sqlGenerator.processShapeFileInFolder('sample').then(data => {
				expect(settings.sqlPath + 'sample/ZWE_adm1.sql').to.be.a.file();
			});
		});
		it('converting shape file from downloaded zip', () => {
			return sqlGenerator.generate().then(data => {
				expect(settings.sqlPath + 'Zimbabwe/ZWE_adm1.sql').to.be.a.file();
				expect(settings.sqlPath + 'XAD/XAD_adm0.sql').to.be.a.file();
			});
		});
	});
});

