import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Snackbar from '@material-ui/core/Snackbar';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import IconButton from '@material-ui/core/IconButton';
import green from '@material-ui/core/colors/green';
import classNames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import Entry from "./Entry";
import axios from "axios";
import {TextValidator, ValidatorForm} from "react-material-ui-form-validator";
import Cookies from "universal-cookie";
import {TableBody, TableHead} from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import LastPageIcon from '@material-ui/icons/LastPage';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import TablePagination from '@material-ui/core/TablePagination';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fade from '@material-ui/core/Fade';


const styles = theme => ({
    layout: {
        width: 'auto',
        marginTop: theme.spacing.unit * 6,
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(1100 + theme.spacing.unit * 3 * 2)]: {
            width: 1100,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    toolbarMain: {
        borderBottom: `1px solid ${theme.palette.grey[300]}`,
    },
    toolbarTitle: {
        flex: 1,
    },
    toolbarSecondary: {
        justifyContent: 'space-between',
    },
    mainFeaturedPost: {
        backgroundColor: theme.palette.grey[800],
        color: theme.palette.common.white,
        marginBottom: theme.spacing.unit * 4,
    },
    mainFeaturedPostContent: {
        padding: `${theme.spacing.unit * 6}px`,
        [theme.breakpoints.up('md')]: {
            paddingRight: 0,
        },
    },
    mainGrid: {
        marginTop: theme.spacing.unit * 3,
    },
    card: {
        display: 'flex',
    },
    cardDetails: {
        flex: 1,
    },
    banner: {
        maxHeight: "30vh",
        margin: "auto"
    },
    button: {
        margin: theme.spacing.unit,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
    },
    link: {
        textDecoration: "none",
        color: "inherit"
    },
    notification: {
        fontSize: "16px"
    }
});

const variantIcon = {
    success: CheckCircleIcon,
};

function MySnackbarContent(props) {
    const {classes, variant, onClose, message} = props;
    const Icon = variantIcon[variant];

    return (
        <SnackbarContent
            className={classNames(classes[variant])}
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar" className={classes.message}>
            <Icon className={classNames(classes.icon, classes.iconVariant)}/>
                    {message}
          </span>
            }
            action={[
                <IconButton
                    key="close"
                    aria-label="Close"
                    color="inherit"
                    className={classes.close}
                    onClick={onClose}
                >
                    <CloseIcon className={classes.icon}/>
                </IconButton>,
            ]}
        />
    );
}

const styles1 = theme => ({
    success: {
        backgroundColor: green[600],
    }
});

const MySnackbarContentWrapper = withStyles(styles1)(MySnackbarContent);

const actionsStyles = theme => ({
    root: {
        flexShrink: 0,
        color: theme.palette.text.secondary,
        marginLeft: theme.spacing.unit * 2.5,
    },
});

class TablePaginationActions extends React.Component {
    handleFirstPageButtonClick = event => {
        this.props.onChangePage(event, 0);
    };

    handleBackButtonClick = event => {
        this.props.onChangePage(event, this.props.page - 1);
    };

    handleNextButtonClick = event => {
        this.props.onChangePage(event, this.props.page + 1);
    };

    handleLastPageButtonClick = event => {
        this.props.onChangePage(
            event,
            Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1),
        );
    };

    render() {
        const {classes, count, page, rowsPerPage, theme} = this.props;

        return (
            <div className={classes.root}>
                <IconButton
                    onClick={this.handleFirstPageButtonClick}
                    disabled={page === 0}
                    aria-label="First Page"
                >
                    {theme.direction === 'rtl' ? <LastPageIcon/> : <FirstPageIcon/>}
                </IconButton>
                <IconButton
                    onClick={this.handleBackButtonClick}
                    disabled={page === 0}
                    aria-label="Previous Page"
                >
                    {theme.direction === 'rtl' ? <KeyboardArrowRight/> : <KeyboardArrowLeft/>}
                </IconButton>
                <IconButton
                    onClick={this.handleNextButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                    aria-label="Next Page"
                >
                    {theme.direction === 'rtl' ? <KeyboardArrowLeft/> : <KeyboardArrowRight/>}
                </IconButton>
                <IconButton
                    onClick={this.handleLastPageButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                    aria-label="Last Page"
                >
                    {theme.direction === 'rtl' ? <FirstPageIcon/> : <LastPageIcon/>}
                </IconButton>
            </div>
        );
    }
}

const TablePaginationActionsWrapped = withStyles(actionsStyles, {withTheme: true})(
    TablePaginationActions,
);


class Contest extends Component {
    constructor(props) {
        super(props);
        this.classes = props.classes;
        this.state = {
            contest: {},
            entries: [],
            openSubmit: false,
            name: "",
            lastName: "",
            email: "",
            selectedFile: null,
            open: false,
            openSnack: false,
            vertical: 'top',
            horizontal: 'center',
            page: 0,
            rowsPerPage: 50,
            showLoading: false
        };
        this.handleClickSubmitEntry = this.handleClickSubmitEntry.bind(this);
        this.handleCloseSubmit = this.handleCloseSubmit.bind(this);
        this.renderSubmitDialogue = this.renderSubmitDialogue.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSelectedFile = this.handleSelectedFile.bind(this);
        this.handleWinner = this.handleWinner.bind(this);
        this.getEntries = this.getEntries.bind(this);
        this.getContestInfo = this.getContestInfo.bind(this);
        this.renderEntries = this.renderEntries.bind(this);
        this.handleCloseSnack = this.handleCloseSnack.bind(this);
        this.isAdmin = this.isAdmin.bind(this);
    }

    componentDidMount() {
        this.getContestInfo();
        this.getEntries();
    }

    getContestInfo() {
        axios.get(`/API/contest/${this.props.location.pathname.split("/")[2]}`)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                this.setState({contest: data[0]}, () => {
                    if (this.state.contest) {
                        axios.get(`/API/entry/${this.state.contest.URL}`)
                            .then((res) => {
                                return res.data;
                            })
                            .then((data) => {
                                this.setState({entries: data})
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    } else {
                        this.setState({contest: {}})
                    }
                })
            })
            .catch((err) => {
                console.log(err);
            });
    }

    getEntries() {
        if (this.state.contest.ID) {
            axios.get(`/API/entry/${this.state.contest.ID}`)
                .then((res) => {
                    return res.data;
                })
                .then((data) => {
                    this.setState({entries: data})
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    handleClickSubmitEntry() {
        this.setState({openSubmit: true});
    }

    handleCloseSubmit() {
        this.cleanState();
        this.setState({
            openSubmit: false,
        });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }

    handleSubmit() {
        const entry = {
            contestId: this.state.contest._id,
            userId: this.state.contest.USER_ID,
            name: this.state.name,
            lastName: this.state.lastName,
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            email: this.state.email,
            status: 'No convertida',
            urlOriginal: '',
            urlConverted: '',
            urlContest: this.state.contest.URL
        };


        axios.post('/API/entry', entry)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                const recordData = new FormData();
                recordData.append('file', this.state.selectedFile, this.state.selectedFile.name);
                axios.post('/API/recording/' + data.USER_ID + '/' + this.state.contest._id + '/' + data._id, recordData, {
                    onUploadProgress: ProgressEvent => {
                        this.setState({showLoading: true});
                        this.setState({
                            loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                        });
                    },
                }).then(res => {
                    this.setState({showLoading: false, openSnack: true});
                    this.getEntries();
                }).catch((err) => {
                    console.log(err);
                });
            })
            .catch((err) => {
                console.log(err);
            });

        this.setState({openSubmit: false})
        this.cleanState();
    }

    handleSelectedFile(event) {
        this.setState({
            selectedFile: event.target.files[0]
        });
    }

    handleWinner(e) {
        e.preventDefault();
        let contest = this.state.contest;
        contest.WINNER_NAME = e.currentTarget.name;
        contest.WINNER_EMAIL = e.currentTarget.value;

        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE");
        let config = {
            headers: {'Authorization': 'Bearer ' + token}
        };

        axios.put('/API/contest/winner', contest, config)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                this.getContestInfo();
                this.getEntries();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    renderSubmitDialogue() {
        return (
            <Dialog
                style={{textAlign: "center"}}
                open={this.state.openSubmit}
                onClose={this.handleCloseSubmit}
                aria-labelledby="form-dialog-title"
            >
                <ValidatorForm
                    onSubmit={this.handleSubmit}
                    ref="form"
                    onError={errors => console.log(errors)}
                >
                    <DialogTitle id="form-dialog-title">Participar en el concurso</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Llene todos los campos para enviar su entrada al concurso
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="name"
                            value={this.state.name}
                            label="Nombres"
                            required
                            variant="outlined"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            onChange={this.handleInputChange}
                        />
                        <TextField
                            margin="dense"
                            name="lastName"
                            value={this.state.lastName}
                            label="Apellidos"
                            required
                            variant="outlined"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            onChange={this.handleInputChange}
                        />
                        <TextValidator
                            margin="dense"
                            label="Email"
                            variant="outlined"
                            onChange={this.handleInputChange}
                            name="email"
                            value={this.state.email}
                            validators={['required', 'isEmail']}
                            errorMessages={['This field is required', 'Email is not valid']}
                        />
                        <label htmlFor="button-file">
                            <Button variant="contained" component="span" className={this.classes.button}>
                                Subir archivo
                            </Button>
                        </label>
                        <input
                            onChange={this.handleSelectedFile}
                            accept="audio/*"
                            style={{display: 'none'}}
                            id="button-file"
                            type="file"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseSubmit} color="primary">
                            Cancelar
                        </Button>
                        <Button type="submit" color="primary">
                            Crear
                        </Button>
                    </DialogActions>
                </ValidatorForm>
            </Dialog>
        )
    }

    renderBanner() {
        return (
            <Paper className={this.classes.mainFeaturedPost}>
                <Grid container>
                    <Grid item md={6} sm={6} xs={12}>
                        <div className={this.classes.mainFeaturedPostContent}>
                            <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                                {this.state.contest.NAME}
                            </Typography>
                            <Typography variant="h5" color="inherit" paragraph>
                                Premio: {this.state.contest.PAYMENT}
                            </Typography>
                            {this.state.contest.WINNER_NAME != null ?
                                <div>
                                    <Typography variant="h6" color="inherit" paragraph>
                                        Ganador: {this.state.contest.WINNER_NAME + " (" + this.state.contest.WINNER_EMAIL + ")"}
                                    </Typography>
                                </div>
                                : ""}
                            <Grid container direction="row" justify="space-between">
                                <a className={this.classes.link}
                                   href={this.state.contest.SCRIPT_PATH}
                                   target="_blank" rel="noopener noreferrer">
                                    <Button variant="contained" size="large" color="primary">Guión/Texto</Button>
                                </a>
                                <a className={this.classes.link}
                                   href={this.state.contest.RECOMMENDATIONS_PATH}
                                   target="_blank" rel="noopener noreferrer">
                                    <Button variant="contained" size="large" color="primary">Recomendaciones</Button>
                                </a>
                            </Grid>
                        </div>
                    </Grid>
                    <Grid item md={6} sm={6} xs={12}>
                        <Grid style={{height: "100%"}} container alignItems="center" justify="center">
                            <img
                                className={this.classes.banner}
                                src={
                                    this.state.contest.IMAGE_PATH ?
                                        this.state.contest.IMAGE_PATH
                                        : "https://getuikit.com/v2/docs/images/placeholder_600x400.svg"}
                                title="Image title"
                                alt="Contest banner"
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        )
    }

    cleanState() {
        this.setState({
            name: '',
            lastName: '',
            email: '',
        });
    }

    handleChangePage = (event, page) => {
        this.setState({page});
    };

    renderEntries() {
        const {rowsPerPage, page} = this.state;
        let rows = this.state.entries;
        if (!this.isAdmin()) rows = rows.filter((entry) => entry.STATUS === "Convertida");
        return (
            <Grid container spacing={40}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[50]}
                                colSpan={3}
                                count={rows.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                SelectProps={{
                                    native: true,
                                }}
                                onChangePage={this.handleChangePage}
                                ActionsComponent={TablePaginationActionsWrapped}
                                labelDisplayedRows={({from, to, count}) => `${from} a ${to} de ${count}`}
                            />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((entry, index) => (
                            <TableRow key={index}>
                                <Entry entry={entry} handleWinner={this.handleWinner} isAdmin={this.isAdmin}
                                       winner={this.state.contest.WINNER_EMAIL}/>
                            </TableRow>

                        ))}
                    </TableBody>
                </Table>
            </Grid>
        )
    }

    renderSnackbar() {
        let vertical = this.state.vertical;
        let horizontal = this.state.horizontal;
        return (
            <Snackbar
                anchorOrigin={{vertical, horizontal}}
                open={this.state.openSnack}
                onClose={this.handleCloseSnack}
                autoHideDuration={6000}
                ContentProps={{
                    'aria-describedby': 'message-id',
                }}
            >
                <MySnackbarContentWrapper
                    onClose={this.handleCloseSnack}
                    variant="success"
                    message={<p className={this.classes.notification} id="message-id">Hemos recibido tu voz y la estamos
                        procesando para que sea publicada en la página del concurso lo más pronto posible.
                        <br/>
                        Cuando se encuentre lista te notificaremos por email!</p>}
                />
            </Snackbar>

        );
    }

    renderLoading() {
        return (
            <Snackbar
                open={this.state.showLoading}
                onClose={this.handleClose}
                anchorOrigin={{vertical: "top", horizontal: "center"}}
                TransitionComponent={Fade}
                message={

                    <React.Fragment>
                        <CircularProgress
                            className={this.classes.progress}
                            variant="determinate"
                            value={this.state.loaded}
                        />
                        <p>Espere un momento por favor</p>
                    </React.Fragment>

                }
            />
        );
    }

    handleCloseSnack = () => {
        this.setState({openSnack: false});
    };

    isAdmin() {
        return this.props.user ? this.props.user._id : "" === this.state.contest.USER_ID;
    }

    render() {
        return (
            <div className={this.classes.layout}>
                {this.renderSnackbar()}
                {this.state.contest && this.state.contest.STATUS ?
                    <div>
                        {this.renderBanner()}
                        {this.state.contest.STATUS === 'ongoing' && !this.isAdmin() ?
                            <Grid container spacing={40} direction="column" alignItems="center" justify="center">
                                <Grid item xs={12} md={12}>
                                    <Button variant="contained" size="large" color="primary"
                                            onClick={this.handleClickSubmitEntry}
                                            className={this.classes.button}>
                                        Participar en el concurso
                                        <CloudUploadIcon className={this.classes.rightIcon}/>
                                    </Button>
                                </Grid>
                            </Grid>
                            : ""}
                        {this.renderLoading()}
                        {this.renderEntries()}
                        {this.renderSubmitDialogue()}
                    </div>
                    :
                    <h4>Contest not found</h4>}
            </div>
        );
    }
}

export default withStyles(styles)(Contest);