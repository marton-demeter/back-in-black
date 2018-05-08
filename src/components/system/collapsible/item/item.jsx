import React from 'react';
import s from './item.scss';
import c from 'classnames';

// Component for a collapsable node list item
class Item extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    colorMatrix: [ // colors for different levels
      'lightgreen',
      'lightpink',
      'lightblue',
      'lightyellow',
      'plum'
    ]
  }
  // Handle click -> expand / shrink
  handleToggleClick = e => {
    e.stopPropagation();
    this.props.onToggle( this.props.name );
  }
  // Handle graph selection click
  handleClick = e => {
    this.props.onClick( this.props.name );
  }
  // Handle hover over item
  handleMouseOver = e => {
    this.props.onMouseOver( this.props.name );
  }
  // Handle indent + level color
  style = {
    paddingLeft: (((0.5 * this.props.indent) + 0.25) + 'rem'),
    backgroundColor: this.props.color || this.state.colorMatrix[ this.props.level % 5 ]
  }
  render() {
    if(this.props.visible) {
      return(
        <div className={ s['item'] }>
          <div
            className={ c(s['header'],this.props.border?s['border']:null) } 
            onClick={ this.handleClick }
            onMouseOver={ this.handleMouseOver }
            style={ this.style }>
            <div className={ s['title'] } > 
              { this.props.name }
            </div>
            {
              this.props.dropdown ?
                this.props.state.expanded ? 
                  <i
                    className={ c(s['fa'],s['fa-chevron-up']) }
                    onClick={ this.handleToggleClick } /> 
                  : <i 
                      className={ c(s['fa'],s['fa-chevron-down']) }
                      onClick={ this.handleToggleClick } />
                : null
            }
          </div>
          <div className={ c(s['children'],this.props.state.expanded?s['visible']:null) }>
            { this.props.children }
          </div>
        </div>
      );
    } else {
      return( <div /> );
    }
  }
}

export default Item;