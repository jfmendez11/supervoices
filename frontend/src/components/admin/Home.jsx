import React, {Component} from 'react';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import TablePagination from '@material-ui/core/TablePagination';
import IconButton from '@material-ui/core/IconButton';
import LastPageIcon from '@material-ui/icons/LastPage';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import TableFooter from '@material-ui/core/TableFooter';
import Snackbar from '@material-ui/core/Snackbar';
import ErrorIcon from '@material-ui/icons/Error';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import CloseIcon from '@material-ui/icons/Close';
import classNames from 'classnames';
import axios from 'axios';
import Cookies from 'universal-cookie';
import {withStyles} from "@material-ui/core";
import {Link} from "react-router-dom";
import CreateContest from './CreateContest';
import ContestDetails from './ContestDetails';

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
    createButton: {
        margin: 'auto'
    },
    root: {
        width: '100%',
        overflowX: 'auto',
    },
    table: {
        minWidth: 700,
    },
    heroUnit: {
        backgroundColor: theme.palette.background.paper,
    },
    heroContent: {
        maxWidth: 600,
        margin: '0 auto',
        padding: `${theme.spacing.unit * 8}px 0 ${theme.spacing.unit * 6}px`,
    }
});

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

const variantIcon = {
    error: ErrorIcon,
};

const styles1 = theme => ({
    error: {
        backgroundColor: theme.palette.error.dark,
    },
});

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

const MySnackbarContentWrapper = withStyles(styles1)(MySnackbarContent);

class Home extends Component {
    constructor(props) {
        super(props);
        this.classes = props.classes;
        this.state = {
            logged: false,
            openCreate: false,
            openDetails: false,
            openEdit: false,
            selectedContest: {},
            name: '',
            image_path: '',
            url: '',
            init_date: new Date('2019-08-18'),
            end_date: new Date('2019-09-20'),
            payment: 0,
            script_path: '',
            recommendations_path: '',
            selectedFileBanner: null,
            selectedFileScript: null,
            selectedFileRecommendations: null,
            page: 0,
            rowsPerPage: 50,
            openSnack: false,
            messageErr: '',
        };
        this.classes = props.classes;
        this.renderHome = this.renderHome.bind(this);
        this.renderContests = this.renderContests.bind(this);
        this.handleClickCreateContest = this.handleClickCreateContest.bind(this);
        this.createContest = this.createContest.bind(this);
        this.handleClickDetails = this.handleClickDetails.bind(this);
        this.deleteContest = this.deleteContest.bind(this);
        this.handleCloseSnack = this.handleCloseSnack.bind(this);
        this.createReference = React.createRef();
        this.detailsRef = React.createRef();
    }

    //Renderiza el home cuando no se ha registrado
    renderHome() {
        return (
            <div className={this.classes.layout}>
                <div className={this.classes.heroUnit}>
                    <div className={this.classes.heroContent}>
                        <Typography component="h1" variant="h2" align="center" color="textPrimary" gutterBottom>
                            Super Voices
                        </Typography>
                        <Typography variant="h5" align="center" color="textSecondary" paragraph>
                            Con SuperVoice podrás escoger al mejor locutor para tus proyectos. No tendrás que
                            preocuparte por el almacenamiento o procesamiento de los audios, podrás concentrarte en
                            encontrar la mejor voz!
                        </Typography>
                        <Typography variant="h6" align="center" color="textSecondary" paragraph>
                            Inicia sesión o crea una cuenta para empezar
                        </Typography>
                        <div className={this.classes.heroButtons}>
                            <Grid container spacing={16} justify="center">
                                <Grid item>
                                    <Link to={"/login"} style={{textDecoration: 'none', color: 'inherit'}}>
                                        <Button variant="contained" color="primary">
                                            Empezar ahora!
                                        </Button>
                                    </Link>

                                </Grid>
                                {/**
                                 <Grid item>
                                 <Button variant="outlined" color="primary">
                                 Sobre nosotros
                                 </Button>
                                 </Grid>
                                 **/}
                            </Grid>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleChangePage = (event, page) => {
        this.setState({page});
    };

    //Luego de loggearse
    renderContests() {
        const {rowsPerPage, page} = this.state;
        const rows = this.props.contests;
        return (
            <div className={this.classes.layout}>
                <Grid container spacing={0} direction="column" alignItems="center" justify="center">
                    <Button onClick={this.handleClickCreateContest} color='primary' variant="contained">
                        Crear concurso
                    </Button>
                </Grid>
                <hr style={{borderColor: "transparent"}}/>
                <Paper className={this.classes.root}>
                    <Table className={this.classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>URL del concurso</TableCell>
                                <TableCell align="center">Nombre</TableCell>
                                <TableCell align="center">Detalles</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.props.contests.length > 0 ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((c, i) => (
                                <TableRow key={i}>
                                    <TableCell component="th" scope="row"><Link to={`/contests/${c.URL}`}>
                                        {c.URL}
                                    </Link></TableCell>
                                    <TableCell align="center">{c.NAME}</TableCell>
                                    <TableCell align="center"><Button onClick={() => this.handleClickDetails(c)}
                                                                      color='primary' variant="contained">Ver
                                        Detalles</Button></TableCell>
                                </TableRow>
                            )) : <TableRow>
                                <TableCell colSpan={3} component="th" scope="row">No se ha creado ningun concurso
                                    todavía.</TableCell>
                            </TableRow>}
                        </TableBody>
                        <TableFooter>
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
                        </TableFooter>
                    </Table>
                </Paper>

            </div>
        );
    }

    //Crear concursos --------------------------------
    handleClickCreateContest() {
        this.createReference.current.openCreate();
    }

    createContest(contest) {
        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE");
        let config = {
            headers: {'Authorization': 'Bearer ' + token}
        };
        axios.post('/API/contest', contest, config)
            .then((res) => {
                return res.data;
            })
            .then((data) => {
                // POST action for the banner
                console.log('post del banner');
                if (data.messageErr) {
                    this.setState({messageErr: data.messageErr});
                    this.setState({openSnack: true});
                    return;
                }

                this.createReference.current.handleCloseCreate();

                const bannerData = new FormData();
                bannerData.append('file', contest.selectedFileBanner, contest.selectedFileBanner.name);
                console.log('antes de axios.post');
                axios.post( '/API/banner/' + data._id, bannerData, {
                    onUploadProgress: ProgressEvent => {
                        this.setState({
                            loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                        });
                    },
                    headers: {'Authorization': 'Bearer ' + token}
                }).then((res) => {
                    console.log('then despues de post banner', res.data)
                    return res.data;
                }).then((resBanner) => {

                    // POST action for the script
                    console.log('script post');
                    const scriptData = new FormData();
                    scriptData.append('file', contest.selectedFileScript, contest.selectedFileScript.name);
                    axios.post('/API/script/' + data._id, scriptData, {
                        onUploadProgress: ProgressEvent => {
                            this.setState({
                                loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                            });
                        },
                        headers: {'Authorization': 'Bearer ' + token}
                    }).then((res) => {
                        console.log('then despues de post script', res.data);
                        return res.data;
                    }).then((resScript) => {

                        // POST action for the recommendations
                        console.log('script recom');
                        const recommendationsData = new FormData();
                        recommendationsData.append('file', contest.selectedFileRecommendations, contest.selectedFileRecommendations.name);
                        axios.post('/API/recommendation/' + data._id, recommendationsData, {
                            onUploadProgress: ProgressEvent => {
                                this.setState({
                                    loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                                });
                            },
                            headers: {'Authorization': 'Bearer ' + token}
                        }).then((res) => {
                            console.log('then despues de post recom', res.data);
                            this.props.renderContests();
                            return res.data;
                        }).catch((err) => {
                            console.log('catch 1');
                            console.log(err);
                        });
                    }).catch((err) => {
                        console.log('catch 2');
                        console.log(err);
                    });
                }).catch((err) => {
                    console.log('catch 3');
                    console.log(err);
                });
            })
            .catch((err) => {
                console.log('catch 4');
                console.log(err);
            });
    }
    //Crear concursos --------------------------------

    //Detalles        --------------------------------
    handleClickDetails(c) {
        this.detailsRef.current.handleClickDetails(c);
    }
    //Detalles        --------------------------------

    //Eliminar        --------------------------------
    deleteContest(contest) {
        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE");
        let config = {
            headers: {'Authorization': 'Bearer ' + token}
        };
        this.detailsRef.current.handleCloseDetails();
        axios.delete('/API/contest/' + contest._id, config)
            .then((res) => {
                this.props.renderContests();
                return res.data;
            })
            .catch((err) => {
                console.log(err);
            });

    }
    //Eliminar        --------------------------------

    //Extra           --------------------------------
    renderSnackbar() {
        let vertical = 'top';
        let horizontal = 'center';
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
                    variant="error"
                    message={<p className={this.classes.notification} id="message-id">{this.state.messageErr}</p>}
                />
            </Snackbar>

        );
    }

    handleCloseSnack = () => {
        this.setState({openSnack: false});
    };
    //Extra           --------------------------------

    render() {
        return (
            <div>
                {this.props.auth ? this.renderContests() : this.renderHome()}
                {this.renderSnackbar()}
                <CreateContest createContest={this.createContest} ref={this.createReference}/>
                <ContestDetails ref={this.detailsRef} deleteContest={this.deleteContest} renderContests={this.props.renderContests}/>
            </div>
        );
    }
}

export default withStyles(styles)(Home);