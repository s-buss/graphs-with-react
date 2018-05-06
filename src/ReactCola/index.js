import React from 'react';

import * as WebCola from 'webcola';

import Layout from './Layout';
import SvgCanvas from './SvgCanvas';
import Node from './Node';

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
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
        this._handleTransformChanged = this._handleTransformChanged.bind(this);

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
            .size([ this.props.width, this.props.height ])
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
            this.setState({ dragging: true });
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
            WebCola.Layout.dragEnd(this._mouseDownNode);
            this._dragging = false;
            this.setState({ dragging: false });
        }
    }

    _handleTransformChanged(scale, tx, ty) {
        this._scale = scale;
    }

    render() {

        if (!this.state.started) {
            return null;
        }

        var nodes = this._cola.nodes().map( n => {
            return (
                <Node key={n.id} node={n} onMouseDown={this._handleMouseDown}>
                    {this.props.renderNode(n)}
                </Node>
            );
        });
        var edges = this._cola.links().map(e => this.props.renderEdge(e.source, e.target, false));

        var secondaryEdges = undefined;
        var graph = this.props.graph;
        if (graph.secondary_edges) {
            secondaryEdges = graph.secondary_edges.map(e => this.props.renderEdge(e.source, e.target, true));
        }

        var overlay = <text x={0} y={this.props.height}>{this.state.tick}</text>;

        return (
          <SvgCanvas className="graph" width={this.props.width} height={this.props.height} style={{ userSelect: "none" }} onTransformChanged={this._handleTransformChanged} dragging={this.state.dragging} overlay={overlay}>
              <defs>
                  <marker className="arrow" id="arrow" markerWidth="9" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L0,6 L9,3 z" />
                  </marker>
                  <marker className="secondary-arrow" id="secondary-arrow" markerWidth="9" markerHeight="6" refX="7" refY="3" orient="auto" markerUnits="strokeWidth" fill="lightgray">
                      <path d="M0,0 L0,6 L9,3 z" />
                  </marker>
              </defs>
              {secondaryEdges}
              {edges}
              {nodes}
          </SvgCanvas>
        );
    }
}

export default Graph;
