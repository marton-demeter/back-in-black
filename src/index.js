import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app.jsx';
import s from './index.scss';

ReactDOM.render(<App />, document.getElementById('react-root'));

if (process.env.NODE_ENV !== 'production') {
  console.log('Development mode!');
}