
const app   = require( 'http' ).createServer( handlerConnection );
const fs    = require( 'fs' );
const path  = require( 'path' );
const url   = require( 'url' );
const MIME  = require( './mime' );

const io    = require( 'socket.io' )( app );

const PORT  = 8081;

app.listen( PORT );

let users = [];    // 保存用户信息

io.on( 'connection', handlerConnectionSokcet );

/**
 *  向服务器发送一个请求的处理事件
 *  @param { Object } req 请求对象
 *  @param { Object } res 响应对象
 */
function handlerConnection ( req, res ) {
    if ( req.url === '/favicon.ico' ) {
        return ;
    }

    // 获取路径，从根路径开始，一直到参数之前
    const pathname = url.parse(req.url).pathname;
    // 获取文件名
    const filename = path.basename( pathname );
    // 获取文件的扩展名 
    const extension = path.extname( filename );

    const headers = {
        'content-type': MIME[ extension ]
    };

    fetchFileData( pathname )
    .then( data => {
        res.writeHead( 200, headers );
        res.end( data );
    })
    .catch( err => {
        console.log( err );
        res.writeHead( 500, headers );
    });
}

/**
 *  读取指定路径的文件数据
 *  @param { String } pathname 文件路径
 */
function fetchFileData ( pathname ) {
    return new Promise(( resolve, reject ) => {
        let filepath = [ __dirname, '..' ];
        if ( pathname === '/' || pathname === '/index.html' ) {
            filepath.push( 'index.html' );
        } else {
            filepath.push( 'static', pathname );
        }
        
        fs.readFile( path.join( ...filepath ), ( err, data ) => {
            if ( err ) {
                reject( err );
                return ;
            }
            resolve( data );
        });
    });
}

/**
 *  客户端连接的事件
 *  @param { Object } socket 当前连接的客户端
 */
function handlerConnectionSokcet ( socket ) {
    socket.on( 'login', username => {
        // 将登录用户的信息存入 users 中
        const currentUser = {
            username: username,
            uid: users.length + 1,
            isRoomOwner: !users.length ? true : false
        };
        users.push( currentUser );
        // 告知当前客户端，登录成功，同时把房间里已存在的人员发送给客户端
        socket.emit( 'loginSuccess', users );
        // 告知当前客户端之外的所有客户端，有新成员加入
        console.log( '新成员加入' );
        socket.broadcast.emit( 'addNewuser', currentUser );
    });

    // 监听客户端准备事件
    socket.on( 'ready', user => {
        console.log( `${ user.username } 已准备` );
        for ( let i = 0; i < users.length; ++i ) {
            if ( user.uid === users[i].uid ) {
                users[i].ready = true;
                break;
            }
        }
        io.sockets.emit( 'readySuccess', user );
    });

    // 监听客户端取消准备事件
    socket.on( 'unready', user => {
        for ( let i = 0; i < users.length; ++i ) {
            if ( user.uid === users[i].uid ) {
                users[i].ready = false;
                break;
            }
        }
        io.sockets.emit( 'unreadySuccess', user );
    });

    // 监听客户端开始游戏事件
    socket.on( 'start', _ => {
        if ( users.length === 1 && users[0].isRoomOwner ) {
            socket.emit( 'startFail', {
                message: '房间人数最少在2人以上',
                code: 101
            });
            return ;
        }

        for ( let i = 0; i < users.length; ++i ) {
            if ( !users[i].isRoomOwner && !users[i].ready ) {
                socket.emit( 'startFail', {
                    message: '有玩家未准备',
                    code: 102
                });
                return ;
            }
        }

        io.sockets.emit( 'startSuccess' );
    });

    // 监听客户端开始画画事件
    socket.on( 'drawBegin', path => {
        socket.broadcast.emit( 'drawBeginSuccess', path );
    });

    // 监听客户端画画中事件
    socket.on( 'drawing', path => {
        socket.broadcast.emit( 'drawingSuccess', path );
    });

    // 监听客户端结束画画事件
    socket.on( 'drawEnd', path => {
        socket.broadcast.emit( 'drawEndSuccess', path );
    });

    // 监听客户端提交答案事件
    socket.on( 'commitAnswer', answer => {
        if ( answer === '狗' ) {
            socket.emit( 'answerSuccessSelf', {
                code: 101,
                message: '恭喜你答对啦！' 
            });
            socket.broadcast.emit( 'answerSuccessOther', {
                code: 102,
                message: '有人答对题了' 
            });
            users = [];
            io.sockets.emit( 'quit' );
        } else {
            socket.emit( 'answerFailSelf', {
                code: 103,
                message: '再好好想想...' 
            });
        }
    })
}