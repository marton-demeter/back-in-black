import React from 'react';
import s from './collapsible.scss';
import c from 'classnames';
import Item from './item/item.jsx';

// Component for collapsible node list
class Collapsible extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    menuItems: Array(), // array of Items
    itemList: Array() // array of objects ( searchable )
  }
  // Update nodes
  componentWillReceiveProps(nextProps) {
    if(nextProps.nodes.name) {
      let menuItems = Array();
      let itemList = Array();
      menuItems.push( this.constructItems(nextProps.nodes) );
      this.constructMenu(nextProps.nodes, itemList);
      this.setState({
        ...this.state,
        menuItems: menuItems,
        itemList: itemList
      });
    }
  }
  // Recursively create Items
  constructItems = ( item ) => {
    let children = null;
    let dropdown = false;
    if(item.children) {
      children = item.children.map(item => {
        return( this.constructItems(item) );
      });
      dropdown = true;
    }
    return(
      <Item 
        name={ item.name }
        children={ children }
        dropdown={ dropdown }
        level={ item.level }
        indent={ item.level }
        state={ item.state }
        onClick={ this.props.onItemClick }
        onToggle={ this.props.onItemToggle }
        onMouseOver={ this.props.onItemMouseOver }
        visible={ true }
      />
    );
  }
  // Recursively create filterable list
  constructMenu = (item, itemList) => {
    let dropdown = false;
    if(item.children) {
      item.children.map(item => {
        return( this.constructMenu(item, itemList) );
      });
      dropdown = true;
    }
    itemList.push({
      name: item.name,
      state: item.state,
      level: item.level,
      dropdown: dropdown
    });
  }
  render() {
    return(
      <div className={ s['collapsible'] }>
        {
          this.props.query.length ?
          this.state.itemList.map(item => {
            let regex = new RegExp( this.props.query.toLowerCase() );
            if(regex.test( item.name.toLowerCase() ))
              return(
                <Item
                  name={ item.name }
                  children={ null }
                  dropdown={ item.dropdown }
                  level={ item.level }
                  indent={ 0 }
                  state={ item.state }
                  onClick={ this.props.onItemClick }
                  onToggle={ this.props.onItemToggle }
                  onMouseOver={ this.props.onItemMouseOver }
                  visible={ true }
                  border={ true }
                />
              )
          }) : null
        }
        <div 
          className={
            c(s['collapsible-list'],this.props.query.length?s['hidden']:null)
          }>
          {
            this.state.menuItems.map(item => {
              return item;
            })
          }
        </div>
      </div>
    );
  }
}

export default Collapsible;