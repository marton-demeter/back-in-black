import React from 'react';
import s from './systems.scss';
import c from 'classnames';
import Scrollable from '../scrollable/scrollable.jsx';

// Component to view list of systems ( Init )
class Systems extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    selectedSystem: null // clicked system
  }
  // Handle selecting a system ( submission )
  selectSystem = () => {
    this.props.onSelectSystem( this.state.selectedSystem );
  }
  // Handle clicking a system
  selectItem = (e, name) => {
    this.setState({ ...this.state, selectedSystem: name });
    this.props.onSelectItem( name );
  }
  render() {
    if(this.props.visible) {
      return(
        <div className={ s['systems-container'] }>
          <div className={ s['systems'] }>
            <div className={ s['systems-list-title'] }>
              Available Systems
            </div>
            <Scrollable
              component={
                this.props.systems.map((system,i) => {
                  return(
                    <div
                      key={ i }
                      className={ 
                        c(s['system-list-item'],system.selected?s['active']:null) 
                      }
                      onClick={ e => this.selectItem(e,system.name) }>
                      { system.name }
                    </div>  
                  );
                })
              }
            />
            <div 
              className={ 
                c(
                  s['systems-list-submit-button'],
                  this.state.selectedSystem!=null?null:s['disabled']
                )
              }
              onClick={ this.state.selectedSystem!=null?this.selectSystem:null }>
              Select
            </div>
          </div>
        </div>
      );
    } else {
      return(<div />);
    }
  }
}

export default Systems;