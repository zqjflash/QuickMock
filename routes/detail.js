var fs = require('fs')
var express = require('express')
var router = express.Router()
var util = require('../common/utils')
var project = require('../models/projects')
var api = require('../models/apis')

router.get('/detail/:projectId', (req, res) => {
    var projectId = req.params.projectId

    var selectProject = {}
    
    project.selectOneProject(projectId).then(selectedProject => {
        selectProject = project
        api.selectAllApi(projectId).then(list => {
            res.render('project_detail', {
                haveList: true,
                list: list,
                projectUrl: selectedProject.url,
                projectId: selectedProject.id,
                page: 'list'
            })
        })
    })
})

//存储json
router.post('/detail/save', (req, res) => {
    var name = req.body.name.replace(/\s/g, ""),
        url = req.body.url.replace(/\s/g, ""),
        projectId = req.body.projectId.replace(/\s/g, ""),
        projectName = req.body.projectName,
        desc = req.body.desc,
        content = req.body.content

    if (url && content) {
        api.addApi({
            name: name,
            desc: desc,
            content: content,
            projectId: projectId,  
            url: url
        }).then(function() {
            res.json({
                success: true,
                message: "保存成功"
            })
        })
        
    } else {
        res.json({
            success: false,
            message: "名称或url不能为空"
        })
    }
})

//编辑接口页面
router.get('/detail/edit/:apiId', (req, res) => {

    var apiId = req.params.apiId

    if (!apiId) {
        res.redirect('/')
    } else {
        api.selectOneApi(apiId)
            .then(api => {
                console.log(api)
                console.log(JSON.parse(api.content))
                console.log(api.name)
                var projectId = api.project_Id
                var projectName = ''            
                project.selectOneProject(api.project_id).then(project => {
                    projectName = project.name
                    res.render('create', {
                        isEdit: true,
                        api: api,
                        projectName: projectName,
                        projectId: projectId
                    })
                })
                
            })
    }
})

//删除接口
router.post("/detail/delete", (req, res) => {
    var id = req.body.id.replace(/\s/g, ""),
        del = api.deleteApi(id)


    del.then((response) => {
        res.json({
           msg : '删除成功！'
        })
    }).catch((e) => {
        res.status(500).json({
            msg: '删除出错！'
        })
    })
})

//创建接口页面
router.get('/create/:projectId', (req, res) => {
    var projectId = req.params.projectId
    project.selectOneProject(projectId).then(project => {
        res.render('create', {
            isEdit: false,
            projectName: project.name,
            projectId: project.id,
            projectUrl: project.url
        })
    })
})

// 查询
router.post('/detail/search', (req, res) => {
    var url = req.body.url;
    var projectId = req.body.projectId;
    api.selectApiByCondiction({
        url: {
            $like: '%' + url + '%'
        },
        project_id: projectId
    }).then(list => {
        res.json(list)
    })
})

//获取一个数据文件
router.all('/api/:apiId', (req, res) => {
    var id = req.params.apiId

    api.selectOneApi(id).then(api => {
        res.json(JSON.parse(JSON.parse(api.content).detail))
    }, () => {
        res.status(404)
    })
})

module.exports = router;