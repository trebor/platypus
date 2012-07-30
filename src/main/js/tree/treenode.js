function Node(node_data) {
  var context = this;
  
  $.each(node_data, function(key, element) {
    context[key] = element;
  });
}
  
  
