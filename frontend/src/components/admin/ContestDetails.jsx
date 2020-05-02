import React, {Component} from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import EditContest from './EditContest';
import axios from 'axios';
import Cookies from 'universal-cookie';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';

class ContestDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openDetails: false,
            selectedContest: {},
        }
        this.editRef = React.createRef();
        this.handleClickDetails = this.handleClickDetails.bind(this);
        this.handleCloseDetails = this.handleCloseDetails.bind(this);
        this.editContest = this.editContest.bind(this);
        this.handleClickEdit = this.handleClickEdit.bind(this);
    }

    handleClickDetails(c) {
        this.setState({openDetails: true, selectedContest: c});

    }

    handleCloseDetails() {
        this.setState({openDetails: false});
    }

    handleClickEdit() {
        this.handleCloseDetails();
        this.editRef.current.handleClickEdit();
    }

    editContest(contest) {
        let cookies = new Cookies();
        let token = cookies.get("SUPERVOICES_TOKEN_COOKIE");
        let config = {
            headers: {'Authorization': 'Bearer ' + token}
        };

        contest.id = this.state.selectedContest._id;
        if (contest.name === '') contest.name = this.state.selectedContest.NAME;
        if (contest.url === '') contest.url = this.state.selectedContest.URL;
        if (contest.initDate === new Date('2019-08-18')) contest.initDate = this.state.selectedContest.INIT_DATE;
        if (contest.endDate === new Date('2019-09-20')) contest.endDate = this.state.selectedContest.END_DATE;
        if (contest.payment === 0) contest.payment = this.state.selectedContest.PAYMENT;
        if (contest.imagePath === '') contest.imagePath = this.state.selectedContest.IMAGE_PATH;
        if (contest.scriptPath === '') contest.scriptPath = this.state.selectedContest.SCRIPT_PATH;
        if (contest.recommendationsPath === '') contest.recommendationsPath = this.state.selectedContest.RECOMMENDATIONS_PATH;

        this.editRef.current.handleCloseEdit();
        axios.put('/API/contest', contest, config)
            .then((res) => {
                console.log(res);
                return res.data;
            })
            .then((data) => {
                console.log(data);
                if (contest.selectedFileBanner !== null) {
                    const bannerData = new FormData();
                    bannerData.append('file', contest.selectedFileBanner, contest.selectedFileBanner.name);
                    axios.post('/API/banner/' + data.contestId, bannerData, {
                        onUploadProgress: ProgressEvent => {
                            this.setState({
                                loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                            });
                        },
                        headers: {'Authorization': 'Bearer ' + token}
                    })
                        .catch((err) => {
                            console.log(err);
                        });
                }
                if (contest.selectedFileScript !== null) {
                    const scriptData = new FormData();
                    scriptData.append('file', contest.selectedFileScript, contest.selectedFileScript.name);
                    axios.post('/API/script/' + data.contestId, scriptData, {
                        onUploadProgress: ProgressEvent => {
                            this.setState({
                                loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                            });
                        },
                        headers: {'Authorization': 'Bearer ' + token}
                    })
                        .catch((err) => {
                            console.log(err);
                        });
                }
                if (contest.selectedFileRecommendations !== null) {
                    const recommendationsData = new FormData();
                    recommendationsData.append('file', contest.selectedFileRecommendations, contest.selectedFileRecommendations.name);
                    axios.post('/API/recommendation/' + data.contestId, recommendationsData, {
                        onUploadProgress: ProgressEvent => {
                            this.setState({
                                loaded: (ProgressEvent.loaded / ProgressEvent.total * 100),
                            });
                        },
                        headers: {'Authorization': 'Bearer ' + token}
                    })
                        .catch((err) => {
                            console.log(err);
                        });
                }
                this.props.renderContests();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    render() {
        return (
            <div>
                <EditContest editContest={this.editContest} ref={this.editRef}/>
                <Dialog
                    open={this.state.openDetails}
                    onClose={this.handleCloseDetails}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle style={{textAlign: "center"}} id="form-dialog-title">Detalles</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Detalles del concurso {this.state.selectedContest.NAME}
                        </DialogContentText>
                        <List>
                            <ListItem>
                                <ListItemText primary="Nombre" secondary={this.state.selectedContest.NAME}/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <ListItemText primary="URL" secondary={this.state.selectedContest.URL}/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <ListItemText primary="Fecha De Inicio"
                                              secondary={this.state.selectedContest.INIT_DATE}/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <ListItemText primary="Fecha De Finalización"
                                              secondary={this.state.selectedContest.END_DATE}/>
                            </ListItem>
                            <Divider/>
                            <ListItem>
                                <ListItemText primary="Pago" secondary={this.state.selectedContest.PAYMENT}/>
                            </ListItem>
                            <ListItem button component="a"
                                      href={process.env.REACT_APP_RECORDINGS_SERVER + this.state.selectedContest.IMAGE_PATH}
                                      target="_blank">
                                <ListItemText primary="Imagen subida"
                                              secondary={this.state.selectedContest.IMAGE_PATH}/>
                            </ListItem>
                            <Divider/>
                            <ListItem button component="a"
                                      href={process.env.REACT_APP_RECORDINGS_SERVER + this.state.selectedContest.SCRIPT_PATH}
                                      target="_blank">
                                <ListItemText primary="Guión/Texto subido"
                                              secondary={this.state.selectedContest.SCRIPT_PATH}/>
                            </ListItem>
                            <Divider/>
                            <ListItem button component="a"
                                      href={process.env.REACT_APP_RECORDINGS_SERVER + this.state.selectedContest.RECOMMENDATIONS_PATH}
                                      target="_blank">
                                <ListItemText primary="Recomendaciones subidas"
                                              secondary={this.state.selectedContest.RECOMMENDATIONS_PATH}/>
                            </ListItem>
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDetails} color="primary">
                            Cancelar
                        </Button>
                        <Button onClick={this.handleClickEdit} color="primary">
                            Modificar
                        </Button>
                        <Button onClick={() => this.props.deleteContest(this.state.selectedContest)} color="primary">
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default ContestDetails;