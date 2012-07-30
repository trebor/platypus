function StuffTree(divId) {
  var context = this;

  this.margin = {top: 0, right: 0, bottom: 0, left: 0};
  this.width = $(divId).width() - 0; 
  this.height = $(divId).height() - 5;
  this.cx = this.width / 2;
  this.cy = this.height / 2;
  this.i = 0;
  this.duration = 500;
  this.root;

  // display constants

  this.box_size = 50;
  this.box_corner = 4;


  this.tree = d3.layout.tree().size([this.width, this.height]);

  this.diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

  this.vis = d3.select(divId).append("svg")
    .attr("width", context.width)
    .attr("height", context.height)
    .append("g")
    .attr("transform", "translate(" + 0 + "," + 50 + ")");

//  d3.json("./flare.json", function(json) {
  d3.json("./data.json", function(json) {
    context.root = new Node(json);
    context.root.x0 = context.width / 2;
    context.root.y0 = 0;

    function collapse(d) {
      d.get_children().forEach(collapse);
      d.close();
    }

    context.root.get_children().forEach(collapse);
    context.update(context.root);
  });
};

StuffTree.prototype.update = function(source) {
  var context = this;

  // compute the new tree layout

  var nodes = this.tree.nodes(this.root).reverse();

  // normalize for fixed-depth

  nodes.forEach(function(d) { d.y = d.depth * 100; });

  // select the nodes

  var node = this.vis.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++context.i); });

  // enter any new nodes at the parent's previous position

  var nodeEnter = node.enter()
    .append("g")
    .classed("node", true)
    .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; });
//    .on("mouseover", function (d) {return context.zoom_node(d);})
//    .on("mouseout", function (d) {return context.unzoom_node(d);});

  
  // add the node box

  nodeEnter.append("svg:rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0)
    .on("click", function(d) {return context.click(d);});

  nodeEnter.append("text")
    .classed("add_button", true)
    .attr("dx", ".1em")
    .attr("dy", "-.1em")
    .attr("x", this.box_size / 2)
     .attr("y", this.box_size / 2)
    .text("+")
    .on("click", function(d) {context.add_child(d, "new");});

  nodeEnter.append("text")
    .classed("child_count", true)
    .attr("dx", "-1em")
    .attr("dy", "-.5em")
    .attr("x", this.box_size / 2)
    .attr("y", this.box_size / 2);

//   nodeEnter
//     .fiter(function(d) {return d.parent !== undefined;})
//     .append("text")
//     .classed("delete_button", true)
//     .attr("dx", ".2em")
//     .attr("dy", "-.1em")
//     .attr("x", -this.box_size / 2)
//      .attr("y", this.box_size / 2)
//     .text("-")
//     .on("click", function(d) {d.remove();});

  nodeEnter.append("text")
    .classed("title", true)
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2)
    .attr("dy", "1.1em")
    .attr("dx", "0.5em")
    .attr("text-anchor", "start")
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);

  // class new nodes

  var nodeUpdate = node
    .classed("branch", function(d) {return !d.is_leaf();})
    .classed("leaf", function(d) {return d.is_leaf();})
    .classed("closed", function(d) {return d.is_closed();})
    .classed("open", function(d) {return d.is_open();})
    .transition()
    .duration(context.duration)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });


  nodeUpdate
    .select(".child_count")
    .text(function(d) {
      var count = d.get_children().length;
      return count > 0 ? count : "";
    });

  // post transition size

  nodeUpdate
    .select(".node rect")
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2)
    .attr("rx", this.box_corner)
    .attr("ry", this.box_corner)
    .attr("width", this.box_size)
    .attr("height", this.box_size);

  nodeUpdate.select(".title")
    .style("fill-opacity", 1);

  // transition exiting nodes back into parent

  var nodeExit = node.exit().transition()
    .duration(context.duration)
    .attr("transform", 
          function(d) { return "translate(" + source.x + "," + source.y + ")"; })
    .remove();

  // shrink away departing node boxes

  nodeExit
    .select(".node rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0);
  
  // fade away node text

  nodeExit.select(".title")
    .style("fill-opacity", 1e-6);

  // Update the links…
  var link = this.vis.selectAll("path.link")
    .data(context.tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
      var o = {x: source.x0, y: source.y0};
      return context.diagonal({source: o, target: o});
    });

  // Transition links to their new position.
  link.transition()
    .duration(context.duration)
    .attr("d", context.diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(context.duration)
    .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return context.diagonal({source: o, target: o});
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

StuffTree.prototype.add_child = function(node, name) {
  node.open();
  node.children = node.get_children();
  node.children.push(new Node({name: name}));
  this.update(node);
}

// toggle children on click

StuffTree.prototype.click = function(node) {

  if (node.is_open())
    node.close();
  else
    node.open();
  
  this.update(node);
}

// 

StuffTree.prototype.zoom_node = function(node) {
  d3.selectAll(".node rect")
    .filter(function(d) {return d == node;})
    .transition()
    .attr("width", 200);
}
// toggle children on click

StuffTree.prototype.unzoom_node = function(node) {
  var context = this;

  d3.selectAll(".node rect")
    .filter(function(d) {return d == node;})
    .transition()
    .attr("width", context.box_size);
}
