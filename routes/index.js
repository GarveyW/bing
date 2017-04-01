var express = require('express');
var dbUtils = require('../utils/dbUtils');
var qiniuUtils = require('../utils/qiniuUtils');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
    var isAjax = !!req.headers['x-requested-with'];
    var pageNo = req.query.p;
    pageNo = !!pageNo && Number(pageNo) > 0 ? Number(pageNo) : 1;
    var pageSize = 12; // pageSize
    dbUtils.commonQuery(`select count(0) as sum from bing where !ISNULL(qiniu_url) || qiniu_url<>""`, function(rows) {
        var count = rows[0]['sum'] || 0;
        if (count > 0) {
            var page = {
                size: pageSize,
                count: count,
                pageCount: Math.ceil(count / pageSize),
                next: pageNo + 1 > Math.ceil(count / pageSize) ? Math.ceil(count / pageSize) : pageNo + 1,
                prev: pageNo - 1 > 0 ? pageNo - 1 : 1,
                curr: pageNo > Math.ceil(count / pageSize) ? Math.ceil(count / pageSize) : pageNo,
                currText: pageNo === 1 ? '首页' : '第' + pageNo + '页',
                currPage: 'home'
            }
            if (pageNo > page.curr && !isAjax) {
                res.redirect(`/?p=${page.curr}`);
            }
            var sql = `select id,title,attribute,description,copyright,qiniu_url as photo,city,country,continent,DATE_FORMAT(enddate, '%Y-%m-%d') as dt,likes,views,downloads from bing 
                        where !ISNULL(qiniu_url) || qiniu_url<>""
                        order by id desc
                        limit ${(page.curr-1)*page.size},${page.size}`;
            dbUtils.commonQuery(sql, function(rs) {
                if (rs.length > 0) {
                    var data = [];
                    for (var i in rs) {
                        var temp = rs[i];
                        data.push({
                            id: temp['id'],
                            title: temp['title'],
                            attribute: temp['attribute'],
                            description: temp['description'],
                            copyright: temp['copyright'],
                            photo: temp['photo'],
                            city: temp['city'],
                            country: temp['country'],
                            continent: temp['continent'],
                            thumbnail: `https://static.ioliu.cn/bing/${temp['photo']}_800x600.jpg`,
                            smallpic: `https://static.ioliu.cn/bing/${temp['photo']}_800x600.jpg?imageView2/1/w/4/h/3/q/100`,
                            dt: temp['dt'],
                            likes: temp['likes'],
                            views: temp['views'],
                            downloads: temp['downloads']
                        });
                    }
                    if (isAjax) {
                        res.json({
                            doc: data,
                            page: page
                        });
                    } else {
                        res.render('index', {
                            doc: data,
                            page: page
                        });
                    }
                }
            });
        }
    });
});

var common = function(req, res, next, page, rows) {
    if (rows.length > 0) {
        var data = [];
        for (var i in rows) {
            var date = rows[i]['enddate'];
            var y = date.substr(0, 4);
            var m = date.substr(4, 2);
            var d = date.substr(6, 2);
            var full = y + '-' + m + '-' + d;
            data.push({
                id: rows[i]['id'],
                title: rows[i]['title'],
                attribute: rows[i]['attribute'],
                description: rows[i]['description'],
                copyright: rows[i]['copyright'],
                photo: rows[i]['qiniu_url'],
                city: rows[i]['city'],
                country: rows[i]['country'],
                continent: rows[i]['continent'],
                thumbnail: `https://static.ioliu.cn/bing/${rows[i]['qiniu_url']}_800x600.jpg`,
                smallpic: `https://bing.ioliu.cn/small/${rows[i]['qiniu_url']}_800x600`,
                date: full,
                likes: rows[i]['likes'],
                views: rows[i]['views'],
                downloads: rows[i]['downloads']
            });
        }
        res.render('index', {
            data: data,
            page: page
        });
    } else {
        var err = new Error('啊( ⊙ o ⊙ )，你发现了新大陆 ∑(っ °Д °;)っ');
        err.status = 404;
        next(err);
    }
}
module.exports = router;