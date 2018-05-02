//require
let app = require('./setting.js');
let mysql = require('mysql');

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database:'test',
    port: 3306
});
conn.connect();

var insertSQL = 'insert into t_list(f_name,f_avatar) values("haha","http://g.mdcdn.cn/h5/img/icon_tool/common_detail_alarm_succ.png")';

//加入购物车
app.post('/add_to_cart', function (req, res) {
    let request = req.body;
    let query = 'SELECT f_uid,f_item_id FROM t_item_user WHERE f_item_id  = ?';
    let query_param = request.item_id;

        return new Promise(function(resolve,reject){
            conn.query(query,query_param, function (err2, rows) {
                if (err2) console.log(err2);
                if (rows.length === 0) {
                    let param = [req.body.id, req.body.item_id];
                    resolve(param);
                }
            })
        })
        .then(function(param){
            //insert
            let sql = 'insert into t_item_user(f_uid,f_item_id) values(?,?)';
            conn.query(sql,param, function (err1, res1) {
                if(res1.affectedRows==1){
                    let $return={
                        errcode:1,
                        errmsg:'插入成功',
                    };
                    res.end(JSON.stringify($return));
                }else{
                    console.log('what');
                }
            })
        })
        .catch(function(){
            let $return={
                errcode:2,
                errmsg:'该商品已经存在',
            };
            res.end(JSON.stringify($return));//返回
        })
});

//初始化查询购物车
app.post('/search_cart', function (req, res) {
        return new Promise(function(resolve,reject){
            let user_id=req.body.user_id,
                query = 'SELECT * FROM t_item_user WHERE f_uid  = ?',
                query_param = user_id;

            conn.query(query,query_param, function (err2, rows) {
                if(rows.length>0){
                    resolve(rows);
                }else if(rows.length==0){
                    let $return={
                        errcode:0,
                        errmsg:'',
                        data:''
                    };
                    res.end(JSON.stringify($return));//返回
                    reject('购物车里没有商品哦');
                }
            });

        })
        .then(function(data){
            let query_item = 'SELECT * FROM t_list WHERE f_id  in (?)';
            let whereIn = [];
            for(let i=0,len=data.length;i<len;i++){
                whereIn.push(data[i].f_item_id);
            }
            conn.query(query_item,[whereIn], function (err2, rows) {//异步分两次查。。。。
                if (err2){
                    console.log(err2);
                }
                let $return={
                    errcode:0,
                    errmsg:'',
                    data:rows,
                };
                res.end(JSON.stringify($return));//返回
            });
        });

    });

//从购物车删除商品
app.post('/delete_item', function (req, res) {
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
    let request = req.body;
        return new Promise(function(resolve,reject){
            let query = 'SELECT f_item_id FROM t_item_user WHERE f_item_id  = ' + request.item_id + ' limit 1';
            conn.query(query, function (err2, rows) {
                if (err2) console.log(err2);
                if(rows.length>0){
                    resolve(request.item_id);
                }else{
                    reject('无可删除商品');
                }
            })
        })
        .then(function(id){
            let query = 'delete  FROM t_item_user WHERE f_item_id  = '+id;
            conn.query(query, function (err2, rows) {
                if(rows.affectedRows==1){
                    let $return={
                        errcode:0,
                        errmsg:'',
                        data:'删除成功',
                    };
                    res.end(JSON.stringify($return));//返回
                }
            })
        })
        .catch(function () {//????
            console.log('error');
            let $return={
                errcode:1,
                errmsg:'',
                data:'删除失败',
            };
            res.end(JSON.stringify($return));//返回
        })
});

//页面初始化加载，可以把初始化购物车在这查询
app.get('/',function(req,res){//有index默认进index页，我把index名字改了才进入这个页面的
    let list_query_sql = 'select f_id,f_name,f_avatar from t_list limit 10',
        list_search_result,
        cart_search_result;

    return new Promise(function(resolve,reject){
        conn.query(list_query_sql, function (err2, rows) {
            if (err2) console.log(err2);
            if(rows.length >0){
                list_search_result = JSON.stringify(rows);
                resolve(list_search_result);
            }else{
                reject('没有用户');
            }

        })
    })
        .then(function(list_search_result){
            let cart_query_sql = 'SELECT t_list.f_id,t_list.f_name,t_list.f_avatar FROM t_list INNER JOIN t_item_user ON t_list.f_id= t_item_user.f_item_id WHERE t_item_user.f_uid=2333';
            conn.query(cart_query_sql, function (err2, rows) {
                if (err2) console.log(err2);
                cart_search_result = JSON.stringify(rows);
                /**********************pug tpl,首屏直出********************/
                res.render('index',{//pug(jade)是express默认模板
                    init_list_data:list_search_result,
                    init_cart_data:cart_search_result,
                });
            });
        })
        .catch(function () {
            res.render('index',{//pug(jade)是express默认模板
                init_list_data:[],
                init_cart_data:[]
            });
        })

});

var server = app.listen(3000, function () {
    console.log('yes');
});








