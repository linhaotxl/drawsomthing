(function ( window, $ ) {

    let $loginContainer = null;                     // 登录界面
    let $userListsContainer = null;                 // 展示用户列表界面
    let $enterBtn = null;                           // 进入房间按钮
    var $usernameInput = null;
    var $userCount = null;
    var $drawContainer = null;
    let _username = '';
    let currentUser = null;

    const socket = io( 'ws://localhost:8081' );

    $(function () {

        $loginContainer = $( '.login_container' );
        $userListsContainer = $( '.user_lists_container' );
        $usernameInput = $( '.username_input_inner' );

        $enterBtn = $( '.enter_btn' );
        $enterBtn.on( 'click', handlerEnterRoom );

        $userCount = $( '.user_count' );

        $drawContainer = $( '.draw_container' );

        // 接受登录成功的数据
        socket.on( 'loginSuccess', handlerLoginSuccess );

        // 监听退出游戏事件
        console.log( 0 )
        socket.on( 'quit', handlerQuitGame );

    });

    /**
     *  进入房间的事件
     */
    function handlerEnterRoom () {
        _username = $usernameInput.val();
        if ( !_username ) {
            alert( '请输入昵称' );
            return ;
        }

        $loginContainer.css( 'left', '-100%' );
        $userListsContainer.css( 'left', '0' );
        
        // 向服务器发送登录信息
        socket.emit( 'login', _username );
    }

    /**
     *  房主开始游戏的事件
     */
    function handlerPlayGame () {
        socket.emit( 'start' );
    }

    /**
     *  用户登录成功的事件
     *  @param { Object } user 登录成功的用户
     */
    function handlerLoginSuccess ( users ) {
        $userCount.html( users.length );

        const _currentUser = users[ users.length - 1 ];

        currentUser = new User( 
            _currentUser.uid, 
            _currentUser.username, 
            _currentUser.isRoomOwner, 
            socket,
            users,
            true
        );
    }

    /**
     *  答题正确时退出房间
     */
    function handlerQuitGame () {
        _username = '';
        $usernameInput.val( '' );
        $loginContainer.css( 'left', 0 );
        $userListsContainer.css({
            display: 'none',
            left: '100%'
        });
        $drawContainer.css({
            display: 'none',
            left: '100%'
        });

        $userListsContainer.find( '.user_lists' ).empty();

        $userListsContainer.show();
        $drawContainer.show();

        currentUser.destory();
        currentUser = null;

    }

})( window, jQuery );