import React, {Component} from 'react';

//import { ValidatorForm, TextValidator} from 'react-material-ui-form-validator';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import withStyles from '@material-ui/core/styles/withStyles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {ValidatorForm, TextValidator} from 'react-material-ui-form-validator';


const styles = theme => ({
    main: {
        width: 'auto',
        display: 'block', // Fix IE 11 issue.
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
            width: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    paper: {
        marginTop: theme.spacing.unit * 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
        textAlign: 'center'
    },
    avatar: {
        margin: 'auto',
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing.unit,
    },
    submit: {
        marginTop: theme.spacing.unit * 3,
    },
});

function TabContainer(props) {
    return (
        <span style={{padding: 8 * 3}}>
            {props.children}
        </span>
    );
}

class SignIn extends Component {
    constructor(props) {
        super(props);
        this.classes = props.classes;
        this.state = {
            value: 0,
            name: "",
            lastname: "",
            email: "",
            password: "",
            repeatPassword: "",
            message: null
        };
    }

    componentDidMount() {
        // custom rule will have name 'isPasswordMatch'
        ValidatorForm.addValidationRule('isPasswordMatch', (value) => {
            if (value !== this.state.password) {
                return false;
            }
            return true;
        });
    }

    handleLogin = e => {
        e.preventDefault();
        let user = {
            email: this.state.email,
            password: this.state.password
        };
        axios.post('/API/loginUser', user)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                this.setState({message: data.message});
                this.props.updateAuth(data.auth);
                if (data.auth) {
                    let cookies = new Cookies();
                    cookies.set("SUPERVOICES_TOKEN_COOKIE", data.token, {path: '/'});
                    this.props.getContests();
                    this.props.updateComponent();
                }
            })
            .catch((err) => {
                console.log(err);
            });
    };

    handleSignup = e => {
        e.preventDefault();

        let user = {
            name: this.state.name,
            lastname: this.state.lastname,
            email: this.state.email,
            password: this.state.password
        };
        axios.post('/API/signupUser', user)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                this.setState({message: data.message});
                this.props.updateAuth(data.auth);
                if (data.auth) {
                    let cookies = new Cookies();
                    cookies.set("SUPERVOICES_TOKEN_COOKIE", data.token, {path: '/'});
                }
                this.props.handleUser();
            })
            .catch((err) => {
                console.log(err);
            });
    };

    handleTabChange = (event, value) => {
        this.setState({value});
    };

    handleChange = (e) => {

        this.setState(
            {
                [e.target.name]: e.target.value
            }
        )
    };

    render() {
        const {value} = this.state;
        return (
            <main className={this.classes.main}>
                <CssBaseline/>
                <Paper className={this.classes.paper}>
                    <Tabs value={value} onChange={this.handleTabChange}>
                        <Tab label="Iniciar sesión"/>
                        <Tab label="Crear cuenta"/>
                    </Tabs>
                    {value === 0 && <TabContainer>
                        <Avatar className={this.classes.avatar}>
                            <LockOutlinedIcon/>
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Inicia sesión
                        </Typography>
                        <ValidatorForm
                            onSubmit={this.handleLogin}
                            ref="form"
                            onError={errors => console.log(errors)}
                        >
                            <TextValidator
                                margin="normal"
                                label="Correo"
                                fullWidth
                                onChange={this.handleChange}
                                name="email"
                                value={this.state.email}
                                validators={['required', 'isEmail']}
                                errorMessages={['Este campo es obligatorio', 'Por favor ingrese un correo válido']}
                            />

                            <FormControl margin="normal" required fullWidth>
                                <InputLabel htmlFor="password">Password</InputLabel>
                                <Input name="password" type="password" id="password" autoComplete="current-password"
                                       onChange={this.handleChange}/>
                            </FormControl>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                className={this.classes.submit}
                            >
                                Iniciar sesión
                            </Button>
                        </ValidatorForm>
                    </TabContainer>}
                    {value === 1 && <TabContainer>
                        <Avatar className={this.classes.avatar}>
                            <LockOutlinedIcon/>
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Regístrate
                        </Typography>
                        <ValidatorForm
                            onSubmit={this.handleSignup}
                            ref="form"
                            onError={errors => console.log(errors)}
                        >
                            <TextValidator
                                margin="normal"
                                label="Nombre"
                                fullWidth
                                onChange={this.handleChange}
                                name="name"
                                value={this.state.name}
                                validators={['required']}
                                errorMessages={['Este campo es obligatorio']}
                            />

                            <TextValidator
                                margin="normal"
                                label="Apellido"
                                fullWidth
                                onChange={this.handleChange}
                                name="lastname"
                                value={this.state.lastname}
                                validators={['required']}
                                errorMessages={['Este campo es obligatorio']}
                            />

                            <TextValidator
                                margin="normal"
                                label="Correo"
                                fullWidth
                                onChange={this.handleChange}
                                name="email"
                                value={this.state.email}
                                validators={['required', 'isEmail']}
                                errorMessages={['Este campo es obligatorio', 'Por favor ingrese un correo válido']}
                            />

                            <TextValidator
                                margin="normal"
                                label="Contraseña"
                                fullWidth
                                onChange={this.handleChange}
                                name="password"
                                type="password"
                                validators={['required']}
                                errorMessages={['Este campo es obligatorio']}
                                value={this.state.password}
                            />
                            <TextValidator
                                margin="normal"
                                label="Confirmación contraseña"
                                fullWidth
                                onChange={this.handleChange}
                                name="repeatPassword"
                                type="password"
                                validators={['isPasswordMatch', 'required']}
                                errorMessages={['Las contraseñas no coinciden', 'Este campo es obligatorio']}
                                value={this.state.repeatPassword}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                className={this.classes.submit}
                            >
                                Crear mi cuenta
                            </Button>
                        </ValidatorForm>
                    </TabContainer>}
                </Paper>
            </main>
        );
    }
}

export default withStyles(styles)(SignIn);

SignIn.propTypes = {
    updateAuth: PropTypes.func.isRequired,
    getContests: PropTypes.func.isRequired,
};