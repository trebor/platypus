function Node(node_data) {
  var context = this;
  $.each(node_data, function(key, element) {
    context[key] = element;
  });

  this.children = [];

  if (node_data.children !== undefined) {
    node_data.children.forEach(function(child) {
      context.children.push(new Node(child));
    });
  }
}
  
Node.prototype.open = function() {
  if (this.is_open() || this.is_leaf())
    return;

  this.children = this._children;
  this._children = null;
}

Node.prototype.close = function() {
  if (this.is_closed() || this.is_leaf())
    return;

  this._children = this.children;
  this.children = null;
}

Node.prototype.is_open = function() {
  var c = this.children;
  return c !== undefined && c != null && c.length > 0;
}

Node.prototype.is_closed = function() {
  return !this.is_open();
}

Node.prototype.is_leaf = function() {
  return this.get_children().length == 0;
}

Node.prototype.is_root = function() {
  return this.parent === undefined;
}

Node.prototype.get_children = function() {
  var children = this.is_open() ? this.children : this._children;
  return (children === undefined || children == null) ? [] : children;
}

Node.prototype.add_child = function(data) {
  this.open();
  this.children = this.get_children();
  this.children.push(new Node(data));
}

Node.prototype.remove = function() {
  if (this.is_root())
    return;

  var context = this;
  var parent = this.parent;

  parent.children = parent.get_children().filter(function(d) {
    return d != context;
  });

  return parent;
}



