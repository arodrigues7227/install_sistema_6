import React, { useEffect, useState, useContext, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import useSettings from "../../hooks/useSettings";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";

import { IconButton, InputAdornment } from "@material-ui/core";

import { Colorize, AttachFile, Delete } from "@material-ui/icons";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import { getBackendUrl } from "../../config";

import defaultLogoLight from "../../assets/logo.png";
import defaultLogoDark from "../../assets/logo-black.png";
import defaultLogoFavicon from "../../assets/favicon.ico";
import ColorBoxModal from "../ColorBoxModal/index.js";
import Checkbox from "@material-ui/core/Checkbox";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e",
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center",
    },
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },

  uploadInput: {
    display: "none",
  },

  appLogoLightPreviewDiv: {
    backgroundColor: "white",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#424242",
    textAlign: "center",
  },

  appLogoDarkPreviewDiv: {
    backgroundColor: "#424242",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "white",
    textAlign: "center",
  },

  appLogoFaviconPreviewDiv: {
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "black",
    textAlign: "center",
  },

  appLogoLightPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + theme.calculatedLogoLight() + ")",
  },

  appLogoDarkPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + theme.calculatedLogoDark() + ")",
  },

  appLogoFaviconPreviewImg: {
    width: "100%",
    maxHeight: 72,
    content: "url(" + (theme.appLogoFavicon ? theme.appLogoFavicon : "") + ")",
  },

  appLogoBackgroundLightPreviewDiv: {
    backgroundColor: "white",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#424242",
    textAlign: "center",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  appLogoBackgroundDarkPreviewDiv: {
    backgroundColor: "#424242",
    padding: "10px",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "white",
    textAlign: "center",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  appLogoBackgroundLightPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "4px",
  },

  appLogoBackgroundDarkPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "4px",
  },
}));

const LANGUAGE_OPTIONS = [
  { code: "pt-BR", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ar", label: "عربي" },
];

export default function Whitelabel(props) {
  const { settings } = props;
  const classes = useStyles();
  const [settingsLoaded, setSettingsLoaded] = useState({});

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const { colorMode } = useContext(ColorModeContext);
  const [primaryColorLightModalOpen, setPrimaryColorLightModalOpen] =
    useState(false);
  const [primaryColorDarkModalOpen, setPrimaryColorDarkModalOpen] =
    useState(false);

  const logoLightInput = useRef(null);
  const logoDarkInput = useRef(null);
  const logoFaviconInput = useRef(null);
  const backgroundLightInput = useRef(null);
  const backgroundDarkInput = useRef(null);
  const appNameInput = useRef(null);
  const [appName, setAppName] = useState(settingsLoaded.appName || "");
  const [enabledLanguages, setEnabledLanguages] = useState(["pt-BR", "en"]);

  const { update } = useSettings();

  function updateSettingsLoaded(key, value) {
    if (
      key === "primaryColorLight" ||
      key === "primaryColorDark" ||
      key === "appName"
    ) {
      localStorage.setItem(key, value);
    }
    const newSettings = { ...settingsLoaded };
    newSettings[key] = value;
    setSettingsLoaded(newSettings);
  }

  useEffect(() => {
    let isMounted = true;

    getCurrentUserInfo().then((u) => {
      // Verificar se o usuário está aninhado em um objeto
      const userData = u.user || u;
      if (isMounted) {
        setCurrentUser(userData);
      }
    });

    if (Array.isArray(settings) && settings.length) {
      const primaryColorLight = settings.find(
        (s) => s.key === "primaryColorLight"
      )?.value;
      const primaryColorDark = settings.find(
        (s) => s.key === "primaryColorDark"
      )?.value;
      const appLogoLight = settings.find(
        (s) => s.key === "appLogoLight"
      )?.value;
      const appLogoDark = settings.find((s) => s.key === "appLogoDark")?.value;
      const appLogoFavicon = settings.find(
        (s) => s.key === "appLogoFavicon"
      )?.value;
      const appLogoBackgroundLight = settings.find(
        (s) => s.key === "appLogoBackgroundLight"
      )?.value;
      const appLogoBackgroundDark = settings.find(
        (s) => s.key === "appLogoBackgroundDark"
      )?.value;
      const appName = settings.find((s) => s.key === "appName")?.value;
      const enabledLanguagesSetting = settings.find(
        (s) => s.key === "enabledLanguages"
      )?.value;
      let langs = ["pt-BR", "en"];
      try {
        if (enabledLanguagesSetting) {
          langs = JSON.parse(enabledLanguagesSetting);
        }
      } catch {}

      if (isMounted) {
        setAppName(appName || "");
        setEnabledLanguages(langs);
        setSettingsLoaded({
          ...settingsLoaded,
          primaryColorLight,
          primaryColorDark,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appLogoBackgroundLight,
          appLogoBackgroundDark,
          appName,
          enabledLanguages: langs,
        });
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleSaveSetting(key, value) {
    await update({
      key,
      value,
    });
    updateSettingsLoaded(key, value);
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleSaveEnabledLanguages(newLangs) {
    await handleSaveSetting("enabledLanguages", newLangs);
    setEnabledLanguages(newLangs);
  }

  const uploadLogo = async (e, mode) => {
    if (!e.target.files) {
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("typeArch", "logo");
    formData.append("mode", mode);
    formData.append("file", file);

    await api
      .post("/settings-whitelabel/logo", formData, {
        onUploadProgress: (event) => {
          let progress = Math.round((event.loaded * 100) / event.total);
          console.log(`A imagem  está ${progress}% carregada... `);
        },
      })
      .then((response) => {
        updateSettingsLoaded(`appLogo${mode}`, response.data);
        if (mode === "BackgroundLight" || mode === "BackgroundDark") {
          // Para imagens de fundo, não precisamos atualizar o contexto de cores
          // pois elas são carregadas diretamente na tela de login
        } else {
          colorMode[`setAppLogo${mode}`](
            getBackendUrl() + "/public/" + response.data
          );
        }
      })
      .catch((err) => {
        console.error(`Houve um problema ao realizar o upload da imagem.`);
        console.log(err);
      });
  };

  return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
                    <Title>Configurações Gerais</Title>
                </Grid> */}
        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="primary-color-light-field"
                    label={i18n.t("whitelabel.primaryColorLight")}
                    variant="standard"
                    value={settingsLoaded.primaryColorLight || ""}
                    onClick={() => setPrimaryColorLightModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{
                              backgroundColor: settingsLoaded.primaryColorLight,
                            }}
                            className={classes.colorAdorment}
                          ></div>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setPrimaryColorLightModalOpen(true)}
                        >
                          <Colorize />
                        </IconButton>
                      ),
                    }}
                  />
                </FormControl>
                <ColorBoxModal
                  open={primaryColorLightModalOpen}
                  handleClose={() => setPrimaryColorLightModalOpen(false)}
                  onChange={(color) => {
                    console.log("🔍 [Whitelabel] Color changed:", color);
                    handleSaveSetting("primaryColorLight", `#${color.hex}`);
                    colorMode.setPrimaryColorLight(`#${color.hex}`);
                  }}
                  currentColor={settingsLoaded.primaryColorLight}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="primary-color-dark-field"
                    label={i18n.t("whitelabel.primaryColorDark")}
                    variant="standard"
                    value={settingsLoaded.primaryColorDark || ""}
                    onClick={() => setPrimaryColorDarkModalOpen(true)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <div
                            style={{
                              backgroundColor: settingsLoaded.primaryColorDark,
                            }}
                            className={classes.colorAdorment}
                          ></div>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setPrimaryColorDarkModalOpen(true)}
                        >
                          <Colorize />
                        </IconButton>
                      ),
                    }}
                  />
                </FormControl>
                <ColorBoxModal
                  open={primaryColorDarkModalOpen}
                  handleClose={() => setPrimaryColorDarkModalOpen(false)}
                  onChange={(color) => {
                    handleSaveSetting("primaryColorDark", `#${color.hex}`);
                    colorMode.setPrimaryColorDark(`#${color.hex}`);
                  }}
                  currentColor={settingsLoaded.primaryColorDark}
                />
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="appname-field"
                    label={i18n.t("whitelabel.appName")}
                    variant="standard"
                    name="appName"
                    value={appName}
                    inputRef={appNameInput}
                    onChange={(e) => {
                      setAppName(e.target.value);
                    }}
                    onBlur={async (_) => {
                      await handleSaveSetting("appName", appName);
                      colorMode.setAppName(appName || "Multi100");
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-light-upload-field"
                    label={i18n.t("whitelabel.logoLight")}
                    variant="standard"
                    value={settingsLoaded.appLogoLight || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoLight && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoLight", "");
                                colorMode.setAppLogoLight(defaultLogoLight);
                              }}
                            >
                              <Delete
                                titleAccess={i18n.t("whitelabel.delete")}
                              />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-light-button"
                            ref={logoLightInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e, "Light")}
                          />
                          <label htmlFor="upload-logo-light-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoLightInput.current.click();
                              }}
                            >
                              <AttachFile
                                titleAccess={i18n.t("whitelabel.upload")}
                              />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-dark-upload-field"
                    label={i18n.t("whitelabel.logoDark")}
                    variant="standard"
                    value={settingsLoaded.appLogoDark || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoDark && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoDark", "");
                                colorMode.setAppLogoDark(defaultLogoDark);
                              }}
                            >
                              <Delete
                                titleAccess={i18n.t("whitelabel.delete")}
                              />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-dark-button"
                            ref={logoDarkInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e, "Dark")}
                          />
                          <label htmlFor="upload-logo-dark-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoDarkInput.current.click();
                              }}
                            >
                              <AttachFile
                                titleAccess={i18n.t("whitelabel.upload")}
                              />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="logo-favicon-upload-field"
                    label={i18n.t("whitelabel.favicon")}
                    variant="standard"
                    value={settingsLoaded.appLogoFavicon || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoFavicon && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoFavicon", "");
                                colorMode.setAppLogoFavicon(defaultLogoFavicon);
                              }}
                            >
                              <Delete
                                titleAccess={i18n.t("whitelabel.delete")}
                              />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-logo-favicon-button"
                            ref={logoFaviconInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e, "Favicon")}
                          />
                          <label htmlFor="upload-logo-favicon-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                logoFaviconInput.current.click();
                              }}
                            >
                              <AttachFile
                                titleAccess={i18n.t("whitelabel.upload")}
                              />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="background-light-upload-field"
                    label={i18n.t("whitelabel.backgroundLight")}
                    variant="standard"
                    value={settingsLoaded.appLogoBackgroundLight || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoBackgroundLight && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoBackgroundLight", "");
                              }}
                            >
                              <Delete
                                titleAccess={i18n.t("whitelabel.delete")}
                              />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-background-light-button"
                            ref={backgroundLightInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e, "BackgroundLight")}
                          />
                          <label htmlFor="upload-background-light-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                backgroundLightInput.current.click();
                              }}
                            >
                              <AttachFile
                                titleAccess={i18n.t("whitelabel.upload")}
                              />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="background-dark-upload-field"
                    label={i18n.t("whitelabel.backgroundDark")}
                    variant="standard"
                    value={settingsLoaded.appLogoBackgroundDark || ""}
                    InputProps={{
                      endAdornment: (
                        <>
                          {settingsLoaded.appLogoBackgroundDark && (
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                handleSaveSetting("appLogoBackgroundDark", "");
                              }}
                            >
                              <Delete
                                titleAccess={i18n.t("whitelabel.delete")}
                              />
                            </IconButton>
                          )}
                          <input
                            type="file"
                            id="upload-background-dark-button"
                            ref={backgroundDarkInput}
                            className={classes.uploadInput}
                            onChange={(e) => uploadLogo(e, "BackgroundDark")}
                          />
                          <label htmlFor="upload-background-dark-button">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => {
                                backgroundDarkInput.current.click();
                              }}
                            >
                              <AttachFile
                                titleAccess={i18n.t("whitelabel.upload")}
                              />
                            </IconButton>
                          </label>
                        </>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoLightPreviewDiv}>
                  <img
                    className={classes.appLogoLightPreviewImg}
                    alt={i18n.t("whitelabel.preview") + " light-logo"}
                  />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoDarkPreviewDiv}>
                  <img
                    className={classes.appLogoDarkPreviewImg}
                    alt={i18n.t("whitelabel.preview") + " dark-logo"}
                  />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoFaviconPreviewDiv}>
                  <img
                    className={classes.appLogoFaviconPreviewImg}
                    alt={i18n.t("whitelabel.preview") + " favicon"}
                  />
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoBackgroundLightPreviewDiv}>
                  {settingsLoaded.appLogoBackgroundLight ? (
                    <img
                      className={classes.appLogoBackgroundLightPreviewImg}
                      src={
                        getBackendUrl() +
                        "/public/" +
                        settingsLoaded.appLogoBackgroundLight
                      }
                      alt={i18n.t("whitelabel.preview") + " background-light"}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={{ color: "#666", fontSize: "12px" }}>
                      {i18n.t("whitelabel.preview")} background-light
                    </div>
                  )}
                </div>
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.appLogoBackgroundDarkPreviewDiv}>
                  {settingsLoaded.appLogoBackgroundDark ? (
                    <img
                      className={classes.appLogoBackgroundDarkPreviewImg}
                      src={
                        getBackendUrl() +
                        "/public/" +
                        settingsLoaded.appLogoBackgroundDark
                      }
                      alt={i18n.t("whitelabel.preview") + " background-dark"}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={{ color: "#ccc", fontSize: "12px" }}>
                      {i18n.t("whitelabel.preview")} background-dark
                    </div>
                  )}
                </div>
              </Grid>
              <Grid xs={12} sm={12} md={12} item>
                <FormControl
                  className={classes.selectContainer}
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {i18n.t("whitelabel.availableLanguages")}
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <label
                        key={lang.code}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Checkbox
                          checked={enabledLanguages.includes(lang.code)}
                          onChange={(e) => {
                            let newLangs = e.target.checked
                              ? [...enabledLanguages, lang.code]
                              : enabledLanguages.filter((c) => c !== lang.code);
                            if (newLangs.length === 0) {
                              toast.error(
                                i18n.t("whitelabel.atLeastOneLanguage")
                              );
                              return;
                            }
                            handleSaveEnabledLanguages(newLangs);
                          }}
                          color="primary"
                        />
                        {lang.label}
                      </label>
                    ))}
                  </div>
                </FormControl>
              </Grid>
            </>
          )}
        />
      </Grid>
    </>
  );
}