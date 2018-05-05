import React from 'react';
import './Graph.css';

import * as WebCola from 'webcola';

// Override the Layout so that the ticks are controlled by the render loop.
// The kick() method contains no loop any longer. Instead nextFrame() has to be called
// to continue with the animation.
class Layout extends WebCola.Layout {

  constructor()
  {
    super();

    this.nextFrame = this.nextFrame.bind(this);
  }

  kick() {
    this.tick();
  }

  nextFrame() {
    window.requestAnimationFrame(this.tick.bind(this));
  }
}

class Node extends React.PureComponent {

  constructor(props) {
    super(props);

    this._handleMouseDown = this._handleMouseDown.bind(this);
  }

  render() {
    var node = this.props.node;
    
    var w = node.width;
    var h = node.height;

    return (
      <g className={`node ${node.color}`} transform={`translate(${node.x} ${node.y})`} onMouseDown={this._handleMouseDown} onDragStart={this._handleDragStart}>
        <rect x={-w/2} y={-h/2} width={w} height={h}/>
        <text ref={e => this._text = e} x={0} y={0} alignmentBaseline="middle" textAnchor="middle">{node.name}</text>
      </g>
    );
  }

  componentDidMount() {
    this.props.node.width = this._text.getBBox().width + 20;

    // Note that setting the node width does not trigger a rerendering of the node
    // but during the next tick, the node is rendered again.
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

// Draws an edge between two rectangular nodes that does not
// overlap the node ranges.
class Edge extends React.PureComponent {
  render() {

    var src = this.props.source;
    var trg = this.props.target;

    var dx = trg.x - src.x;
    var dy = trg.y - src.y;

    var adx = Math.abs(dx);
    var ady = Math.abs(dy);

    // Find the starting point (Intersection of the line with the source node rectangle)
    var tx = adx > 0.1 ? (src.width / 2) / adx : 1.0;
    var ty = ady > 0.1 ? (src.height / 2) / ady : 1.0;
    var t0 = Math.min(tx, ty);

    var x0 = src.x + t0 * dx;
    var y0 = src.y + t0 * dy;

    // Find the end point (Intersection of the line with the target node rectangle)
    tx = adx > 0.1 ? (trg.width / 2) / adx : 1.0;
    ty = ady > 0.1 ? (trg.height / 2) / ady : 1.0;
    var t1 = 1 - Math.min(tx, ty);

    // Make the line a little bit shorter at the target end.
    t1 -= 2 / Math.sqrt(dx * dx + dy * dy);

    var x1 = src.x + t1 * dx;
    var y1 = src.y + t1 * dy;

    var path = `M ${x0} ${y0} L ${x1} ${y1}`;

    var cls = this.props.secondary ? "secondary-link" : "link";
    var mrk = this.props.secondary ? "secondary-arrow" : "arrow";

    return <path className={cls} d={path} markerEnd={`url(#${mrk})`}/>;
  }
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

class Zoomable extends React.PureComponent {

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
      this.setState({ tx: this._mouseDownPos.tx + dx, ty: this._mouseDownPos.ty + dy });
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

  render() {

    var scale = this.state.scale;
    var tx = this.state.tx;
    var ty = this.state.ty;
    
    var transform = `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`;

    var { onScaleChanged, style, ...props } = this.props;

    if (this.state.dragging) {
      style = Object.assign({ cursor: "move" }, style);
    }

    return (
      <svg ref={e => this._svg = e} style={style} {...props} onWheel={this._handleWheel} onMouseDown={this._handleMouseDown}>
        <g transform={transform}>
          {this.props.children}
        </g>
      </svg>
    );
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

    this.props.onScaleChanged(scale);
  }
}

class Graph extends React.PureComponent {
  constructor(props) {
    super(props);

    this._handleTick = this._handleTick.bind(this);
    this._handleStart = this._handleStart.bind(this);
    this._handleEnd = this._handleEnd.bind(this);

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);

    this._scale = 1;
    this._handleScaleChanged = this._handleScaleChanged.bind(this);

    this.state = { started: false, tick: 0 };

    if (props.graph.secondary_edges) {
      props.graph.secondary_edges.forEach(edge => {

        if (isNumber(edge.source)) {
          edge.source = props.graph.nodes[edge.source];
        }
        if (isNumber(edge.target)) {
          edge.target = props.graph.nodes[edge.target];
        }

      });
    }

    this._cola = new Layout();
    this._cola
      .size([ 800, 600 ])
      .nodes(props.graph.nodes)
      .links(props.graph.edges)
      .handleDisconnected(false) // handle disconnected repacks the components which would hide any drift 
      .avoidOverlaps(true) // force non-overlap
      //.symmetricDiffLinkLengths(80)
      .jaccardLinkLengths(100, 0.7)
      .on("tick", this._handleTick)
      .on("start", this._handleStart)
      .on("end", this._handleEnd);

    // Note that starting the layout process in the constructor is not possible.
    // We do that in componentWillMount.

    if (false) {
      // This is an example how nodes can be removed from or added to the graph
      window.setTimeout(function () {
        var graph = this.props.graph;

        // Modify the node and edge lists
        graph.nodes.splice(1, 1);
        graph.edges.splice(0, 2);

        // Start the layout process again
        this._cola.start();
      }.bind(this), 3000);

      window.setTimeout(function () {
        var graph = this.props.graph;

        // Modify the node and edge list
        var newNode = { id: 5, name: "A new node", width: 100, height: 30 };
        graph.nodes.push(newNode);
        graph.edges.push({ source: graph.nodes[1], target: newNode });

        // Start the layout process again
        this._cola.start();
      }.bind(this), 6000);
    }

  }

  componentWillMount()
  {
    this._cola.start(10, 10, 10);
  }

  _handleStart() {
    this.setState({ started: true });
  }

  _handleTick() {
    // Make the graph render itself and call the nextFrame method after updating the component.
    this.setState((s, p) => { return { tick: s.tick + 1 }; }, this._cola.nextFrame);
  }

  _handleEnd() {
  }


  _handleMouseDown(node, e)
  {
    this._dragging = false;
    this._mouseDownNode = node;
    this._mouseDownPos = { x: e.clientX, y: e.clientY, nx: node.x, ny: node.y };

    window.addEventListener("mousemove", this._handleMouseMove);
    window.addEventListener("mouseup", this._handleMouseUp);
  }

  _handleMouseMove(e) {
    var dx = e.clientX - this._mouseDownPos.x;
    var dy = e.clientY - this._mouseDownPos.y;

    if (!this._dragging && dx * dx + dy * dy > 4) {
      this._dragging = true;
      WebCola.Layout.dragStart(this._mouseDownNode);
    }

    if (this._dragging) {
      WebCola.Layout.drag(this._mouseDownNode, { x: this._mouseDownPos.nx + dx / this._scale, y: this._mouseDownPos.ny + dy / this._scale });
      this._cola.resume();
    }
  }

  _handleMouseUp() {
    window.removeEventListener("mousemove", this._handleMouseMove);
    window.removeEventListener("mouseup", this._handleMouseUp);

    if (this._dragging) {
      //console.log("DRAG END " + this._mouseDownNode.name);
      WebCola.Layout.dragEnd(this._mouseDownNode);
      this._dragging = false;
    }
  }

  _handleScaleChanged(scale) {
    this._scale = scale;
  }

  render() {

    if (!this.state.started) {
      return null;
    }

    var nodes = this._cola.nodes().map( n => <Node key={n.id} node={n} x={n.x} y={n.y} width={n.width} height={n.height} onMouseDown={this._handleMouseDown}/>);
    var edges = this._cola.links().map( e => {

      var help = e.source.x + "," + e.source.y + "-" + e.target.x + "," + e.target.y;

      return <Edge key={e.source.index + "-" + e.target.index} id={help} source={e.source} target={e.target}/>

    });

    var secondaryEdges = undefined;
    var graph = this.props.graph;
    if (graph.secondary_edges) {
      secondaryEdges = graph.secondary_edges.map( e => {

        var help = e.source.x + "," + e.source.y + "-" + e.target.x + "," + e.target.y;
  
        return <Edge key={e.source.index + "-" + e.target.index} id={help} source={e.source} target={e.target} secondary/>
  
      });
    }

    return (
      <Zoomable className="graph" width="800" height="600" style={{ userSelect: "none" }} onScaleChanged={this._handleScaleChanged}>
        <defs>
          <marker className="arrow" id="arrow" markerWidth="9" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" />
          </marker>
          <marker className="secondary-arrow" id="secondary-arrow" markerWidth="9" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth" fill="lightgray">
            <path d="M0,0 L0,6 L9,3 z" />
          </marker>
        </defs>
        <text x={0} y={600}>{this.state.tick}</text>
        <g>
          {secondaryEdges}
          {edges}
          {nodes}
        </g>
      </Zoomable>
    );
  }
}

export default Graph;