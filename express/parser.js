var dot = require('graphlib-dot');

module.exports.parseDOT = function ( dotfile ) {
  var graph = dot.read( dotfile );
  let obj = Object();
  let incounts = Object();
  
  graph.nodes().forEach(node => {
    incounts[ node ] = 0;
  });
  
  graph.edges().forEach(item => {
    if( obj[ item.v ] )
      obj[ item.v ].push( item.w );
    else 
      obj[item.v] = [item.w];
    incounts[ item.w ] += 1;
  });

  Object.keys(obj).forEach(key => obj[ key ].sort());
  let sources = Object.keys(incounts).filter(node => incounts[ node ] === 0);
  
  return [ obj, sources ];
};

module.exports.parseRSF = function ( rsffile ) {
  let lines = rsffile.split(/\r?\n/);
  let graph = Object();
  let nodes = Set();
  let incounts = Set();
  
  lines.map(l => l.split(' ')).forEach(([ _, parent, child ]) => {
    if( !graph[ parent ] )
      graph[ parent ] = Array();
    graph[ parent ].push( child );
    nodes.add( parent ).add( child );
    incounts.add( child );
  });

  Object.keys( graph ).forEach(key => graph[ key ].sort());
  let sources = [ ...nodes ].filter(node => !incounts.has( node ));
  return [ graph, sources ];
};