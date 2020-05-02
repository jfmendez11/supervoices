import React, {Component} from 'react';

import ReactAudioPlayer from 'react-audio-player';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import StarsIcon from '@material-ui/icons/Stars';
import {TableCell, withStyles} from "@material-ui/core";

const styles = theme => ({
    card: {
        display: 'flex',
        margin: "15px 0px"
    },
    cardDetails: {
        flex: 1,
    },
    button: {
        margin: theme.spacing.unit,
    },
    leftIcon: {
        marginRight: theme.spacing.unit,
    },
    rightIcon: {
        marginLeft: theme.spacing.unit,
    },
    iconSmall: {
        fontSize: 20,
    },
    chip: {
        margin: theme.spacing.unit,
    },
});


class Entry extends Component {
    constructor(props) {
        super(props);
        this.classes = props.classes;
    }

    render() {
        return (
            <React.Fragment>

                <TableCell>
                    <Card className={this.classes.card}>
                        <Grid item md={4}>
                            <div className={this.classes.cardDetails}>
                                <CardContent>
                                    <Typography component="h2" variant="h5">
                                        {this.props.entry.NAME + " " + this.props.entry.LAST_NAME}
                                        <Chip label={this.props.entry.STATUS}
                                              color={this.props.entry.STATUS === 'Convertida' ? "primary" : "secondary"}
                                              className={this.classes.chip}/>
                                    </Typography>
                                    <Typography variant="subtitle1" color="textSecondary">
                                        {this.props.entry.DATE}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        {this.props.entry.EMAIL}
                                    </Typography>
                                    {this.props.isAdmin() && this.props.winner==null ?
                                        <Button variant="contained" value={this.props.entry.EMAIL}
                                                name={`${this.props.entry.NAME} ${this.props.entry.LAST_NAME}`}
                                                color="default"
                                                className={this.classes.button} onClick={this.props.handleWinner}>
                                            Elegir voz
                                            <StarsIcon className={this.classes.rightIcon}/>
                                        </Button>
                                        : ""}
                                </CardContent>
                            </div>
                        </Grid>
                        {this.props.isAdmin()?
                            <Grid item md={4}>
                                <Grid style={{height: "100%"}} container direction="column" alignItems="center"
                                      justify="center">
                                    <Typography component="h2" variant="h5">Voz original</Typography>
                                    <ReactAudioPlayer
                                        src={ this.props.entry.URL_ORIGINAL}
                                        controls
                                    />
                                </Grid>
                            </Grid>
                            :""}
                        {this.props.entry.STATUS === "Convertida" ?
                            <Grid item md={this.props.isAdmin()?4:8}>
                                <Grid style={{height: "100%"}} container direction="column" alignItems="center"
                                      justify="center">
                                    <Typography component="h2" variant="h5">Voz convertida</Typography>
                                    <ReactAudioPlayer
                                        src={this.props.entry.URL_CONVERTED}
                                        controls
                                    />
                                </Grid>
                            </Grid> : ""}
                    </Card>
                </TableCell>

            </React.Fragment>
        );
    }
}

export default withStyles(styles)(Entry);