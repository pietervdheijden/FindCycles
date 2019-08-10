var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  var results = findCycles(req.body.network, req.body.assets);
  res.send(results);

  // res.send('respond with a resource');
});

module.exports = router;




// Algorithm copied from: https://github.com/andrewhayward/dijkstra
    
var Graph = (function (undefined) {

	var extractKeys = function (obj) {
		var keys = [], key;
		for (key in obj) {
		    Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
		}
		return keys;
	}

	var sorter = function (a, b) {
		return parseFloat (a) - parseFloat (b);
	}

	var findPaths = function (map, start, end, infinity) {
		infinity = infinity || Infinity;

		var costs = {},
		    open = {'0': [start]},
		    predecessors = {},
		    keys;

		var addToOpen = function (cost, vertex) {
			var key = "" + cost;
			if (!open[key]) open[key] = [];
			open[key].push(vertex);
		}

		costs[start] = 0;

		while (open) {
			if(!(keys = extractKeys(open)).length) break;

			keys.sort(sorter);

			var key = keys[0],
			    bucket = open[key],
			    node = bucket.shift(),
			    currentCost = parseFloat(key),
			    adjacentNodes = map[node] || {};

			if (!bucket.length) delete open[key];

			for (var vertex in adjacentNodes) {
			    if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
					var cost = adjacentNodes[vertex],
					    totalCost = cost + currentCost,
					    vertexCost = costs[vertex];

					if ((vertexCost === undefined) || (vertexCost > totalCost)) {
						costs[vertex] = totalCost;
						addToOpen(totalCost, vertex);
						predecessors[vertex] = node;
					}
				}
			}
		}

		if (costs[end] === undefined) {
			return null;
		} else {
			return predecessors;
		}

	}

	var extractShortest = function (predecessors, end) {
		var nodes = [],
		    u = end;

		while (u !== undefined) {
			nodes.push(u);
			u = predecessors[u];
		}

		nodes.reverse();
		return nodes;
	}

	var findShortestPath = function (map, nodes) {
		var start = nodes.shift(),
		    end,
		    predecessors,
		    path = [],
		    shortest;

		while (nodes.length) {
			end = nodes.shift();
			predecessors = findPaths(map, start, end);

			if (predecessors) {
				shortest = extractShortest(predecessors, end);
				if (nodes.length) {
					path.push.apply(path, shortest.slice(0, -1));
				} else {
					return path.concat(shortest);
				}
			} else {
				return null;
			}

			start = end;
		}
	}

	var toArray = function (list, offset) {
		try {
			return Array.prototype.slice.call(list, offset);
		} catch (e) {
			var a = [];
			for (var i = offset || 0, l = list.length; i < l; ++i) {
				a.push(list[i]);
			}
			return a;
		}
	}

	var Graph = function (map) {
		this.map = map;
	}

	Graph.prototype.findShortestPath = function (start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(this.map, start);
		} else if (arguments.length === 2) {
			return findShortestPath(this.map, [start, end]);
		} else {
			return findShortestPath(this.map, toArray(arguments));
		}
	}

	Graph.findShortestPath = function (map, start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(map, start);
		} else if (arguments.length === 3) {
			return findShortestPath(map, [start, end]);
		} else {
			return findShortestPath(map, toArray(arguments, 1));
		}
	}

	return Graph;

})();


// Custom functions
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sum(array) {
	return array.reduce((a,b)=>a+b,0);
}

function findCycles(network, assets) {
  // If number of assets per node isn't specified,
  // then set assets[i] = sum[n], where i is the index of node n.
  if (assets.length == 0) {
    network.forEach(function(node, index, array) {
      assets.push(sum(node));
    })
  }

  // Get active nodes
  activeNodes = [];
  network.forEach(function(node, nodeIndex, array){
    if (sum(node) > 0 && assets[nodeIndex] > 0) {
      activeNodes.push(nodeIndex);
    }
  });

  // Initialize cycles
  var cycles = [];

  // Try to find cycles until the number of activeNodes is less than 2
  while (activeNodes.length > 1) {

    // Generate map
    var map = {}

    // Set random startNode
    var startNode = activeNodes[getRandomInt(0, activeNodes.length-1)]
    map['start'] = {}
    map['start'][startNode] = 1

    // Fill map
    network.forEach(function(node, nodeIndex, array) {
      map[nodeIndex] = {}
      node.forEach(function(nodeVertex, nodeVertexIndex, array) {
        if (nodeVertex > 0 && activeNodes.includes(nodeVertexIndex)) {
          if (nodeVertexIndex == startNode) {
            map[nodeIndex]['end'] = 1
          } else {
            map[nodeIndex][nodeVertexIndex] = 1
          }
        }
      });
    })

    // Create graph
    var graph = new Graph(map);

    // Find shortest cycle
    var shortestCycle = graph.findShortestPath('start', 'end');
    if (shortestCycle == null) {
      // remove startNode from activeNodes
      activeNodes = activeNodes.filter(n => n !== startNode)
      continue;
    }

    // Transform cycle
    shortestCycle.shift(); // remove 'start' from cycle
    shortestCycle.pop(); // remove 'end' from cycle
    shortestCycle.push(`${startNode}`); // complete the cycle by adding the startNode to the end

    // Store cycle
    cycles.push(shortestCycle);

    // Update network
    var previousNode;
    shortestCycle.forEach(function(node, index, array){
      if (index != 0) {
        // decrement vertices from previous node to current node
        network[previousNode][node]--;

        // decrement number of assets for previousNodes
        assets[previousNode]--;

        // check if previousNode has to be removed from activeNodes
        if (sum(network[previousNode]) == 0 || assets[previousNode] <= 0) {
          activeNodes = activeNodes.filter(n => n != previousNode);
        }
      }
      previousNode = node;
    });
  }

  return {
    cycles: cycles,
    network: network,
    assets: assets
  }
}