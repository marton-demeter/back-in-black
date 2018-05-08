import React from 'react';
import s from './scrollable.scss';

// Component to create a scrollable wrapper, goes inside flexbox
class Scrollable extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    if( this.props.displayed === false ) {
      return( <div /> )
    }
    else {
      return(
        <div className={ s['scrollable'] } style={ this.props.styleParent }>
          <div className={ s['scrollable-container'] }>
            <div 
              className={ s['scrollable-list'] }
              style={ this.props.styleChild }>
              { this.props.component }
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Scrollable;