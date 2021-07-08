var express = require("express");
var app = express();
var api = "/api/v1.0/";

'use strict'

const extract = require('extract-zip')
const fs = require('fs')
const path = require('path')
const pcbStackup = require('pcb-stackup')
const GERBERS_DIR = '';
const { v4: uuidv4 } = require('uuid');

var multer = require('multer')
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './resources/uploads');
	},
	filename: function (req, file, cb) {
		cb(null, getRandomFileName() + '-' + file.originalname);
	}
});
const uploadImg = multer({ storage: storage }).single('file');

function getRandomFileName() {
	return uuidv4();
}

var DEFAULT_COLOR = {
	// fr4: '#666',
	// cu: '#58a5e4',
	// cf: '#E5E5E5',
	// sm: '#101009', //#0F670B, #1010F5, #FB0F09, #101009, #DFE90E, #FFFFFF
	// ss: '#fff',
	// sp: '#999',
	// out: '#000',
	fr4: '#666',
	cu: '#ccc',
	cf: '#c93',
	sm: 'rgba(0, 66, 0, 0.75)',
	ss: '#fff',
	sp: '#999',
	out: '#000',
}

var GERBER_FILENAMES = [];
var typeByFilename;
//passsing directoryPath and callback function

function json2array(json) {
	var result = [];
	var keys = Object.keys(json);
	keys.forEach(function (key) {
		result.push(key);
	});
	return result;
}

var stackup;

app.listen(3000, () => {
	console.log("Server running on port 3000");
});

app.get(api + 'test-server', (req, res, next) => {
	res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});

app.post(api + 'uploadFile', function (req, res, next) {
	let file_name;
	uploadImg(req, res, function (err) {
		if (err) {
			console.log(JSON.stringify(err));
			res.json({
				status: 0,
				message: "Error when uploading file zip",
				data: null
			});
		} else {
			file_name = res.req.file.filename;
			let id_file = file_name.split('.').slice(0, -1).join('.');
			let file_folder = "resources/uploads/" + file_name.split('.').slice(0, -1).join('.');
			console.log('The folder name is ' + file_folder);
			file_name = "resources/uploads/" + file_name;
			//console.log(path.resolve(file_folder));
			extract(file_name, { dir: path.resolve(file_folder), onEntry: (entry, zipfile) => {
				entry.fileName = entry.fileName.split("/")[1];
				
			}}, function (err) {
				console.log(err);
				res.json({
					status: 0,
					message: "Error when unzip files",
					data: null
				});
			}).then(() => {

				GERBER_FILENAMES = [];
				renderStackup(file_folder)
					.then(writeStackup)
					.then(() => {
						res.json(
							{
								status: 1,
								message: "success",
								top: stackup.top.svg,
								bottom: stackup.bottom.svg,
								layers: stackup.layers,
								file_folder: file_folder,
								id_file: id_file
							}
						);
					})
					.catch(error => {
						console.error('Error rendering stackup', error);
						res.json({
							status: 0,
							message: "Wrong File name.",
							data: null
						});
					});
			}).catch(() => {
				res.json({
					status: 0,
					message: "Chỉ hỗ trợ file zip.",
					data: null
				});
			})

		}
	});

})

app.get(api + 'test-svg/:fileid', (req, res, next) => {
	//res.json(["Tony","Lisa","Michael","Ginger","Food"]);
	let fileid = req.params["fileid"];
	GERBER_FILENAMES = [];
	renderStackup(fileid)
		.then(writeStackup)
		.then(() => {
			res.json(
				{
					status: 1,
					message: "success",
					top: stackup.top.svg,
					bottom: stackup.bottom.svg,
					layers: stackup.layers
				}
			);
		})
		.catch(error => {
			console.error('Error rendering stackup', error);
			res.json({
				status: 0,
				message: "Wrong File name.",
				data: null
			});
		})
	//res.json(stackup.top.svg);
});

const readFilePromise = (folder) => {
	const directoryPath = path.join(__dirname, folder);
	console.log(directoryPath);

	return new Promise((resolve, reject) => {
		fs.readdir(directoryPath, function (err, files) {
			//handling error
			if (err) {
				reject("error");
				return;
			}

			console.log(files);
			//listing all files using forEach
			files.forEach(function (file) {
				// Do whatever you want to do with the file
				if (file != '.DS_Store' && file != 'PCB123 - V3.GKO' && file.indexOf(".") != -1) {
					GERBER_FILENAMES.push(folder + "/" + file);
				}
			});

			resolve(files);

		})
	})
}

function returnPromise(file) {
	return new Promise(function (resolve, reject) {
		readFilePromise(file).then(data => {
			const layers = GERBER_FILENAMES.map(filename => ({
				filename,
				gerber: fs.createReadStream(path.join(GERBERS_DIR, filename)),
			}))
			console.log(layers);

			resolve(pcbStackup(layers, {
				color: DEFAULT_COLOR,
				id: 'tudc',
				outlineGapFill: 3.5,
				useOutline: true
			}))
		}).catch(() => {
			reject("error");
		})
	});
}

function renderStackup(file) {

	return returnPromise(file);

}

function writeStackup(st) {
	//console.log(stackup);
	stackup = st;

}

async function giainen(source, target) {
	try {
		await extract(source, { dir: target })
		console.log('Extraction complete')
	} catch (err) {
		// handle any errors
	}
}
