/*
 * GET home page.
 */
var fs = require('fs')
const projectList = './public/jsonfile/projectList.json';
const projectDetail = './public/jsonfile/projectDetail.json';

var saveName = (name, url, idDel) => {
	//存储文件名和url到ajaxapilist文件
		readPromise = new Promise((resolve, reject) => {
			var ret = fs.readFileSync(jsonName);
			ret ? resolve(ret) : reject();
			// resolve(fs.readFileSync(jsonName))
		});

	var _writePromise = new Promise((resolve, reject) => {
		readPromise.then((response) => {
			var list = JSON.parse(response).dataList,
				new_arr = idDel ? [] : [{
					"name": name,
					"url": url
				}]; //如果是删除则不需要这个新的数据
			//合并json
			if (list) {
				for (var i = 0; i < list.length; i++) {
					//比较url，url不能重复
					if (url != list[i].url) {
						new_arr.push(list[i])
						continue;
					}
				}
			}
			resolve(fs.writeFileSync(jsonName, JSON.stringify({
				"dataList": new_arr
			})))
		}).catch((response) => {
			resolve(fs.writeFileSync(jsonName, JSON.stringify({
				"dataList": [{
					"name": name,
					"url": url
				}]
			})))
		})
	})

}

var mkdirSync = (url, mode, cb) => {
	console.log(url)
	var path = require("path"),
		arr = url.split("/");
	mode = mode || 0755;
	cb = cb || function () {};
	if (arr[0] === ".") { //处理 ./aaa
		arr.shift();
	}
	if (arr[0] == "..") { //处理 ../ddd/d
		arr.splice(0, 2, arr[0] + "/" + arr[1])
	}

	function inner(cur) {
		if (!fs.existsSync(cur)) { //不存在就创建一个
			fs.mkdirSync(cur, mode)
		}
		if (arr.length) {
			inner(cur + "/" + arr.shift());
		} else {
			cb();
		}
	}
	arr.length && inner(arr.shift());
}

module.exports = app => {
	//接口首页
	app.get('/', (req, res) => {
		var jsonName = './public/jsonfile/projectList.json';
		var readPromise = new Promise((resolve, reject) => {
			var ret = fs.readFileSync(jsonName);
			ret ? resolve(ret) : reject(ret);
		});

		readPromise
			.then((response) => {
				response = JSON.parse(response);
				if (response.projectList) {
					res.render('projectList', {
						haveList: true,
						projectList: response.projectList
					})
				} else {
					res.render('projectList', {
						haveList: false,
						projectList: []
					})
				}
			})
			.catch((response) => {
				res.render('projectList', {
					haveList: false,
					projectList: []
				})
			})
	})
	//获取一个数据文件
	app.all('/api/*', (req, res) => {
		//文件名称
		console.log(req.params[0])
		var jsonName = './public/jsonfile/' + req.params[0] + '.json';

		var readPromise = new Promise((resolve, reject) => {
			resolve(fs.readFileSync(jsonName))
		});
		readPromise.then((response) => {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DEvarE,OPTIONS");
			res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
			res.json(JSON.parse(JSON.parse(response).detail))
		}).catch((response) => {
			res.render('noresult')
		})
	})

	//创建接口页面
	app.get('/create', (req, res) => {
		res.render('create', {
			isEdit: false
		})
	})

	app.get('/projectList/*', (req, res) => {
		var jsonName = './public/jsonfile/projectDetail.json';

		var readPromise = new Promise((resolve, reject) => {
			resolve(fs.readFileSync(jsonName))
		})

		readPromise.then((response) => {
			var response = JSON.parse(response).dataList;
			console.log(response)
			var ret = response.filter((item, index) => {
				return item.project === req.params[0];
			})
			
			res.render('projectDetail', {
				haveList: true,
				list: ret
			})
		})
	})

	//存储json
	app.post('/save', (req, res) => {
		//文件名称 是url 英文。便于调用 ；fileName只是描述内容
		var fileName = req.body.name.replace(/\s/g, ""),
			jsonUrl = req.body.url.replace(/\s/g, ""),
			jsonString = req.body.data,
			jsonName = './public/jsonfile/' + jsonUrl + '.json';

		var tempArr = jsonUrl.split('/')
		tempArr.pop();
		
		mkdirSync('./public/jsonfile/' + tempArr.join('/'))
		
		if (fileName && jsonUrl) {
			var readPromise = new Promise((resolve, reject) => {
				resolve(fs.writeFileSync(jsonName, jsonString))
			});
			//把新的关系表保存到ajaxapilist
			saveName(fileName, jsonUrl)
			readPromise.then((response) => {
				res.json({
					success: true,
					message: "保存成功"
				})
			}).catch((response) => {
				res.json({
					success: false,
					message: response
				})
			})
		} else {
			//后台加一道拦截，防止没有文件名和url
			res.json({
				success: false,
				message: "名称或url不能为空"
			})
		}

	})
	//编辑接口页面
	app.get('/edit/*', (req, res) => {
		//文件名称其实就是url最后的参数
		var jsonName = './public/jsonfile/' + req.params[0] + '.json';
		if (!req.params[0]) {
			res.redirect('/')
		} else {
			var readPromise = new Promise((resolve, reject) => {
				resolve(fs.readFileSync(jsonName))
			});
			readPromise.then((response) => {
				res.render('create', {
					isEdit: true,
					stringValueJson: JSON.parse(response)
				})
			}).catch((response) => {
				res.render('noresult')
			})
		}
	})
	//搜索接口
	app.get('/search/:keyword', (req, res) => {
		var keyword = req.params.keyword.replace(/\s/g, ""),
			jsonName = './public/jsonfile/ajaxapilist.json';
		var readPromise = new Promise((resolve, reject) => {
			resolve(fs.readFileSync(jsonName))
		});
		readPromise.then((response) => {
			response = JSON.parse(response);
			if (response.dataList) {
				var list = response.dataList,
					new_arr = [];
				for (var i = 0; i < list.length; i++) {
					if (list[i].name.match(keyword) || list[i].url.match(keyword)) {
						new_arr.push(list[i])
					}
				}
				if (new_arr.lefngth) {
					res.render('project', {
						haveList: true,
						list: new_arr
					})
				} else {
					res.render('project', {
						haveList: false,
						list: []
					})
				}
			} else {
				res.render('project', {
					haveList: false,
					list: []
				})
			}
		}).catch((response) => {
			res.render('index', {
				haveList: false,
				list: []
			})
		})
	})
	//判断是否重复
	app.get('/repeat', (req, res) => {
		var apiurl = req.query.apiurl.replace(/\s/g, ""),
			jsonName = './public/jsonfile/ajaxapilist.json',
			readPromise = new Promise((resolve, reject) => {
				resolve(fs.readFileSync(jsonName))
			});
		readPromise.then((response) => {
			response = JSON.parse(response);
			if (response.dataList) {
				var list = response.dataList;
				for (var i = 0; i < list.length; i++) {
					if (list[i].url == apiurl) {
						res.json({
							repeat: true,
							success: true
						});
						return
					}
				}
				res.json({
					repeat: false,
					success: true
				})
			} else {
				res.json({
					repeat: false,
					success: true
				})
			}
		}).catch((response) => {
			res.json({
				repeat: false,
				success: true
			})
		})
	})
	//删除接口
	app.post("/devare", (req, res) => {
		var jsonUrl = req.body.url.replace(/\s/g, ""),
			jsonName = './public/jsonfile/' + jsonUrl + '.json',
			del = new Promise((resolve, reject) => {
				resolve(fs.unlinkSync(jsonName))
			});
		saveName(jsonName, jsonUrl, true)
		del.then((response) => {
			res.json({
				code: 0,
				success: true
			})
		}).catch((e) => {
			res.json({
				code: 1,
				success: false,
				info: e
			})
		})
	})
}