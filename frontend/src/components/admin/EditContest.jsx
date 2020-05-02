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

class EditContest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openEdit: false,
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
        this.handleCloseEdit = this.handleCloseEdit.bind(this);
        this.handleClickEdit = this.handleClickEdit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleStartDateChange = this.handleStartDateChange.bind(this);
        this.handleEndDateChange = this.handleEndDateChange.bind(this);
        this.handleSelectedBannerFile = this.handleSelectedBannerFile.bind(this);
        this.handleSelectedScriptFile = this.handleSelectedScriptFile.bind(this);
        this.handleSelectedRecommendationsFile = this.handleSelectedRecommendationsFile.bind(this);
        this.cleanState = this.cleanState.bind(this);
    }

    handleClickEdit() {
        this.setState({openEdit: true});
    }

    handleCloseEdit() {
        this.setState({openEdit: false});
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
                open={this.state.openEdit}
                onClose={this.handleCloseEdit}
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Modificar Concurso</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Llene los campos que desea modificar
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        value={this.state.name}
                        label="Nombre del concurso"
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
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={this.handleInputChange}
                    />
                    <form>
                        <label htmlFor="banner-file">
                            <Button variant="contained" component="span">
                                Cambiar imagen
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
                                Cambiar guión/texto
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
                                Cambiar recomendaciones
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
                    <Button onClick={this.handleCloseEdit} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={() => {
                            let contest = {
                                //user_id: this.props.user._id,
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
                            console.log(contest);
                            return this.props.editContest(contest);
                        }} 
                        color="primary">
                        Modificar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default EditContest;