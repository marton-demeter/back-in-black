import React from 'react';
import s from './d3.scss';
import * as d3 from 'd3';

// Component for D3 visualization
class D3 extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    container: 'd3-container-'+this.props.system, // container name
    containerid: '#d3-container-'+this.props.system, // container css selector
    id: this.props.system, // container id number
    colors: { // color matrix for nodes, edges, text, queries, selected
      n: { n: 'red', ne: 'darkred', h: 'green', he: 'darkgreen' },
      e: { n: '#aaa', h: 'lightgreen' },
      t: { n: 'black', h: 'darkblue' },
      q: { h: 'blue', he: 'darkblue' },
      s: { h: 'yellow', he: 'orange' }
    },
    nodes: Object(), // systemNodes passed from system.jsx
    filtered: Array(), // filtered systemNodes by this.props.query
    lookup: Object() // lookup table passed from system.jsx
  }
  // Initial setup of D3 svg DOM element
  componentDidMount() {
    let svg = d3.select( this.state.containerid )
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform)
      }))
      .append('g')
      .attr('transform', 'translate(10,25)');
  }
  // Node clicked -> Expand or collapse
  handleMouseClick = (item, lookup) => {
    this.props.onClick( item );
  }
  // Hover over node -> Ascendants and descendants highlighted
  handleMouseOver = (item, nodes, lookup) => {
    this.highlightAscendants( item, this.state.colors, true );
    this.highlightDescendants( item, this.state.colors, true );
  }
  // Hover out node -> Ascendants and descendants returned to previous state
  handleMouseOut = (item, nodes, lookup) => {
    this.highlightAscendants( item, this.state.colors, false );
    this.highlightDescendants( item, this.state.colors, false );
    if( this.props.query.length && this.state.filtered.length )
      this.highlightQueryNodes( this.state.filtered, this.state.colors );
    this.highlightClickedNode( this.props.itemClicked, this.state.colors );
  }
  // Create id to this particular system
  createid = str => str.replace(/\$/g,'_')+'_'+this.state.id
  // Convert id to queryable string
  lookupid = str => str.replace(/\$/g,'_').replace(/\./g,'\\.')
  // Highlight ascendants of a node ( handled locally w/ css )
  highlightAscendants( item, color, state) {
    if( item.parents !== null) {
      let parentName = item.parents[ item.parents.length - 1 ];
      let edgeID = this.lookupid(parentName+'_'+item.name+'_'+this.state.id);
      let searchQuery = 'this.state.nodes' + this.state.lookup[parentName].join('');
      let parentObject = eval(searchQuery);
      let cn = state ? color.n.h : color.n.n;
      let cne = state ? color.n.he : color.n.ne;
      let ce = state ? color.e.h : color.e.n;
      d3.select('#' + this.lookupid( parentName+'_'+this.state.id ))
        .style('fill', cn)
        .style('stroke', cne)
        .attr('data-highlighted', state);
      d3.select('#' + edgeID)
        .style('stroke', ce)
        .attr('data-highlighted', state);
      this.highlightAscendants( parentObject, color, state );
    }
  }
  // Highlight queried node ( main searchbar )
  highlightQueryNode( item, color ) {
    d3.select('#' + this.lookupid( item.data.name + '_' + this.state.id ))
      .style('fill', color.q.h)
      .style('stroke', color.q.he);
  }
  // Wrapper to highlight all nodes matching query ( main searchbar )
  highlightQueryNodes( items, color ) {
    items.forEach(item => {
      this.highlightQueryNode( item, color );
    });
  }
  // Highlight node clicked on sidebar
  highlightClickedNode( itemName, color ) {
    d3.select('#' + this.lookupid( itemName + '_' + this.state.id ))
      .style('fill', color.s.h)
      .style('stroke', color.s.he);
  }
  // Highlight descendants of a node ( handled locally w/ css )
  highlightDescendants( item, color, state ) {
    let cn = state ? color.n.h : color.n.n;
    let cne = state ? color.n.he : color.n.ne;
    let ce = state ? color.e.h : color.e.n;
    d3.select('#' + this.lookupid( item.name+'_'+this.state.id ))
      .style('fill', cn)
      .style('stroke', cne)
      .attr('data-highlighted', state);
    if( item.children !== null ) {
      item.children.forEach(child => {
        d3.select('#' + this.lookupid(item.name+'_'+child.name+'_'+this.state.id ))
          .style('stroke', ce)
          .attr('data-highlighted', state);
        this.highlightDescendants( child, color, state );
      });
    }
  }
  // Render nodes according to information in this.props.nodes
  drawNodes( item ) {
    let svg = d3.select( this.state.containerid + ' svg');
    svg = svg.select('g');
    
    // Clear previous rendering
    svg.selectAll('circle').remove();
    svg.selectAll('path').remove();
    svg.selectAll('text').remove();
    
    // Add hierarchical data to this.props.node ( depth etc. )
    let root = d3.hierarchy( item );
    
    // Add coordinates to hierarchical this.props.nodes ( x , y )
    let tree = d3.tree().nodeSize([ 30, 500 ]);
    
    // Render links first
    let links = svg.selectAll('path')
      .data( tree(root).links() )
      .enter()
      .append('path')
      .attr('id', d => this.createid(d.source.data.name+'_'+d.target.data.name))
      .attr('class', d => d.source.data.state.expanded&&d.source.data.state.visible?null:s['hidden'])
      // Create curved path
      .attr("d", d => {
        return "M" + d.source.y + "," + d.source.x
              + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
              + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
              + " " + d.target.y + "," + d.target.x;
      })
      .attr('stroke', this.state.colors.e.n)
      // paths are filled by default
      .attr('fill', 'none')
      .attr('stroke-width',  2);
    
    // Entry point for nodes
    let nodes = svg.selectAll('circle')
      .data( tree(root).descendants() )
      .enter();
      
    // Add text specific to the node
    nodes.append('text')
      .attr('id', d => this.createid('text--'+d.data.name) )
      .attr('dx', d => d.y + 18)
      .attr('dy', d => d.x + 4)
      .attr('class', d => {
        let classList = null;
        if( d.parent ) {
          d.parent.data.state.expanded && d.data.state.visible ? null : classList = s['hidden'];
        }
        return classList;
      })
      .attr('fill', this.state.colors.t.n)
      .text(d => d.data.name);
    
    // Add circles to represent nodes
    nodes.append('circle')
      .attr('id', d => this.createid(d.data.name) )
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
      .attr('class', d => {
        let classList = null;
        if( d.parent ) {
          d.parent.data.state.expanded && d.data.state.visible ? null : classList = s['hidden'];
        }
        return classList;
      })
      .on('mouseover', d => this.handleMouseOver(d.data))
      .on('mouseout', d => this.handleMouseOut(d.data))
      .on('click', d => this.handleMouseClick(d.data))
      .attr('fill', d => d.data.state.clicked?this.state.colors.s.h:this.state.colors.n.n)
      .attr('fill-opacity', 0.5)
      .attr('stroke', d => d.data.state.clicked?this.state.colors.s.he:this.state.colors.n.ne)
      .attr('stroke-width', 3)
      .attr('r', 10);
  }
  // Create filtered list that contains nodes that match the query
  filterNodes( root, query ) {
    if(query) {
      let arr = d3.hierarchy( root ).descendants();
      if(arr[0].data.name) {
        let filtered = arr.filter(item => {
          let regex = new RegExp( query.toLowerCase() );
          return regex.test( item.data.name.toLowerCase() );
        });
        return filtered;
      }
    } else return [];
    return [];
  }
  // Handle query if present ( originating from main searchbar )
  componentWillReceiveProps(nextProps) {
    let filtered = Array();
    if( nextProps.query.length )
      filtered = this.filterNodes( nextProps.nodes, nextProps.query );
    this.setState({
      ...this.state,
      nodes: nextProps.nodes,
      lookup: nextProps.lookup,
      filtered: filtered
    });
  }
  // Handle initial state ( no items in this.props.nodes )
  shouldComponentUpdate(nextProps, nextState) {
    if(!nextProps.nodes) return false;
    if(!nextProps.nodes.name) return false;
    return true;
  }
  // Re-render graph on updated information
  componentDidUpdate() {
    if( !this.props.query.length )
      this.drawNodes( this.state.nodes );
    else {
      this.drawNodes( this.state.nodes );
      this.highlightQueryNodes( this.state.filtered, this.state.colors );
    }
  }
  render() {
    return(
      <div className={ s['d3'] } id={ this.state.container }>
      
      </div>
    );
  }
}

export default D3;