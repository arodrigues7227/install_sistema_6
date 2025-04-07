import React, { useState, useEffect } from "react";
import { makeStyles, TextField, Grid, Typography, Paper } from "@material-ui/core";
import { Formik, Form, FastField, FieldArray } from "formik";
import { isArray } from "lodash";
import NumberFormat from "react-number-format";
import ButtonWithSpinner from "../ButtonWithSpinner";
import { i18n } from "../../translate/i18n";
import * as Yup from "yup";

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
  errorText: {
    color: theme.palette.error.main,
    fontSize: "0.75rem",
    marginTop: "3px",
    marginLeft: "14px",
  },
}));

// Esquema de validação usando Yup
const ScheduleSchema = Yup.object().shape({
  schedules: Yup.array().of(
    Yup.object().shape({
      startTimeA: Yup.string().required(i18n.t("validation.required")),
      endTimeA: Yup.string().required(i18n.t("validation.required")),
      startTimeB: Yup.string().required(i18n.t("validation.required")),
      endTimeB: Yup.string().required(i18n.t("validation.required")),
    })
  ),
});

function SchedulesForm(props) {
  const { initialValues, onSubmit, loading, labelSaveButton } = props;
  const classes = useStyles();

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
    onSubmit(data);
  };

  // Verificar se o formato da hora é válido (hh:mm)
  const isValidTimeFormat = (value) => {
    if (!value) return false;
    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.instructionAlert} elevation={0}>
        <Typography variant="subtitle1">
          <strong>{i18n.t("queueModal.serviceHours.instruction") || "Atenção:"}</strong> {i18n.t("queueModal.serviceHours.allFieldsRequired") || "Todos os campos de horário devem ser preenchidos corretamente no formato HH:MM."}
        </Typography>
      </Paper>
      
      <Formik
        enableReinitialize
        className={classes.fullWidth}
        initialValues={{ schedules }}
        validationSchema={ScheduleSchema}
        onSubmit={({ schedules }) => {
          // Verifica formato válido de todas as horas
          const allTimesValid = schedules.every(schedule => 
            isValidTimeFormat(schedule.startTimeA) && 
            isValidTimeFormat(schedule.endTimeA) && 
            isValidTimeFormat(schedule.startTimeB) && 
            isValidTimeFormat(schedule.endTimeB)
          );
          
          if (allTimesValid) {
            setTimeout(() => {
              handleSubmit(schedules);
            }, 500);
          }
        }}
      >
        {({ values, errors, touched, isValid, dirty }) => (
          <Form className={classes.fullWidth}>
            <FieldArray
              name="schedules"
              render={(arrayHelpers) => (
                <Grid spacing={4} container>
                  {values.schedules.map((item, index) => {
                    // Obtém os erros específicos para este índice
                    const scheduleErrors = errors.schedules && errors.schedules[index];
                    const scheduleTouched = touched.schedules && touched.schedules[index];
                    
                    return (
                      <Grid key={index} xs={12} md={4} item>
                        <Grid container>
                          <Grid className={classes.control} xs={12} item>
                            <FastField
                              as={TextField}
                              label={i18n.t("queueModal.serviceHours.dayWeek")}
                              name={`schedules[${index}].weekday`}
                              disabled
                              variant="outlined"
                              className={classes.fullWidth}
                              margin="dense"
                            />
                          </Grid>
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
                                    label={i18n.t("queueModal.serviceHours.startTimeA")}
                                    error={meta.touched && Boolean(meta.error)}
                                    helperText={meta.touched && meta.error ? meta.error : ""}
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
                                    label={i18n.t("queueModal.serviceHours.endTimeA")}
                                    error={meta.touched && Boolean(meta.error)}
                                    helperText={meta.touched && meta.error ? meta.error : ""}
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
                                    className={classes.fullWidth}
                                    label={i18n.t("queueModal.serviceHours.startTimeB")}
                                    error={meta.touched && Boolean(meta.error)}
                                    helperText={meta.touched && meta.error ? meta.error : ""}
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
                                    className={classes.fullWidth}
                                    label={i18n.t("queueModal.serviceHours.endTimeB")}
                                    error={meta.touched && Boolean(meta.error)}
                                    helperText={meta.touched && meta.error ? meta.error : ""}
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
                loading={loading}
                type="submit"
                color="primary"
                variant="contained"
                disabled={!isValid || !dirty}
              >
                {labelSaveButton ?? i18n.t("whatsappModal.buttons.okEdit")}
              </ButtonWithSpinner>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default SchedulesForm;