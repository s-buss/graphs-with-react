## graphs-with-react

This project shows how webcola (http://marvl.infotech.monash.edu/webcola/) can be used with React components for graph rendering.

Nodes and edges are rendered by pure components so that the optimizated rendering of react works. The only trick is to
enforce the update of the DOM by adding additional props to the component. An edge does not only use the nodes it connects as property, but
also an artifical string built out of the node positions. This causes the edge to be rendered again when the poition of one of the connected nodes changes.

The tick event of the graph layout causes the rerendering by modifying the state of the Graph component.