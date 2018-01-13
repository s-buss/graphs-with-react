import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Graph from './Graph.js';

var graph = {
  nodes: [
    { id: 1, name: "Abcdefg", color: "ood" },
    { id: 2, name: "B", color: "ok" },
    { id: 3, name: "C", color: "fup" },
    { id: 4, name: "D", color: "err" }
  ],
  edges: [
    { source: 0, target: 1 },
    { source: 1, target: 2 },
    { source: 2, target: 0 },
    { source: 2, target: 3 },
  ]
}

graph.nodes.forEach(v => { v.width = 100; v.height = 30; });

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <Graph graph={graph}/>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
