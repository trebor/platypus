function StuffTree(divId) {
  var context = this;

  this.next_id = 0;
  this.root;

  // display constants

  this.width = $(divId).width() - 0; 
  this.height = $(divId).height() - 5;
  this.cx = this.width / 2;
  this.cy = this.height / 2;
  this.margin = 50;
  this.zoom_duration = 1000;
  this.duration = 500;
  this.people_width = 200;
  this.stuff_width = this.width - this.people_width;
  this.row_depth = 75;
  this.box_size = 50;
  this.box_corner = 4;
  console.log(this.width, this.people_width, this.stuff_width);

  // construct tree

  this.tree = d3.layout.tree().size([this.width - this.people_width, this.height]);

  // create line connector

  this.diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

  // create svg

  this.svg =  d3.select(divId).append("svg:svg")
    .attr("width", context.width)
    .attr("height", context.height);

  // create a group for the stuff tree

  this.stuff_group = this.svg
    .append("g")
    .classed("stuff", true)
    .attr("transform", "translate(" + context.people_width + "," + context.margin + ")");

  this.zoom_group = this.svg
    .append("g")
    .classed("stuff", true)
    .attr("transform", "translate(" + context.people_width + "," + 0 + ")");

  // create a group for the people

  this.people_group = this.svg
    .append("g")
    .classed("people", true);

  
  d3.json("./peeps.json", function(people) {
    context.people = people;

    d3.json("./data.json", function(json) {
      context.root = new Node(json);
      context.root.x0 = context.stuff_width / 2;
      context.root.y0 = 0;

      function collapse(d) {
        d.get_children().forEach(collapse);
        d.close();
      }

      context.root.get_children().forEach(collapse);
      context.update(context.root);
    });
  });
};

StuffTree.prototype.update = function(source) {
  var context = this;

  // add the people

  var peeps = this.people_group.selectAll("g.person")
    .data(context.people, function(d) {return d.name});
  
  var peepsEnter = peeps.enter()
    .append("svg:g")
    .classed("person", true)
    .attr("transform", function(d, i) {
      var step = context.height / context.people.length;
      return "translate(" + (context.people_width / 2) + "," + (step / 2 + i * step) + ")"; });

  // add the people circles

  peepsEnter.append("svg:circle")
    .attr("r", context.box_size / 2);

  // add name

  peepsEnter.append("svg:text")
    .classed("person_text", true)
    .attr("dy", "0.3em")
    .text(function (d) {return d.name;});
  
  // compute the new tree layout

  var nodes = this.tree.nodes(this.root).reverse();

  // normalize for fixed-depth

  nodes.forEach(function(d) { d.y = d.depth * context.row_depth; });

  // select the nodes

  var node = this.stuff_group.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = context.get_next_id());});

  // enter any new nodes at the parent's previous position

  var nodeEnter = node.enter()
    .append("svg:g")
    .classed("node", true)
    .style("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + source.x0 + "," + source.y0 + ")";
    });

  // add the node box

  nodeEnter.append("svg:rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 0)
    .attr("height", 0)
    .on("click", function(d) {return context.click(d);});

  nodeEnter.append("text")
    .classed("child_count", true)
    .attr("dx", "-.3em")
    .attr("dy", "-.5em")
    .attr("x", this.box_size / 2)
    .attr("y", this.box_size / 2);

  nodeEnter.append("text")
    .classed("add_button button", true)
    .attr("dx", ".1em")
    .attr("dy", "-.1em")
    .attr("x", this.box_size / 2)
     .attr("y", this.box_size / 2)
    .text("+")
    .on("click", function(d) {context.add_node(d);});

  nodeEnter
    .append("text")
    .classed("zoom_button button", true)
    .attr("dx", ".1em")
    .attr("dy", "-0.1em")
    .attr("x", -this.box_size / 2)
    .attr("y", this.box_size / 2)
    .text(String.fromCharCode(0x25F1))
    .on("click", function(d) {context.zoom_node(d);});

  nodeEnter
    .append("text")
    .classed("delete_button button", true)
    .attr("dx", "-.7em")
    .attr("dy", "0.7em")
    .attr("x", this.box_size / 2)
    .attr("y", -this.box_size / 2)
    .attr("visibility", function (d) {return d.is_root() ? "hidden" : "visibile";})
    .text(String.fromCharCode(0xd7))
    .on("click", function(d) {context.update(d.remove());});

  nodeEnter.append("text")
    .classed("title", true)
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2)
    .attr("dy", "1.1em")
    .attr("dx", "0.5em")
    .attr("text-anchor", "start")
    .text(function(d) { return d.name; });

  // class new nodes

  var nodeUpdate = node
    .classed("branch", function(d) {return !d.is_leaf();})
    .classed("leaf", function(d) {return d.is_leaf();})
    .classed("closed", function(d) {return d.is_closed();})
    .classed("open", function(d) {return d.is_open();})
    .transition()
    .duration(context.duration)
    .style("opacity", 1)
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + (d.y) + ")"; 
    });
  
  // add node count

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

  // park child nodes into parent on close

  node.exit()
    .filter(function(d) {return !d.was_removed();})
    .transition()
    .duration(context.duration)
    .style("opacity", 0)
    .attr("transform", function(d) {
      return "translate(" + source.x + "," + source.y + ")"; })
    .remove();

  // fade out deleted nodes

  node.exit()
    .filter(function(d) {return d.was_removed();})
    .transition()
    .duration(context.duration)
    .style("opacity", 0)
    .remove();

  // Update the links…
  var link = this.stuff_group.selectAll("path.link")
    .data(context.tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.

  link.enter()
    .insert("path", "g")
    .attr("class", "link")
    .style("opacity", 0)
    .attr("d", function(d) {
      var o = {x: source.x0, y: source.y0};
      return context.diagonal({source: o, target: o});
    });

  // transition links to their new position.

  link.transition()
    .duration(context.duration)
    .style("opacity", 1)
    .attr("d", context.diagonal);

//   link.transition()
//     .duration(context.duration * 2)

  // transiton closing links into parent

  link.exit()
    .filter(function(d) {return !d.target.was_removed();})
    .transition()
    .duration(context.duration)
    .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return context.diagonal({source: o, target: o});
    });

  // fade out all exit links

  link.exit()
    .transition()
    .duration(context.duration / 2)
    .style("opacity", 0)
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

// add node

StuffTree.prototype.add_node = function(node) {
  node.add_child({name: "new"});
  node.open();
  this.update(node);
};

// toggle children on click

StuffTree.prototype.click = function(node) {

  if (node.is_open())
    node.close();
  else
    node.open();
  
  this.update(node);
}

// get next id

StuffTree.prototype.get_next_id = function() {
  return ++this.next_id;
}

// zoom into a node

StuffTree.prototype.zoom_node = function(node) {
  var context = this;

  // make node data

  var datax = [node];

  // great node group

  var zoom_node_update = this.zoom_group.selectAll("g.zoom_node")
    .data(datax, function(d) {
      return context.get_next_id();
    });
  
  var zoom_node_enter = zoom_node_update
    .enter()
    .append("svg:g")
    .classed("zoom_node", true)
    .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";})
    .on("click", function() {context.unzoom_node(node);});

  zoom_node_enter
    .append("svg:rect")
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2 + this.margin)
    .attr("rx", this.box_corner)
    .attr("ry", this.box_corner)
    .attr("width", this.box_size)
    .attr("height", this.box_size);

  zoom_node_update
    .transition()
    .duration(this.zoom_duration)
    .attr("transform", function(d) {return "translate(" + 0 + "," + 0 + ")";});

  zoom_node_update.selectAll(".zoom_node rect")
    .transition()
    .duration(this.zoom_duration)
    .attr("x", 0)
    .attr("y", this.margin / 2)
    .attr("width", context.stuff_width - this.margin / 2)
    .attr("height", context.height - this.margin);
}

// zoom out of a node

StuffTree.prototype.unzoom_node = function(node) {
  var context = this;

  this.zoom_group.selectAll("g.zoom_node")
    .transition()
    .duration(this.zoom_duration)
    .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";})
    .remove();

  this.zoom_group.selectAll(".zoom_node rect")
    .transition()
    .duration(this.zoom_duration)
    .attr("x", this.box_size / -2)
    .attr("y", this.box_size / -2 + this.margin)
    .attr("rx", this.box_corner)
    .attr("ry", this.box_corner)
    .attr("width", this.box_size)
    .attr("height", this.box_size);
}
