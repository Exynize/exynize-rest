import React from 'react';
import ReactDOM from 'react-dom';

// import styles
// styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-material-design/dist/css/material.min.css';
import 'bootstrap-material-design/dist/css/ripples.min.css';
import 'bootstrap-material-design/dist/css/roboto.min.css';

const App = React.createClass({
    getInitialState() {
        return {
            data: [],
        };
    },

    componentWillMount() {
        const ws = new WebSocket('ws://' + window.location.host + window.location.pathname);
        ws.onopen = () => ws.send(JSON.stringify({token: window.location.search.split('=')[1]}));
        ws.onclose = () => console.log('done');
        ws.onmessage = (event) => {
            const resp = JSON.parse(event.data);
            console.log('message', resp);
            if (Array.isArray(resp)) {
                this.setState({data: [...resp, ...this.state.data]});
            } else {
                this.setState({data: [resp, ...this.state.data]});
            }
        };
    },

    render() {
        if (this.props.children) {
            return React.cloneElement(this.props.children, this.state);
        }

        return <div>No render set!</div>;
    },
});

window.App = App;
window.React = React;
window.ReactDOM = ReactDOM;
