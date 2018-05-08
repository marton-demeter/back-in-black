import React from 'react';
import axios from 'axios';
import s from './system.scss';
import c from 'classnames';
import Collapsible from './collapsible/collapsible.jsx';
import D3 from './d3/d3.jsx';
import SearchBar from '../search/search.jsx';
import Scrollable from '../scrollable/scrollable.jsx';

// Component for a single system
class System extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    systemDropdownVisible: false, // system selection dropdown state
    systemNodes: Object(), // master list of system nodes and their states
    systemQuery: String(), // query corresponding to system search in dropdown
    parentsLookup: Object(), // lookup table for eval
  }
  // Initialize dropdown + request nodes
  componentDidMount = () => {
    if(this.props.systemName !== 'Choose a System')
      this.getNodes(this.props.systemName);
  }
  // Update system name + nodes
  componentWillReceiveProps = (nextProps) => {
    if(this.props.systemName != nextProps.systemName)
      this.getNodes(nextProps.systemName);
  }
  // Query the nodes for the given system
  getNodes = systemName => {
    axios({
      method: 'get',
      url: encodeURI('/api/systems/' + systemName)
    })
    .then(response => {
      if(response.status === 200) {
        let nodes = response.data.graph;
        let nodeObject = Object();
        let nodeArray = Array();
        let parentsLookup = Object();
        let childObject = Object();
        response.data.sources.forEach(source => {
          childObject = this.convertNodes(source, nodes[source], nodes, ['Root'], 1, parentsLookup);
          nodeObject[source] = childObject;
          nodeArray.push(childObject);
        });
        let tree = {
          name: 'Root',
          children: nodeArray,
          kids: nodeObject,
          parents: null,
          level: 0,
          state: {
            expanded: true,
            visible: true,
            highlighted: false,
            queried: false,
            clicked: false
          },
          lastClicked: null,
          lastHighlighted: null
        };
        parentsLookup['Root'] = [''];
        this.setState({
          ...this.state,
          systemNodes: tree,
          parentsLookup: parentsLookup
        });
      }
    })
    .catch(error => { console.log(error) });
  }
  // Convert matrix to required format + Eval lookup table
  convertNodes = (key, children, system, parents, level, p) => {
    if(!level) level = 1;
    let subObj = {
      name: key,
      state: {
        expanded: true,
        highlighted: false,
        visible: true,
        queried: false,
        clicked: false
      },
      children: null,
      kids: null,
      parents: null,
      level: level
    };
    parents = parents.slice(0, level);
    if(children) {
      subObj.kids = Object();
      subObj.children = Array();
      parents.push(key);
      let childObj;
      children.forEach(child => {
        childObj = this.convertNodes(child,system[child],system,parents,level+1,p);
        subObj.kids[child] = childObj;
        subObj.children.push(childObj);
      });
    }
    subObj.parents = parents.slice(0, level);
    if(p) {
      let ev = Array();
      let subStr = String();
      subObj.parents.forEach(parent => {
        subStr = '';
        if(parent !== 'Root')
          subStr += '["' + parent + '"].kids';
        else
          subStr += '.kids';
        ev.push(subStr);
      });
      ev.push('["' + key + '"]');
      p[key] = ev;
    }
    return subObj;
  }
  // Handle clicking on dropdown
  handleDropdown = e => {
    e.stopPropagation();
    if(!this.state.systemDropdownVisible)
      this.setState({ 
        ...this.state,
        systemDropdownVisible: true
      });
  }
  // Clickin anywhere on the system area will close an open dropdown
  closeDropdown = e => {
    this.setState({
      ...this.state,
      systemDropdownVisible: false,
      systemQuery: String()
    });
  }
  // Handle selecting a different system from dropdown
  changeSystem = (e, index) => {
    this.closeDropdown();
    this.props.onChange(e,index,this.props.systemPosition);
  }
  // Handle closing the system through X
  closeSystem = e => {
    this.props.onClose(e, this.props.systemPosition);
  }
  // Handle system search from dropdown
  systemQueryChange = value => {
    this.setState({ ...this.state, systemQuery: value });
  }
  // Expand / Collapse sidebar item's children -> Hide subtree on graph
  onSidebarItemToggle = ( itemName, currentExpanded ) => {
    let systemNodes = this.state.systemNodes;
    let searchQuery = 'systemNodes' + this.state.parentsLookup[itemName].join('');
    let item = eval(searchQuery);
    let expanded = !item.state.expanded;
    this.modifyItem( item, { type: 'expand', data: expanded }, systemNodes );
    this.modifyDescendants( item, { type: 'expand', data: expanded }, systemNodes );
    this.setState({ ...this.state, systemNodes: systemNodes });
  }
  // Sidebar item click -> Highlight on graph
  onSidebarItemClick = itemName => {
    let systemNodes = this.state.systemNodes;
    let prev = systemNodes.lastClicked;
    if( prev !== null ) {
      let lastItem = 'systemNodes' + this.state.parentsLookup[ prev ].join('');
      eval(lastItem).state.clicked = false;
    }
    let searchQuery = 'systemNodes' + this.state.parentsLookup[ itemName ].join('');
    eval(searchQuery).state.clicked = true;
    systemNodes.lastClicked = itemName;
    this.setState({
      ...this.state,
      systemNodes: systemNodes
    });
  }
  // Side item hover -> Highlight ancestors + subtree on graph
  onSidebarItemMouseOver = itemName => {
    
  }
  // Modify ascendant visibility state
  modifyAscendants = ( item, modification, nodes ) => {
    if( item.parents !== null ) {
      let parentName = item.parents[ item.parents.length - 1 ];
      let searchQuery = 'nodes' + this.state.parentsLookup[parentName].join('');
      let parentObject = eval(searchQuery);
      switch( modification.type ) {
        case 'expand':
          eval(searchQuery).state.expanded = modification.data; break;
        case 'highlight':
          eval(searchQuery).state.highlighted = modification.data; break;
        default: break;
      }
      this.modifyAscendants( parentObject, modification, nodes );
    }
  }
  // Modify node visibility state
  modifyItem = ( item, modification, nodes ) => {
    let searchQuery = 'nodes' + this.state.parentsLookup[ item.name ].join('');
    switch( modification.type ) {
      case 'expand':
        eval(searchQuery).state.expanded = modification.data; break;
      case 'highlight':
        child.state.highlighted = modification.data; break;
      default: break;
    }
  }
  // Modify descendant visibility state
  modifyDescendants = ( item, modification, nodes, c) => {
    let searchQuery = 'nodes' + this.state.parentsLookup[ item.name ].join('');
    if( c ) {
      let parentName = item.parents[ item.parents.length - 1 ];
      let parentObject = eval('nodes' + this.state.parentsLookup[ parentName ].join(''));
      switch( modification.type ) {
        case 'expand':
          if( modification.data === false ) {
            eval(searchQuery).state.visible = false;
          } else {
            if( parentObject.state.expanded ) {
              eval(searchQuery).state.visible = true;
            } else {
              eval(searchQuery).state.visible = false;
            }
          }
          break;
        case 'highlight':
          eval(searchQuery).state.highlighted = modification.data; break;
        default: break;
      }
    }
    if( item.children !== null ) {
      eval(searchQuery).children.forEach(child => {
        this.modifyDescendants( child, modification, nodes, true);
      });
    }
  }
  // Node clicked on graph -> Hide descendants
  onD3NodeClick = ( item ) => {
    let systemNodes = this.state.systemNodes;
    let searchQuery = 'systemNodes' + this.state.parentsLookup[ item.name ].join('');
    item = eval(searchQuery);
    let expanded = !item.state.expanded;
    this.modifyItem( item, { type: 'expand', data: expanded }, systemNodes );
    this.modifyDescendants( item, { type: 'expand', data: expanded }, systemNodes );
    this.setState({ ...this.state, systemNodes: systemNodes });
  }
  // Hover over D3 node
  onD3NodeMouseOver = ( item ) => {
    
  }
  // Hover out D3 node
  onD3NodeMouseOut = ( item ) => {
    
  }
  render() {
    if(this.props.visible) {
      return(
        <div className={ s['system'] } onClick={ this.closeDropdown }>
          <div className={ s['left'] }>
            {
              this.state.systemDropdownVisible?
              <SearchBar
                placeholder={ 'Systems' }
                onChange={ this.systemQueryChange }
                value={ this.state.systemQuery }
                box={ true }
              />
              :
              <div 
                className={ s['system-name'] }
                onClick={ this.handleDropdown }>
                { this.props.systemName }
                <i className={ c(s['fa'],s['fa-chevron-down']) } />
              </div>
            }
            <div className={ s['dropdown-container'] }>
              <div className={
                c(s['systems-list'],this.state.systemDropdownVisible?s['visible']:null)
              }>
                <div className={ s['scrollbar-hidden'] }>
                  {
                    this.state.systemQuery.length ?
                    this.props.systemsList.map((system,i) => {
                      if( this.state.systemQuery ) {
                        let regex = new RegExp( this.state.systemQuery.toLowerCase() );
                        if(this.props.systemName != system)
                          if(system && regex.test( system.toLowerCase() ))
                            return(
                              <div 
                                className={ s['item'] } 
                                onClick={ e => this.changeSystem(e,i) }>
                                { system }
                              </div>
                            );
                      }
                    })
                    :
                    this.props.systemsList.map((system,i) => {
                      if(this.props.systemName != system)
                        return(
                          <div 
                            className={ s['item'] } 
                            onClick={ e => this.changeSystem(e,i) }>
                            { system }
                          </div>
                        );
                    })
                  }
                </div>
              </div>
            </div>
            <div className={ s['hierarchy-container'] }>
              <Scrollable
                component={
                  <Collapsible 
                    nodes={ this.state.systemNodes }
                    query={ this.props.query } 
                    onItemClick={ this.onSidebarItemClick }
                    onItemToggle={ this.onSidebarItemToggle }
                    onItemMouseOver={ this.onSidebarItemMouseOver }
                  />
                }
              />
            </div>
          </div>
          <div className={ s['d3-container'] }>
            <D3 
              nodes={ this.state.systemNodes }
              lookup={ this.state.parentsLookup }
              query={ this.props.query }
              itemClicked={ this.state.prev }
              itemClickedUpdated={ this.itemClickedUpdated }
              system={ this.props.systemPosition }
              systems={ this.props.activeSystems }
              onClick={ this.onD3NodeClick }
              onMouseOver={ this.onD3NodeMouseOver }
              onMouseOut={ this.onD3NodeMouseOut }
            />
          </div>
          <div 
            className={ 
              c(
                s['close-button-container'],
                this.props.closeButton?s['visible']:null
              )
            }>
            <div 
              className={ s['close-button'] } 
              onClick={ this.props.closeButton?this.closeSystem:null }>
              <i className={ c(s['fa'],s['fa-times']) } />
            </div>
          </div>
        </div>
      );
    } else {
      return(<div />); 
    }
  }
}

export default System;