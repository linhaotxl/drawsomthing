class User {

    /**
     * 
     * @param { String }    uid         用户 id
     * @param { String }    username    用户名
     * @param { Boolean }   isRoomOwner 是否是房主
     * @param { Object }    socket      Socket 对象
     * @param { Object }    other       非房主的配置对象
     */
    constructor ( uid, username, isRoomOwner, socket, existUsers, isLogin ) {
        this.uid         = uid;
        this.username    = username;
        this.isRoomOwner = isRoomOwner;
        this.socket      = socket;
        this.existUsers  = existUsers;
        this.isLogin     = isLogin || false;
        this._ready      = false;
        this.$userCount  = $( '.user_count' );

        this.handlerStartGameSuccess = this.handlerStartGameSuccess.bind( this );
        this.handlerAddNewuser = this.handlerAddNewuser.bind( this );
        this.handlerReadySuccess = this.handlerReadySuccess.bind( this );
        this.handlerUnreadySuccess = this.handlerUnreadySuccess.bind( this );
        this.handlerAnswerSuccessOther = this.handlerAnswerSuccessOther.bind( this );
        this.handlerStartGameFile = this.handlerStartGameFile.bind( this );
        this.handlerAnswerSuccessSelf = this.handlerAnswerSuccessSelf.bind( this );
        this.handlerAnswerFailSelf = this.handlerAnswerFailSelf.bind( this );

        Object.defineProperty( this, 'ready', {
            get () {
                return this._ready;
            },

            set ( newValue ) {
                const $currentListItem = $( `.user_item[data-id=${ this.readyUserId }]` );
                
                this._ready = newValue;
                if ( newValue ) {
                    $currentListItem.find( '.state' ).html( '已准备' );
                } else {
                    $currentListItem.find( '.state' ).html( '未准备' );
                }
            }
        });

        this.init();

    }

    /**
     *  初始化方法
     */
    init () {
        this.$buttonContainer = $( '.button_container' );
        this.$userListsContainer = $( '.user_lists_container' );
        this.$userLists = this.$userListsContainer.find( '.user_lists' );

        this.initExistUsers( this.existUsers );

        // 无论是房主还是非房主都要监听游戏开始的事件
        this.socket.on( 'startSuccess', this.handlerStartGameSuccess );

        // 无论是房主还是非房主都要监听有新成员加入房间的事件
        this.socket.on( 'addNewuser', this.handlerAddNewuser );

        this.socket.on( 'readySuccess', this.handlerReadySuccess );
        this.socket.on( 'unreadySuccess', this.handlerUnreadySuccess );
        this.socket.on( 'answerSuccessOther', this.handlerAnswerSuccessOther );

        if ( !this.isRoomOwner ) {
            this.initNotRoomOwner();
        } else {
            this.initRoomOwner();
        }
    }

    /**
     *  初始化房主相关信息
     */
    initRoomOwner () {
        this.roomOwner = {
            $startGameBtn: $( '<button>开始</button>' )
        };

        this.roomOwner.$startGameBtn.addClass( 'play_btn' );
        this.roomOwner.$startGameBtn.on( 'click', this.handlerPlayGame.bind( this ) );
        this.$buttonContainer.append( this.roomOwner.$startGameBtn );

        this.canvasContainer = $( '.draw_container.painter' );
        
        this.socket.on( 'startFail', this.handlerStartGameFile );
    }

    /**
     *  初始化非房主相关信息
     */
    initNotRoomOwner () {
        this.notRoomOwner = {
            $readyBtn: $( '<button>准备</button>' ),
            $unReadyBtn: $( '<button>取消准备</button>' )
        };
        this.notRoomOwner.$readyBtn.addClass( 'ready_btn' );
        this.notRoomOwner.$unReadyBtn.addClass( 'unready_btn hide' );
        this.$buttonContainer.append( this.notRoomOwner.$readyBtn, this.notRoomOwner.$unReadyBtn );

        this.canvasContainer = $( '.draw_container.guessing_graph' );

        this.notRoomOwner.$readyBtn.on( 'click', this.handlerReady.bind( this ) );
        this.notRoomOwner.$unReadyBtn.on( 'click', this.handlerUnready.bind( this ) );

        this.notRoomOwner.answer = '';

        this.notRoomOwner.$answerInput = $( '.answer_input' );
        this.notRoomOwner.$answerInput.on( 'input', this.handlerInputAnswer.bind( this ) );

        this.notRoomOwner.$answerConfirmBtn = $( '.confirm_btn' );
        this.notRoomOwner.handlerCommitAnswer = this.handlerCommitAnswer.bind( this );
        this.notRoomOwner.$answerConfirmBtn.on( 'click', this.notRoomOwner.handlerCommitAnswer );

        this.socket.on( 'answerSuccessSelf', this.handlerAnswerSuccessSelf );
        this.socket.on( 'answerFailSelf', this.handlerAnswerFailSelf );
    }

    /**
     * 初始化已存在的用户
     * @param { Array } users 已存在的用户列表
     */
    initExistUsers ( users ) {
        users.forEach( user => {
            this.$userLists.append( this.initHTML( user ) );
        });
    }

    /**
     *  初始化当前用户的 HTML 片段
     */
    initHTML ( user ) {
        const html = `
            <li class="user_item" data-id=${ user.uid }>
                <span class="username">${ user.username }</span>
                <span class="state">${ user.isRoomOwner ? '房主' : '未准备' }</span>
            </li>
        `;

        return html;
    }

    /**
     *  非房主输入答案的事件
     */
    handlerInputAnswer ( event ) {
        this.notRoomOwner.answer  = $( event.target ).val();
    }

    /**
     *  非房主提交答案的事件
     */
    handlerCommitAnswer () {
        this.socket.emit( 'commitAnswer', this.notRoomOwner.answer );
    }

    /**
     * 非房主回答正确的事件（ 当前回答的用户 ）
     * @param { Object } data 响应数据
     */
    handlerAnswerSuccessSelf ( data ) {
        if ( data.code === 101 ) {
            alert( data.message );
        }
    }

    /**
     * 非房主回答正确的事件（ 非当前回答的用户 ）
     * @param { Object } data 响应数据
     */
    handlerAnswerSuccessOther ( data ) {
        if ( data.code === 102 ) {
            alert( data.message );
        }
    }

    /**
     * 非房主回答正确的事件（ 当前回答的用户 ）
     * @param { Object } data 响应数据
     */
    handlerAnswerFailSelf ( data ) {
        if ( data.code === 103 ) {
            alert( data.message );
        }
    }

    /**
     *  非房主准备事件
     */
    handlerReady () {
        const _data = {
            username: this.username,
            uid: this.uid
        };

        this.socket.emit( 'ready', _data );
    }

    /**
     *  非房主准备成功事件
     */
    handlerReadySuccess ( readyUser ) {
        if ( !this.isRoomOwner ) {
            this.notRoomOwner.$readyBtn.addClass( 'hide' );
            this.notRoomOwner.$unReadyBtn.removeClass( 'hide' );
        }
        
        this.readyUserId = readyUser.uid;
        this.ready = true;
    }

    /**
     *  非房主取消准备事件
     */
    handlerUnready () {
        const _data = {
            username: this.username,
            uid: this.uid
        };

        this.socket.emit( 'unready', _data );
    }

    /**
     *  非房主取消准备成功事件
     */
    handlerUnreadySuccess ( unreadyUser ) {
        if ( !this.isRoomOwner ) {
            this.notRoomOwner.$readyBtn.removeClass( 'hide' );
            this.notRoomOwner.$unReadyBtn.addClass( 'hide' );
        }

        this.readyUserId = unreadyUser.uid;
        this.ready = false;
    }

    /**
     *  房主开始游戏的事件
     */
    handlerPlayGame () {
        this.socket.emit( 'start' );
    }

    /**
     *  房主开始游戏失败的事件
     *  @param { Object } err 错误信息
     */
    handlerStartGameFile ( err ) {
        alert( err.message );
    }

    /**
     *  房主开始游戏成功的事件
     *  @param { Object } err 错误信息
     */
    handlerStartGameSuccess ( err ) {
        this.$userListsContainer.css( 'left', '-100%' );
        // 房主将 painter 盒子的 left 设置为 0
        // 非房主将 guessing_graph 盒子的 left 设置为 0
        this.canvasContainer.css( 'left', '0' );

        if ( this.isRoomOwner ) {
            this.painterCanvas = new Draw( 'painter_canvas', this.socket, true );
        } else {
            this.gussessCanvas = new Draw( 'gussess_canvas', this.socket, false );
            this.notRoomOwner.$answerInput.val( '' );
        }   
    }

    /**
     *  添加新加入房间的用户
     *  @param { User } newUser 新加入的用户
     */
    handlerAddNewuser ( newUser ) {
        if ( !this.isLogin ) {
            return ;
        }
        this.$userLists.append( this.initHTML( newUser ) );

        const currentUserCount = parseInt( this.$userCount.html() );
        this.$userCount.html( currentUserCount + 1 );
    }

    destory () {
        this.isLogin = false;
        this.$userCount.html( 0 );
        if ( this.isRoomOwner ) {
            this.painterCanvas.destory();
            this.painterCanvas = null;
            this.roomOwner.$startGameBtn.remove();
            
            this.socket.removeListener( 'startFail', this.handlerStartGameFile );
        } else {
            this.gussessCanvas.destory();
            this.gussessCanvas = null;
            this.notRoomOwner.$readyBtn.remove();
            this.notRoomOwner.$unReadyBtn.remove();
            
            this.socket.removeListener( 'answerSuccessSelf', this.handlerAnswerSuccessSelf );
            this.socket.removeListener( 'answerFailSelf', this.handlerAnswerFailSelf );

            this.notRoomOwner.$answerConfirmBtn.off( 'click', this.notRoomOwner.handlerCommitAnswer );
        }

        this.socket.removeListener( 'startSuccess', this.handlerStartGameSuccess );
        this.socket.removeListener( 'addNewuser', this.handlerAddNewuser );
        this.socket.removeListener( 'readySuccess', this.handlerReadySuccess );
        this.socket.removeListener( 'unreadySuccess', this.handlerUnreadySuccess );
        this.socket.removeListener( 'answerSuccessOther', this.handlerAnswerSuccessOther );

    }

}