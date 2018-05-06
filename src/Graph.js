import React from 'react';

import ReactCola from './ReactCola';

import './Graph.css';

class DemoNode extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = { ty: 0 };
    }

    componentDidMount() {
        var bbox = this._text.getBBox();

        this.props.node.width = bbox.width + 20;

        // Note that setting the node width does not trigger a rerendering of the node
        // but during the next tick, the node is rendered again.

        // Make sure the text is aligned vertically
        this.setState({ ty: -bbox.y + (this.props.node.height - bbox.height) / 2 });
    }

    render() {

        var node = this.props.node;

        var w = node.width;
        var h = node.height;

        return (
            <g className={`node ${node.color}`}>
                <rect x={0} y={0} rx={5} width={w} height={h}/>
                <text ref={e => this._text = e} x={w/2} y={this.state.ty} textAnchor="middle">{node.name}</text>
            </g>
        );
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

class DemoGraph extends React.PureComponent {
    render() {
        return (
            <ReactCola 
                width={1000} height={600}
                graph={this.props.graph} renderNode={(node) => <DemoNode node={node}/>}
                renderEdge={(source, target, secondary) => <Edge key={`${source.index}-${target.index}`} state={source.x + "," + source.y + "-" + target.x + "," + target.y} source={source} target={target} secondary={secondary}/>}/>
        )
    }
}

export default DemoGraph;