import React from 'react';
import axios from 'axios';
import s from './app.scss';
import c from 'classnames';
import SearchBar from './search/search.jsx';
import Systems from './systems/systems.jsx';
import System from './system/system.jsx';
import Upload from './upload/upload.jsx';

// Top level component
class App extends React.Component {
  constructor(props) {
    super(props);
  }
  state = {
    searchbarState: 'Systems', // value that appears in the main searchbar
    uploadVisible: false, // handles modal overlay state
    systemsAvailable: Array(), // array of available system names ( init )
    filteredSystems: Array(), // filtered list of systems specified by searchbar ( init )
    activeSystems: Array(), // handles systems for singular / split view
    systemVisible: false, // ( init ) -> ( system view )
    searchValue: String(), // search value of the main searchbar
    clearSearch: false // passed as a prop to clear the searchbar input
  }
  // Get systems already uploaded
  componentDidMount() {
    axios({
      method: 'get',
      url: '/api/systems'
    })
    .then(response => {
      let sys = response.data.map(system => ({
        name: system.name,
        selected: false
      }));
      this.setState({
        ...this.state,
        systemsAvailable: sys,
        filteredSystems: sys
      });
    })
    .catch(error => console.log(error.message));
  }
  // Show upload modal
  handleUploadStart = () => {
    this.setState({ ...this.state, uploadVisible: true });
  }
  // Process upload from modal
  handleUploadSubmission = uState => {
    this.setState({ ...this.state, uploadVisible: false });
    if(!uState) return;
    let formData = new FormData();
    formData.append('dotFile', uState.targetFile, uState.targetFile.name);
    formData.append('systemName', uState.systemName);
    axios({
      method: 'post',
      url: '/api/upload/' + uState.fileExtension,
      data: formData
    })
    .then(response => { 
      if(response.status === 200) {
        let state = this.state;
        state.systemsAvailable.push({ name: response.data, selected: false });
        let regex = new RegExp( state.searchValue.toLowerCase() );
        state.filteredSystems = state.systemsAvailable.filter(system => {
          if(regex.test( system.name.toLowerCase() ))
            return ({ name: system.name, selected: system.selected });
        });
        this.setState(state);
      } else {
        throw new Error();
      }
    })
    .catch(error => { console.log(error.message); alert('Failed to upload file') });
  }
  // Search
  onSearchChange = value => {
    if(!this.state.systemVisible) {
      let regex = new RegExp( value.toLowerCase() );
      let filteredList = this.state.systemsAvailable.filter(system => {
        if(regex.test( system.name.toLowerCase() ))
          return ({ name: system.name, selected: system.selected });
      });
      this.setState({
        ...this.state,
        searchValue: value,
        filteredSystems: filteredList
      });
    } else {
      this.setState({
        ...this.state,
        searchValue: value,
        clearSearch: false
      });
    }
  }
  // Systems List Item Selected
  onSystemItemSelected = ( name ) => {
    let filteredSystems = this.state.filteredSystems.map((system,i) => ({
      name: system.name,
      selected: system.name === name ? true : false
    }));
    let systems = this.state.systemsAvailable.map((system,i) => ({
      name: system.name,
      selected: system.name === name ? true : false
    }));
    this.setState({
      ...this.state,
      systemsAvailable: systems,
      filteredSystems: filteredSystems
    });
  }
  // Systems List Item Submitted
  onSystemSelected = ( name ) => {
    let activeSystems = this.state.activeSystems;
    activeSystems.push(name);
    this.setState({
      ...this.state,
      activeSystems: activeSystems,
      systemVisible: true,
      searchbarState: 'Nodes',
      searchValue: String(),
      clearSearch: true
    });
  }
  // Changed systems through dropdown ( in system view )
  changeSystem = (e, index, systemPosition) => {
    let newActiveSystems = Array();
    let activeSystems = this.state.activeSystems;
    switch(systemPosition) {
      case 0:
        newActiveSystems.push(this.state.systemsAvailable[index].name);
        if(this.state.activeSystems.length > 1)
          newActiveSystems.push(activeSystems.slice(1)[0]);
        break;
      case 1:
        newActiveSystems.push(activeSystems.slice(0,1)[0]);
        newActiveSystems.push(this.state.systemsAvailable[index].name);
    }
    this.setState({ ...this.state, activeSystems: newActiveSystems });
  }
  // Split systems view ( 1 -> 2 )
  extendView = () => {
    if( this.state.activeSystems.length < 2 ) {
      let activeSystems = this.state.activeSystems;
      activeSystems.push('Choose a System');
      this.setState({ ...this.state, activeSystems: activeSystems });
    }
  }
  // Single system view ( 2 -> 1 )
  closeSystem = (e, systemPosition) => {
    let newActiveSystems = Array();
    let activeSystems = this.state.activeSystems;
    if(systemPosition === 1)
      newActiveSystems.push(activeSystems.slice(0,1)[0]);
    else
      newActiveSystems.push(activeSystems.slice(1)[0]);
    this.setState({ ...this.state, activeSystems: newActiveSystems });
  }
  render() {
    return(
      <div className={ s['app'] }>
        <Upload 
          visible={ this.state.uploadVisible }
          systems={ this.state.systemsAvailable }
          onSubmit={ this.handleUploadSubmission }
        />
        <div className={ s['header'] }>
          <div className={ s['upload-button'] } onClick={ this.handleUploadStart }>
            Upload New System 
          </div>
          <SearchBar 
            placeholder={ this.state.searchbarState }
            searchValue={ this.state.searchValue }
            clear={ this.state.clearSearch }
            onChange={ this.onSearchChange }
          />
          <div 
            className={ 
              c(
                s['extend-button'],
                this.state.systemVisible?null:s['disabled'],
                this.state.activeSystems.length===2?s['disabled']:null
              )
            } 
            onClick={  this.state.systemVisible?this.extendView:null }>
            Compare Systems
          </div>
        </div>
        <div className={ s['systems-container'] }>
          <Systems
            systems={ this.state.filteredSystems }
            visible={ !this.state.systemVisible }
            onSelectItem={ this.onSystemItemSelected }
            onSelectSystem={ this.onSystemSelected }
          />
          {
            this.state.activeSystems.map((system,i) => {
              return(
                <System
                  key={ i }
                  visible={ this.state.systemVisible } 
                  systemName={ system }
                  onChange={ this.changeSystem }
                  systemsList={ this.state.systemsAvailable.map(system => system.name) }
                  activeSystems={ this.state.activeSystems }
                  numberOfActiveSystems={ this.state.activeSystems.length }
                  systemPosition={ i }
                  closeButton={ i===1?true:false }
                  onClose={ this.closeSystem }
                  query={ this.state.searchValue }
                />
              );
            })
          }
        </div>
      </div>
    );
  }
}

export default App;