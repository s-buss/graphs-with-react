## graphs-with-react

Almost all examples for using WebCola (http://marvl.infotech.monash.edu/webcola/) combine it with D3.js for
rendering the graphs. Since I am more aquainted with React, this little project shows how to use React components
for nodes and links while letting WebCola layout the elements.

Nodes and edges are rendered by pure components so that React's DOM manipulation optimizations can work. The only
trick is to enforce the update of the DOM by adding additional props to the components. An edge does not only use
the nodes it connects as properties, but also an artifical string built out of the node positions. This causes the
edges to be rendered again when the position of one of the connected nodes changes.

The tick event of the graph layout causes the rerendering by modifying the state of the Graph component. To avoid
performance issues (many ticks between two renderings), the Layout class is tweaked a little bit. The tick loop was
removed and a new method nextFrame was introduced that has to be called after rendering each step. This gives the
smooth animation that the combination with D3.js delivers.