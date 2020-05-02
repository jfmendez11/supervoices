import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { HashRouter } from 'react-router-dom'
import Navigation from "./components/other/Navigation";
import {createMuiTheme, MuiThemeProvider} from "@material-ui/core";

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#0d47a1',
        },
    },
    typography: {
        useNextVariants: true,
    },
});


ReactDOM.render(
    <HashRouter>
        <MuiThemeProvider theme={theme}>
            <Navigation/>
        </MuiThemeProvider>
    </HashRouter>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
