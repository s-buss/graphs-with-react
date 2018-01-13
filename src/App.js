import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
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
    var props = this.props;

    return (
      <g className="node" onMouseDown={this._handleMouseDown} onDragStart={this._handleDragStart}>
        <rect x={props.x - props.width / 2} y={props.y - props.height / 2} width={props.width} height={props.height}/>
        <text x={props.x} y={props.y} alignmentBaseline="middle" textAnchor="middle">{props.node.name}</text>
      </g>
    );
  }

  _handleDragStart() {
    return false;
  }

  _handleMouseDown(evt) {

    if (this.props.onMouseDown) {
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
    
    var tx = adx > 0.1 ? (src.width / 2) / adx : 1.0;
    var ty = ady > 0.1 ? (src.height / 2) / ady : 1.0;
    var t0 = Math.min(tx, ty);

    tx = adx > 0.1 ? (trg.width / 2) / adx : 1.0;
    ty = ady > 0.1 ? (trg.height / 2) / ady : 1.0;
    var t1 = 1 - Math.min(tx, ty);

    var x0 = src.x + t0 * dx;
    var y0 = src.y + t0 * dy;
    var x1 = src.x + t1 * dx;
    var y1 = src.y + t1 * dy;

    var path = `M ${x0} ${y0} L ${x1} ${y1}`;

    return <path className="link" d={path}/>;
  }
}

class Graph extends React.PureComponent {
  constructor(props) {
    super(props);

    var graph = {
      nodes: [
        { name: "A" },
        { name: "B" },
        { name: "C" },
        { name: "D" }
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 0 },
        { source: 2, target: 3 },
      ]
    }

    graph.nodes.forEach(v => { v.width = 100; v.height = 30; });

    this._handleTick = this._handleTick.bind(this);
    this._handleStart = this._handleStart.bind(this);
    this._handleEnd = this._handleEnd.bind(this);

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);

    this.state = { started: false, tick: 0 };

    this._cola = new Layout();
    this._cola
      .size([ 800, 600 ])
      .nodes(graph.nodes)
      .links(graph.edges)
      .handleDisconnected(false) // handle disconnected repacks the components which would hide any drift 
      .avoidOverlaps(true) // force non-overlap
      //.symmetricDiffLinkLengths(80)
      .jaccardLinkLengths(100, 0.7)
      .on("tick", this._handleTick)
      .on("start", this._handleStart)
      .on("end", this._handleEnd);

    // Note that starting the layout process in the constructor is not possible.
    // We do that in componentWillMount.
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
      //console.log("DRAG START " + this._mouseDownNode.name);
      WebCola.Layout.dragStart(this._mouseDownNode);
    }

    if (this._dragging) {
      //console.log("DRAG " + this._mouseDownNode.name + " "+ dx + "," + dy);
      WebCola.Layout.drag(this._mouseDownNode, { x: this._mouseDownPos.nx + dx, y: this._mouseDownPos.ny + dy });
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

  render() {

    if (!this.state.started) {
      return null;
    }

    var nodes = this._cola.nodes().map( n => <Node key={n.index} node={n} x={n.x} y={n.y} width={n.width} height={n.height} onMouseDown={this._handleMouseDown}/>);
    var edges = this._cola.links().map( e => {

      var help = e.source.x + "," + e.source.y + "-" + e.target.x + "," + e.target.y;

      return <Edge key={e.source.index + "-" + e.target.index} id={help} source={e.source} target={e.target}/>

    });

    return (
      <svg width="800" height="600" style={{ userSelect: "none" }}>
        <text x={0} y={600}>{this.state.tick}</text>
        <g>
          {nodes}
          {edges}
        </g>
      </svg>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <Graph/>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
