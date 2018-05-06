import React from 'react';

class Node extends React.PureComponent {

    constructor(props) {
        super(props);
    
        this._texty = 0;
    
        this._handleMouseDown = this._handleMouseDown.bind(this);
    }
  
    render() {
        var node = this.props.node;
        
        var w = node.width;
        var h = node.height;
    
        return (
            <g transform={`translate(${node.x - w/2} ${node.y - h/2})`} onMouseDown={this._handleMouseDown} onDragStart={this._handleDragStart}>
                {this.props.children}
            </g>
        );
    }
  
    _handleDragStart() {
        return false;
    }
  
    _handleMouseDown(evt) {
      if (this.props.onMouseDown) {
            evt.stopPropagation();
    
            this.props.onMouseDown(this.props.node, evt);
      }
    }
}

export default Node;