import React from 'react';

class SvgCanvas extends React.PureComponent {

    constructor(props) {
      super(props);
  
      this._handleWheel = this._handleWheel.bind(this);
  
      this._handleMouseDown = this._handleMouseDown.bind(this);
      this._handleMouseMove = this._handleMouseMove.bind(this);
      this._handleMouseUp = this._handleMouseUp.bind(this);
      
      this.state = { scale: 1, tx: 0, ty: 0 };
    }
  
    _handleMouseDown(e)
    {
      this._mouseDownPos = { x: e.clientX, y: e.clientY, tx: this.state.tx, ty: this.state.ty };
  
      window.addEventListener("mousemove", this._handleMouseMove);
      window.addEventListener("mouseup", this._handleMouseUp);
    }
  
    _handleMouseMove(e) {
        var dx = e.clientX - this._mouseDownPos.x;
        var dy = e.clientY - this._mouseDownPos.y;

        if (!this._dragging && dx * dx + dy * dy > 4) {
            this._dragging = true;
            this.setState({ dragging: true });
        }

        if (this._dragging) {

            var newState = { tx: this._mouseDownPos.tx + dx, ty: this._mouseDownPos.ty + dy };

            this.setState(newState);

            if (this.props.onTransformChanged) {
                this.props.onTransformChanged(this.state.scale, newState.tx, newState.ty);
            }
        }
    }
  
    _handleMouseUp() {
        window.removeEventListener("mousemove", this._handleMouseMove);
        window.removeEventListener("mouseup", this._handleMouseUp);

        if (this._dragging) {
            this._dragging = false;
            this.setState({ dragging: false });
        }
    }

    _handleWheel(e) {
        console.log(`wheel ${e.deltaMode} ${e.deltaX} ${e.deltaY} ${e.deltaZ}`);
        var delta = -e.deltaY * (e.deltaMode ? 120 : 1) / 500;
    
        // The new scale factor
        var scale = Math.max(0.1, Math.min(10, this.state.scale * Math.pow(2, delta)));
    
        // The current mouse position
        var p = this._svg.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        p = p.matrixTransform(this._svg.getScreenCTM().inverse());
    
        // Adjust the translation so that the point under the current mouse position stays under the mouse
        var tx = p.x - (scale / this.state.scale) * (p.x - this.state.tx);
        var ty = p.y - (scale / this.state.scale) * (p.y - this.state.ty);
    
        this.setState({ scale: scale, tx: tx, ty: ty });
    
        if (this.props.onTransformChanged) {
            this.props.onTransformChanged(scale, tx, ty);
        }
    }
  
    render() {
  
      var scale = this.state.scale;
      var tx = this.state.tx;
      var ty = this.state.ty;
      
      var transform = `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`;
  
      var { onTransformChanged, style, overlay, ...props } = this.props;
  
      if (this.state.dragging || this.props.dragging) {
        style = Object.assign({ cursor: "move" }, style);
      }
  
      return (
        <svg ref={e => this._svg = e} style={style} {...props} onWheel={this._handleWheel} onMouseDown={this._handleMouseDown}>
          <g transform={transform}>
            {this.props.children}
          </g>
          {overlay}
        </svg>
      );
    }
}

export default SvgCanvas;
