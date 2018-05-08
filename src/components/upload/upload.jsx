import React from 'react';
import s from './upload.scss';
import c from 'classnames';

// Upload overlay
class Upload extends React.Component {
  constructor(props) {
    super(props)
  }
  state = {
    systemName: String(), // to be uploaded system's name
    targetFile: null, // to be uploaded system's file blob
    fileExtension: String(), // target file type
    submitEnabled: false, // submit button enabled state
    warningMessage: null, // warning message for duplicate system name
    timer: null // timer for delayed action when specifying system name
  }
  // For enabling / disabling submit button
  checkRequirements = (name, file, shortcut) => {
    if(shortcut != undefined) return shortcut;
    if(file != null && name.length)
      return true;
    return false;
  }
  // Handling text input for name field -> process after 250ms
  handleName = e => {
    let t = this.state.timer;
    if(t != null) clearTimeout(t);
    let self = this;
    t = setTimeout(() => {
      self.nameProcessing()
    }, 250);
    this.setState({
      ...this.state,
      systemName: e.target.value,
      timer: t,
      submitEnabled: false
    });
  }
  // Check requirements for submitting ( duplicate system names )
  nameProcessing = () => {
    let s = undefined;
    for(let i = 0; i < this.props.systems.length; i++) {
      if(this.props.systems[i].name === this.state.systemName) {
        s = false;
        break;
      }
    }
    let enabled = this.checkRequirements(this.state.systemName, this.state.targetFile, s);
    this.setState({ 
      ...this.state,
      submitEnabled: enabled,
      warningMessage: s === false ? 'System name already exists!' : null
    });
  }
  // Handling file input for file field
  handleFile = e => {
    if(e.target.files.length) {
      let extensionFlag = null;
      if(e.target.files[0].name.slice(-4) === '.rsf')
        extensionFlag = '.rsf';
      if(e.target.files[0].name.slice(-4) === '.dot')
        extensionFlag = '.dot';
      if(extensionFlag === null) {
        alert('Currently only .rsf and .dot files are supported.');
        e.target.value = String();
        return;
      }
      let name;
      let flag = false;
      if(this.state.systemName.length) name = this.state.systemName;
      else {
        flag = true;
        name = e.target.files[0].name;
        if(name.split(extensionFlag).length > 1)
          name = name.split(extensionFlag)[0] + '_' + extensionFlag.slice(-3);
      }
      let shortcut = undefined;
      if(this.state.warningMessage != null) shortcut = false;
      let enabled = false;
      if(!flag)
        enabled = this.checkRequirements(name, e.target.files[0], shortcut);
      this.setState({ 
        ...this.state,
        systemName: name,
        targetFile: e.target.files[0],
        fileExtension: e.target.files[0].name.slice(-3),
        submitEnabled: enabled
      }, () => { this.nameProcessing() });
    }
  }
  // Handling submit, clearing fields
  handleSubmit = () => {
    this.props.onSubmit( this.state );
    document.querySelector('input[type="file"]').value = String();
    this.setState({
      systemName: String(),
      targetFile: null,
      fileExtension: String(),
      submitEnabled: false
    });
  }
  // Exit by clicking on black area
  exitClick = e => {
    e.stopPropagation();
    this.props.onSubmit( undefined );
  }
  // Don't exit when clicking on control area
  preventExit = e => {
    e.stopPropagation();
  }
  render() {
    return(
      <div 
        className={ c(s['upload'],this.props.visible?s['visible']:null) }
        onClick={ this.exitClick }>
        <div className={ s['control'] } onClick={ this.preventExit }>
          <div className={ s['title'] }>
            Upload New System
          </div>
          <div className={ s['fields'] }>
            <div className={ s['name-container'] }>
              <div className={ s['name-input'] }>
                <label for='system-name'>System Name:</label>
                <input
                  name='system-name'
                  type='text' placeholder='System Name' value={ this.state.systemName }
                  onChange={ e => this.handleName(e) } />
              </div>
              <div className={ s['name-input']}>
                <label> </label>
                <div 
                  className={ 
                    c(s['warning-message'],this.state.warningMessage?s['visible']:null) 
                  }>
                  { this.state.warningMessage }
                </div>
              </div>
            </div>
            <div className={ s['file-container'] }>
              <label for='system-file'>System File:</label>
              <input name='system-file'
                type='file' onChange={ e => this.handleFile(e) } />
            </div>
            <div className={ s['button-container'] }>
              <div
                disabled={ !this.state.submitEnabled }
                className={ 
                  c(s['submit-button'],this.state.submitEnabled?null:s['disabled']) 
                } 
                onClick={ this.state.submitEnabled?this.handleSubmit:null }
              >
                Upload { this.state.systemName }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Upload;