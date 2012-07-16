function StuffTree(divId) {
  var context = this;

  this.margin = {top: 0, right: 0, bottom: 0, left: 0};
  this.width = $(divId).width(); 
  this.height = $(divId).height();
  this.cx = this.width / 2;
  this.cy = this.height / 2;
  this.i = 0;
  this.duration = 500;
  this.root;

  // display constants

  this.box_size = 20;
  this.box_corner = 4;


  this.tree = d3.layout.tree().size([this.width, this.height]);

  this.diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

  this.vis = d3.select(divId).append("svg")
    .attr("width", context.width)
    .attr("height", context.height)
    .append("g")
    .attr("transform", "translate(" + 0 + "," + 50 + ")");

  d3.json("./flare.json", function(json) {
    context.root = json;
    context.root.x0 = context.width / 2;
    context.root.y0 = 0;

    function collapse(d) {
      context.get_node_children(d).forEach(collapse);
      context.close_node(d);
    }

    context.root.children.forEach(collapse);
    context.update(context.root);
  });
};

StuffTree.prototype.update = function(source) {
  var context = this;

  // Compute the new tree layout.
  var nodes = this.tree.nodes(this.root).reverse();

    // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 100; });

  // Update the nodes…
  var node = this.vis.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++context.i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .classed("node", true)
    .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
    .on("click", function(d) {return context.click(d);});

  nodeEnter.append("svg:rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0);

  nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);

  // class new nodes

  var nodeUpdate = node
    .classed("branch", function(d) {return !context.is_node_leaf(d);})
    .classed("leaf", function(d) {return context.is_node_leaf(d);})
    .classed("closed", function(d) {return !context.is_node_open(d);})
    .classed("open", function(d) {return context.is_node_open(d);})
    .transition()
    .duration(context.duration)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  // post transition size

  nodeUpdate
    .select(".node rect")
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2)
    .attr("rx", this.box_corner)
    .attr("ry", this.box_corner)
    .attr("width", this.box_size)
    .attr("height", this.box_size);

  nodeUpdate.select("text")
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

  nodeExit.select("text")
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

StuffTree.prototype.open_node = function(node) {
  if (this.is_node_open(node))
    return;
  node.children = node._children;
  node._children = null;
}

StuffTree.prototype.close_node = function(node) {
  if (!this.is_node_open(node))
    return;
  node._children = node.children;
  node.children = null;
}

StuffTree.prototype.is_node_open = function(node) {
  var c = node.children;
  return c !== undefined && c != null && c.length > 0;
}

StuffTree.prototype.get_node_children = function(node) {
  var children = this.is_node_open(node) ? node.children : node._children;
  return children === undefined || children == null ? [] : children;
}

StuffTree.prototype.is_node_leaf = function(node) {
  return this.get_node_children(node).length == 0;
}

  // Toggle children on click.
StuffTree.prototype.click = function(node) {
  
  if (this.is_node_open(node))
    this.close_node(node);
  else
    this.open_node(node);

  this.update(node);
}
