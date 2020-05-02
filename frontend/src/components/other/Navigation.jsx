import React, {Component} from 'react';
import Cookies from 'universal-cookie';
import axios from 'axios';
import {NavLink, Route, Redirect, Switch} from 'react-router-dom'

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import Home from "../admin/Home";
import SignIn from "./SignIn";
import Contest from "../contest/Contest";

const linkStyle = {textDecoration: "none", color: "inherit", margin: "0 5px"};

class Navigation extends Component {

    constructor(props) {
        super(props);
        this.state = {
            auth: false,
            contests: [],
            user: null
        };
        this.updateAuth = this.updateAuth.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.getContests = this.getContests.bind(this);
        this.handleUser = this.handleUser.bind(this);
    }

    /**
     * Method that updates the current session state
     * @param auth contains whether the user is authenticated or not
     */
    updateAuth(auth) {
        this.setState({auth: auth});
    }

    /**
     * Method to log out the user
     */
    handleLogout = () => {
        let cookies = new Cookies();
        cookies.remove("SUPERVOICES_TOKEN_COOKIE", {path: '/'});
        this.setState({auth: false, user: null});
    };

    /**
     * Method that gets all user events by user id
     */
    getContests() {
        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE", {path: '/'});
        let config = {
            headers: {'Authorization': 'Bearer ' + token}
        };
        axios.get('/API/contests', config)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                this.setState({contests: data})
            })
            .catch((err) => {
                console.log(err);
            });
    }

    componentDidMount() {
        this.handleUser();
    }

    handleUser() {
        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE", {path: '/'});
        if (token) {
            let config = {
                headers: {'Authorization': 'Bearer ' + token}
            };
            axios.get('/API/getUser', config)
                .then((res) => {
                    return res.data;
                })
                .then((data) => {
                    this.setState({
                        user: {
                            name: data.name,
                            lastname: data.lastname,
                            email: data.email,
                            _id: data._id,
                        },
                        auth: true
                    },()=>this.getContests());

                })
                .catch((err) => {
                    console.log(err);
                    console.log("errror")
                    cookies.remove("SUPERVOICES_TOKEN_COOKIE");
                    this.setState({
                        auth: false,
                        contests: [],
                        user: null
                    });
                });
        }
    }

    render() {

        return (

            <div id="navigation">
                <AppBar position="static" color="default" style={{position: "relative"}}>
                    <Toolbar>
                        <Typography variant="h6" color="inherit" noWrap style={{flex: 1}}>
                            Super Voices
                        </Typography>

                        <NavLink exact to="/" style={linkStyle}>
                            <Button>
                                Inicio
                            </Button>
                        </NavLink>

                        {this.state.auth ?
                            <Button color="primary" variant="outlined" onClick={this.handleLogout}>
                                Cerrar sesión
                            </Button>
                            :
                            <NavLink exact to="/login" style={linkStyle}>
                                <Button color="primary" variant="outlined">
                                    Iniciar sesión
                                </Button>
                            </NavLink>
                        }

                    </Toolbar>
                </AppBar>

                <div className="content">
                    <Switch>
                        <Route exact path="/" render={() => <Home renderContests={this.handleUser.bind(this)}
                                                                  contests={this.state.contests} auth={this.state.auth}
                                                                  user={this.state.user}/>}/>
                        <Route exact path="/login"
                               render={() => (this.state.auth ? <Redirect to='/'/> :
                                   <SignIn handleUser={this.handleUser} updateAuth={this.updateAuth}
                                           getContests={this.getContests}
                                           updateComponent={this.handleUser.bind(this)}/>)}/>
                        <Route exact path="/contests/:url"
                               render={(props) => <Contest auth={this.state.auth} user={this.state.user} {...props}/>}/>

                    </Switch>
                </div>
            </div>
        );
    }
}

export default Navigation