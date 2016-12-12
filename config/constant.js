let Settings = {};
if (process.env.NODE_ENV === 'test') {
	Settings = {
		url: 'http://gadm.org/country',
		downloadUrl: 'http://128.120.228.172/data/gadm2.8/shp/XXXX_adm_shp.zip',
		downloadPath: './test/downloads/zip/',
		sqlPath: './test/downloads/sql/',
		logger: {},
		schemaFile: './config/schema.sql'
	};
} else {
	Settings = {
		url: 'http://gadm.org/country',
		downloadUrl: 'http://128.120.228.172/data/gadm2.8/shp/XXXX_adm_shp.zip',
		downloadPath: './downloads/zip/',
		sqlPath: './downloads/sql/',
		logger: {},
		schemaFile: './config/schema.sql'
	};
}

module.exports = Settings;
