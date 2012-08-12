function Node(parameters) {
  var context = this;
  $.each(parameters, function(key, element) {
    context[key] = element;
  });

  this.id = null;
  this.removed = false;
  this.children = [];
  this._children = null;

  if (parameters.children !== undefined) {
    parameters.children.forEach(function(child) {
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
  return this.children != null;
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
  return this.is_open() ? this.children : this._children;
}

Node.prototype.add_child = function(parameters) {
  var node = new Node(parameters)
  this.get_children().push(node);
  return node;
}

Node.prototype.was_removed = function() {
  return this.removed || (!this.is_root() && this.parent.was_removed());
}

Node.prototype.remove = function() {
  this.removed = true;
  if (this.is_root())
    return;
  var children = this.parent.get_children();
  children.splice(children.indexOf(this), 1);
  return this.parent;
}



