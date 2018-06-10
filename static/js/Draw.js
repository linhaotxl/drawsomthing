class Draw {

    constructor ( $el, socket, isPainter ) {
        this.$canvas = $( '#' + $el );
        console.log( this.$canvas );
        this.cxt = this.$canvas[0].getContext( '2d' );
        this.socket = socket;
        this.isPainter = isPainter;
        this.clear();

        // this.

        if ( this.isPainter ) {
            this.drawBegin = this.drawBegin.bind( this );
            this.drawing = this.drawing.bind( this );
            this.drawEnd = this.drawEnd.bind( this );
            this.$canvas.on( 'touchstart', this.drawBegin );

            this.path = {
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0
            };
        } else {
            this.gussessDrawBegin = this.gussessDrawBegin.bind( this );
            this.gussessDrawing = this.gussessDrawing.bind( this );
            this.gussessDrawEnd = this.gussessDrawEnd.bind( this );
            this.socket.on( 'drawBeginSuccess', this.gussessDrawBegin );
            this.socket.on( 'drawingSuccess', this.gussessDrawing );
            this.socket.on( 'drawEndSuccess', this.gussessDrawEnd );
        }
    }

    drawBegin ( event ) {
        console.log( '开始画画...' );
        const touch = event.originalEvent.targetTouches[0];
        this.path.startX = touch.clientX;
        this.path.startY = touch.clientY;
        
        // 重新开始绘制路径
        this.cxt.beginPath();
        this.cxt.moveTo( this.path.startX, this.path.startY );

        this.socket.emit( 'drawBegin', this.path );

        this.$canvas.on( 'touchmove', this.drawing );
        this.$canvas.on( 'touchend', this.drawEnd );
    }

    drawing ( event ) {
        console.log( '画画中...' );
        const touch = event.originalEvent.targetTouches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        this.cxt.lineTo( currentX, currentY );
        this.cxt.stroke();

        this.socket.emit( 'drawing', { currentX, currentY } );
    }

    drawEnd ( event ) {
        console.log( '结束画画...' );
        const touch = event.originalEvent.changedTouches[0];
        this.path.endX = touch.clientX;
        this.path.endY = touch.clientY;

        this.socket.emit( 'drawEnd', this.path );

        this.$canvas.off( 'touchmove', this.drawing );
        this.$canvas.off( 'touchend', this.drawEnd );
    }

    gussessDrawBegin ( path ) {
        console.log( '猜图者开始画画' );
        console.log( path )
        // 重新开始绘制路径
        this.cxt.beginPath();
        this.cxt.moveTo( path.startX, path.startY );
    }

    gussessDrawing ( path ) {
        console.log( '猜图者正在画画' );
        console.log( path )
        this.cxt.lineTo( path.currentX, path.currentY );
        this.cxt.stroke();
    }

    gussessDrawEnd ( path ) {
        console.log( '猜图者结束画画' );
        console.log( path )
        this.cxt.lineTo( path.endX, path.endY );
        this.cxt.stroke();
    }

    clear () {
        this.cxt.clearRect( 0, 0, this.$canvas[0].width, this.$canvas[0].height );
    }

    destory () {
        if ( !this.isPainter ) {
            // this.socket.off( 'drawBeginSuccess', this.gussessDrawBegin );
            // this.socket.off( 'drawingSuccess', this.gussessDrawing );
            // this.socket.off( 'drawEndSuccess', this.gussessDrawEnd );

            this.socket.removeListener( 'drawBeginSuccess', this.gussessDrawBegin );
            this.socket.removeListener( 'drawingSuccess', this.gussessDrawing );
            this.socket.removeListener( 'drawEndSuccess', this.gussessDrawEnd );
        } else {
            console.log( this.$canvas )
            this.$canvas.off( 'touchstart', this.drawBegin );
        }
    }

}