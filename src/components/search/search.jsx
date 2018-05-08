import React from 'react';
import s from './search.scss';
import c from 'classnames';

// Component for searching systems / nodes
class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: String(), // input field value
      timer: null // timer for delayed reaction
    }
  }
  // Clear the text
  componentWillReceiveProps(nextProps) {
    if(nextProps.clear) {
      this.setState({ ...this.state, value: String() });
    }
  }
  // Stop click at SearchBar
  stopEvent = e => {
    e.stopPropagation();
  }
  // Handle input change -> forward after 250ms
  onChange = e => {
    let t = this.state.timer;
    if(t != null) clearTimeout(t);
    let self = this;
    let value = e.target.value;
    t = setTimeout(() => {
      self.props.onChange(value);
    }, 250);
    this.setState({ ...this.state, value: e.target.value, timer: t });
  }
  render() {
    return(
      <div
        className={ c(s['search-bar'],this.props.box?s['box']:null) }
        onClick={ this.stopEvent }>
        <input
          type='text'
          placeholder={ 'Search ' + this.props.placeholder || 'Search' }
          value={ this.state.value }
          onChange={ this.onChange }
          autoFocus
        />
      </div>
    );
  }
}

export default SearchBar;