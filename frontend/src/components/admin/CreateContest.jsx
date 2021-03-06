import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {DatePicker, MuiPickersUtilsProvider} from "material-ui-pickers";
import DateFnsUtils from "@date-io/date-fns";

class CreateContest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openCreate: false,
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
        };
        this.openCreate = this.openCreate.bind(this);
        this.handleCloseCreate = this.handleCloseCreate.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleStartDateChange = this.handleStartDateChange.bind(this);
        this.handleEndDateChange = this.handleEndDateChange.bind(this);
        this.handleSelectedBannerFile = this.handleSelectedBannerFile.bind(this);
        this.handleSelectedScriptFile = this.handleSelectedScriptFile.bind(this);
        this.handleSelectedRecommendationsFile = this.handleSelectedRecommendationsFile.bind(this);
        this.cleanState = this.cleanState.bind(this);
    }

    openCreate() {
        this.setState({openCreate: true});
    }

    handleCloseCreate() {
        this.setState({openCreate: false});
        this.cleanState();
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }

    handleSelectedBannerFile(event) {
        this.setState({
            selectedFileBanner: event.target.files[0],
            image_path: event.target.files[0].name,
        })
    }

    handleSelectedScriptFile(event) {
        this.setState({
            selectedFileScript: event.target.files[0],
            script_path: event.target.files[0].name,
        })
    }

    handleSelectedRecommendationsFile(event) {
        this.setState({
            selectedFileRecommendations: event.target.files[0],
            recommendations_path: event.target.files[0].name,
        })
    }

    handleStartDateChange = date => {
        this.setState({init_date: date});
    };

    handleEndDateChange = date => {
        this.setState({end_date: date});
    };

    cleanState() {
        this.setState({
            name: '',
            image_path: '',
            url: '',
            init_date: new Date('2019-08-18'),
            end_date: new Date('2019-08-19'),
            payment: 0,
            script_path: '',
            recommendations_path: '',
        });
    }

    render() {
        return (
            <Dialog
                style={{textAlign: "center"}}
                open={this.state.openCreate}
                onClose={this.handleCloseCreate}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Crear Concurso</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Llene todos los campos para crear un nuevo concurso
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        value={this.state.name}
                        label="Nombre del concurso"
                        required
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={this.handleInputChange}
                    />
                    <TextField
                        margin="dense"
                        name="url"
                        value={this.state.url}
                        label="URL"
                        required
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={this.handleInputChange}
                    />
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker
                            label="Fecha inicio"
                            margin="dense"
                            name="init_date"
                            value={this.state.init_date}
                            required
                            variant="outlined"
                            onChange={this.handleStartDateChange}
                        />
                        <DatePicker
                            label="Fecha fin"
                            margin="dense"
                            name="end_date"
                            value={this.state.end_date}
                            required
                            variant="outlined"
                            onChange={this.handleEndDateChange}
                        />
                    </MuiPickersUtilsProvider>
                    <TextField
                        margin="dense"
                        name="payment"
                        value={this.state.payment}
                        label="Pago"
                        type="number"
                        required
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={this.handleInputChange}
                    />
                    <hr/>
                    <form>
                        <label htmlFor="banner-file">
                            <Button variant="contained" component="span">
                                Subir imágen
                            </Button>
                        </label>
                        <input
                            onChange={this.handleSelectedBannerFile}
                            name="banner-input"
                            accept="image/*"
                            style={{display: 'none'}}
                            id="banner-file"
                            type="file"
                        />
                        <label htmlFor="script-file">
                            <Button variant="contained" component="span">
                                Subir guión/texto
                            </Button>
                        </label>
                        <input
                            onChange={this.handleSelectedScriptFile}
                            name="script-input"
                            accept=".pdf, .doc, .docx, .txt"
                            style={{display: 'none'}}
                            id="script-file"
                            type="file"
                        />
                        <label htmlFor="recom-file">
                            <Button variant="contained" component="span">
                                Subir recomendaciones
                            </Button>
                        </label>
                        <input
                            onChange={this.handleSelectedRecommendationsFile}
                            name="recommendations-input"
                            accept=".pdf, .doc, .docx, .txt"
                            style={{display: 'none'}}
                            id="recom-file"
                            type="file"
                        />
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleCloseCreate} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={() => {
                                let newContest = {
                                    name: this.state.name,
                                    imagePath: this.state.image_path,
                                    url: this.state.url,
                                    initDate: this.state.init_date,
                                    endDate: this.state.end_date,
                                    payment: this.state.payment,
                                    scriptPath: this.state.script_path,
                                    recommendationsPath: this.state.recommendations_path,
                                    selectedFileBanner: this.state.selectedFileBanner,
                                    selectedFileScript: this.state.selectedFileScript,
                                    selectedFileRecommendations: this.state.selectedFileRecommendations
                                };
                                return this.props.createContest(newContest);
                            }
                        } 
                        color="primary">
                        Crear
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default CreateContest;