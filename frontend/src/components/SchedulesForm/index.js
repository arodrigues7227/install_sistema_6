import React, { useState, useEffect } from "react";
import { makeStyles, TextField, Grid, Typography, Paper, Snackbar, Button, Box } from "@material-ui/core";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import MuiAlert from "@material-ui/lab/Alert";
import { Formik, Form, FastField, FieldArray } from "formik";
import { isArray } from "lodash";
import NumberFormat from "react-number-format";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { i18n } from "../../translate/i18n";
import * as Yup from "yup";

const Alert = (props) => {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  textfield: {
    width: "100%",
    fontSize: "0.875em"
  },
  row: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  control: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1),
  },
  instructionAlert: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
    borderRadius: theme.shape.borderRadius,
  },
  copyButton: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1),
  },
  weekdayTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  optionalField: {
    '& label': {
      '&::after': {
        content: '" (opcional)"',
        fontStyle: 'italic',
        fontWeight: 'normal',
      },
    },
  },
}));

// Esquema de validação customizado usando Yup
const ScheduleSchema = Yup.object().shape({
  schedules: Yup.array().of(
    Yup.object().test('conditional-validation', null, function(schedule) {
      const { weekdayEn, startTimeA, endTimeA, startTimeB, endTimeB } = schedule;
      const isWeekend = weekdayEn === "saturday" || weekdayEn === "sunday";
      
      // Cria um objeto de erros
      const errors = {};
      
      // Regex para validar formato de hora
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      
      // Validação para turno A (sempre obrigatório)
      if (!startTimeA) {
        errors.startTimeA = "Obrigatório";
      } else if (!timeRegex.test(startTimeA)) {
        errors.startTimeA = "Formato inválido";
      }
      
      if (!endTimeA) {
        errors.endTimeA ="Obrigatório";
      } else if (!timeRegex.test(endTimeA)) {
        errors.endTimeA = "Formato inválido";
      }
      
      // Validação para turno B (obrigatório apenas em dias úteis)
      if (!isWeekend) {
        if (!startTimeB) {
          errors.startTimeB ="Obrigatório";
        } else if (!timeRegex.test(startTimeB)) {
          errors.startTimeB = "Formato inválido";
        }
        
        if (!endTimeB) {
          errors.endTimeB ="Obrigatório";
        } else if (!timeRegex.test(endTimeB)) {
          errors.endTimeB = "Formato inválido";
        }
      } else {
        // Para finais de semana, apenas validar o formato se o campo for preenchido
        if (startTimeB && !timeRegex.test(startTimeB)) {
          errors.startTimeB = "Formato inválido";
        }
        
        if (endTimeB && !timeRegex.test(endTimeB)) {
          errors.endTimeB = "Formato inválido";
        }
      }
      
      // Se houver erros, retorne o objeto de erros
      if (Object.keys(errors).length > 0) {
        return this.createError({ path: this.path, message: JSON.stringify(errors) });
      }
      
      return true;
    }),
  ),
});

function SchedulesForm(props) {
  const { initialValues, onSubmit, loading, labelSaveButton } = props;
  const classes = useStyles();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [schedules, setSchedules] = useState([
    { weekday: i18n.t("queueModal.serviceHours.monday"), weekdayEn: "monday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.tuesday"), weekdayEn: "tuesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.wednesday"), weekdayEn: "wednesday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.thursday"), weekdayEn: "thursday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.friday"), weekdayEn: "friday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.saturday"), weekdayEn: "saturday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
    { weekday: i18n.t("queueModal.serviceHours.sunday"), weekdayEn: "sunday", startTimeA: "", endTimeA: "", startTimeB: "", endTimeB: "", },
  ]);

  useEffect(() => {
    if (isArray(initialValues) && initialValues.length > 0) {
      setSchedules(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleSubmit = (data) => {
    try {
      onSubmit(data);
      setSnackbarMessage("Horários salvos com sucesso!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao salvar horários:", error);
      setSnackbarMessage("Erro ao salvar horários. Tente novamente.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Verifica se é fim de semana (sábado ou domingo)
  const isWeekend = (weekdayEn) => {
    return weekdayEn === "saturday" || weekdayEn === "sunday";
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.instructionAlert} elevation={0}>
        <Typography variant="subtitle1">
          <strong>Atenção:</strong> Preencha todos os horários no formato HH:MM. Turno B é opcional para sábados e domingos.
        </Typography>
      </Paper>
      
      <Formik
        enableReinitialize
        className={classes.fullWidth}
        initialValues={{ schedules }}
        validationSchema={ScheduleSchema}
        onSubmit={({ schedules }, { setSubmitting }) => {
          handleSubmit(schedules);
          setSubmitting(false);
        }}
      >
        {({ values, errors, touched, isValid, dirty, isSubmitting, setFieldValue, setFieldTouched }) => {
          // Função para copiar horários da segunda-feira para os dias úteis
          const copyMondayToWeekdays = () => {
            // Pega os horários da segunda-feira (índice 0)
            const mondaySchedule = values.schedules[0];
            
            // Aplica os mesmos horários para terça a sexta (índices 1 a 4)
            for (let i = 1; i <= 4; i++) {
              setFieldValue(`schedules[${i}].startTimeA`, mondaySchedule.startTimeA);
              setFieldValue(`schedules[${i}].endTimeA`, mondaySchedule.endTimeA);
              setFieldValue(`schedules[${i}].startTimeB`, mondaySchedule.startTimeB);
              setFieldValue(`schedules[${i}].endTimeB`, mondaySchedule.endTimeB);
              
              // Marca os campos como "touched" para validação
              setFieldTouched(`schedules[${i}].startTimeA`, true, false);
              setFieldTouched(`schedules[${i}].endTimeA`, true, false);
              setFieldTouched(`schedules[${i}].startTimeB`, true, false);
              setFieldTouched(`schedules[${i}].endTimeB`, true, false);
            }
          };
          
          // Verifica se segunda-feira está completamente preenchida
          const isMondayComplete = () => {
            const monday = values.schedules[0];
            return monday.startTimeA && monday.endTimeA && monday.startTimeB && monday.endTimeB;
          };
          
          return (
            <Form className={classes.fullWidth}>
              {/* Botão para copiar segunda para dias úteis */}
              <Box display="flex" justifyContent="flex-start" className={classes.copyButton}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<FileCopyIcon />}
                  onClick={copyMondayToWeekdays}
                  disabled={!isMondayComplete()}
                  size="small"
                >
                  {i18n.t("queueModal.serviceHours.copyToWeekdays") || "Aplicar horário de segunda para dias úteis"}
                </Button>
              </Box>
              
              <FieldArray
                name="schedules"
                render={(arrayHelpers) => (
                  <Grid spacing={4} container>
                    {values.schedules.map((item, index) => {
                      const { weekdayEn } = item;
                      const weekend = isWeekend(weekdayEn);
                      
                      // Extrai erros para este índice específico
                      let fieldErrors = {};
                      if (errors.schedules && errors.schedules[index]) {
                        try {
                          fieldErrors = JSON.parse(errors.schedules[index]);
                        } catch (e) {
                          fieldErrors = {};
                        }
                      }
                      
                      return (
                        <Grid key={index} xs={12} md={4} item>
                          <Typography variant="subtitle1" className={classes.weekdayTitle}>
                            {item.weekday}
                          </Typography>
                          <Grid container>
                            <Grid className={classes.control} xs={12} md={6} item>
                              <FastField
                                label={i18n.t("queueModal.serviceHours.startTimeA")}
                                name={`schedules[${index}].startTimeA`}
                              >
                                {({ field, meta }) => (
                                  <div>
                                    <NumberFormat
                                      {...field}
                                      variant="outlined"
                                      margin="dense"
                                      customInput={TextField}
                                      format="##:##"
                                      placeholder="00:00"
                                      className={classes.fullWidth}
                                      label={i18n.t("queueModal.serviceHours.startTimeA") || "Início manhã"}
                                      error={Boolean(fieldErrors.startTimeA)}
                                      helperText={fieldErrors.startTimeA || ""}
                                      onValueChange={(values) => {
                                        const { formattedValue } = values;
                                        setFieldValue(`schedules[${index}].startTimeA`, formattedValue);
                                        setFieldTouched(`schedules[${index}].startTimeA`, true, false);
                                      }}
                                    />
                                  </div>
                                )}
                              </FastField>
                            </Grid>
                            <Grid className={classes.control} xs={12} md={6} item>
                              <FastField
                                label={i18n.t("queueModal.serviceHours.endTimeA")}
                                name={`schedules[${index}].endTimeA`}
                              >
                                {({ field, meta }) => (
                                  <div>
                                    <NumberFormat
                                      {...field}
                                      variant="outlined"
                                      margin="dense"
                                      customInput={TextField}
                                      format="##:##"
                                      placeholder="00:00"
                                      className={classes.fullWidth}
                                      label={i18n.t("queueModal.serviceHours.endTimeA") || "Fim manhã"}
                                      error={Boolean(fieldErrors.endTimeA)}
                                      helperText={fieldErrors.endTimeA || ""}
                                      onValueChange={(values) => {
                                        const { formattedValue } = values;
                                        setFieldValue(`schedules[${index}].endTimeA`, formattedValue);
                                        setFieldTouched(`schedules[${index}].endTimeA`, true, false);
                                      }}
                                    />
                                  </div>
                                )}
                              </FastField>
                            </Grid>
                            <Grid className={classes.control} xs={12} md={6} item>
                              <FastField
                                label={i18n.t("queueModal.serviceHours.startTimeB")}
                                name={`schedules[${index}].startTimeB`}
                              >
                                {({ field, meta }) => (
                                  <div>
                                    <NumberFormat
                                      {...field}
                                      variant="outlined"
                                      margin="dense"
                                      customInput={TextField}
                                      format="##:##"
                                      placeholder="00:00"
                                      className={`${classes.fullWidth} ${weekend ? classes.optionalField : ''}`}
                                      label={i18n.t("queueModal.serviceHours.startTimeB") || "Início tarde"}
                                      error={Boolean(fieldErrors.startTimeB)}
                                      helperText={fieldErrors.startTimeB || ""}
                                      onValueChange={(values) => {
                                        const { formattedValue } = values;
                                        setFieldValue(`schedules[${index}].startTimeB`, formattedValue);
                                        setFieldTouched(`schedules[${index}].startTimeB`, true, false);
                                      }}
                                    />
                                  </div>
                                )}
                              </FastField>
                            </Grid>
                            <Grid className={classes.control} xs={12} md={6} item>
                              <FastField
                                label={i18n.t("queueModal.serviceHours.endTimeB")}
                                name={`schedules[${index}].endTimeB`}
                              >
                                {({ field, meta }) => (
                                  <div>
                                    <NumberFormat
                                      {...field}
                                      variant="outlined"
                                      margin="dense"
                                      customInput={TextField}
                                      format="##:##"
                                      placeholder="00:00"
                                      className={`${classes.fullWidth} ${weekend ? classes.optionalField : ''}`}
                                      label={i18n.t("queueModal.serviceHours.endTimeB") || "Fim tarde"}
                                      error={Boolean(fieldErrors.endTimeB)}
                                      helperText={fieldErrors.endTimeB || ""}
                                      onValueChange={(values) => {
                                        const { formattedValue } = values;
                                        setFieldValue(`schedules[${index}].endTimeB`, formattedValue);
                                        setFieldTouched(`schedules[${index}].endTimeB`, true, false);
                                      }}
                                    />
                                  </div>
                                )}
                              </FastField>
                            </Grid>
                          </Grid>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              />
              <div className={classes.buttonContainer}>
                <ButtonWithSpinner
                  loading={loading || isSubmitting}
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={!isValid || !dirty}
                >
                  {labelSaveButton ?? i18n.t("whatsappModal.buttons.okEdit")}
                </ButtonWithSpinner>
              </div>
            </Form>
          );
        }}
      </Formik>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default SchedulesForm;