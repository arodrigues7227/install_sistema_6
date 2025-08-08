import React, { useState, useContext, useEffect, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import useSettings from "../../hooks/useSettings";
import IconButton from "@material-ui/core/IconButton";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import InputAdornment from "@material-ui/core/InputAdornment";
import { Helmet } from "react-helmet";
import clsx from "clsx";
import { getBackendUrl } from "../../config";


const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw !important",
    height: "100vh !important",
    display: "flex !important",
    flexDirection: "column !important",
    alignItems: "center !important",
    justifyContent: "center !important",
    textAlign: "center !important",
    padding: "0 !important",
    margin: "0 !important",
    boxSizing: "border-box !important",
    overflow: "auto !important", // Permitir scroll se necessário
    // Background será definido via inline style para permitir dinâmica
  },
  // Container específico para login - forçar centralização
  containerLogin: {
    padding: "16px !important",
    maxWidth: "444px !important",
    width: "auto !important",
    margin: "0 auto !important",
    position: "relative !important",
    left: "auto !important",
    right: "auto !important",
    transform: "none !important",
    flex: "none !important",
  },
  paper: {
    backgroundColor:
      theme.mode === "light"
        ? "rgba(255, 255, 255, 0.7)"
        : "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    boxShadow:
      theme.mode === "light"
        ? "0 4px 6px rgba(0, 0, 0, 0.1)"
        : "0 4px 6px rgba(255, 255, 255, 0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "55px 30px",
    borderRadius: "12.5px",
    maxWidth: "420px !important",
    width: "100% !important",
    margin: "0 auto !important",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  powered: {
    color: "white",
  },
  logoImg: {
    width: "100%",
    maxWidth: "350px",
    height: "auto",
    maxHeight: "120px",
    margin: "0 auto",
    content:
      "url(" +
      (theme.mode === "light"
        ? theme.calculatedLogoLight()
        : theme.calculatedLogoDark()) +
      ")",
  },
  iconButton: {
    position: "absolute",
    top: 10,
    right: 10,
    color: theme.mode === "light" ? "black" : "white",
  },
  labelList: {
    display: "flex",
    alignItems: "center",
    justifyItems: "center",
    padding: "8px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    background: theme.mode === "light" ? "white" : "white",
    color: theme.mode === "light" ? "black" : "black",
  },
}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const { appLogoFavicon, appName, mode } = colorMode;
  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [allowSignup, setAllowSignup] = useState(false);
  const { getPublicSetting } = useSettings();
  const { handleLogin } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const ref = useRef();
  const [backgroundLight, setBackgroundLight] = useState("");
  const [backgroundDark, setBackgroundDark] = useState("");

  const getCompanyIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get("companyId");
    return companyId ? parseInt(companyId) : null;
  };

  const handleChangeInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlSubmit = (e) => {
    e.preventDefault();
    handleLogin(user);
  };

  useEffect(() => {
    const companyId = getCompanyIdFromUrl();

    getPublicSetting("userCreation", companyId)
      .then((data) => {
        setAllowSignup(data === "enabled");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoBackgroundLight", companyId)
      .then((bgLight) => {
        if (bgLight) {
          setBackgroundLight(getBackendUrl() + "/public/" + bgLight);
        } else {
          setBackgroundLight("");
        }
      })
      .catch(() => {
        setBackgroundLight("");
      });

    getPublicSetting("appLogoBackgroundDark", companyId)
      .then((bgDark) => {
        if (bgDark) {
          setBackgroundDark(getBackendUrl() + "/public/" + bgDark);
        } else {
          setBackgroundDark("");
        }
      })
      .catch(() => {
        setBackgroundDark("");
      });
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      if (event.data && event.data.type === "settings-update") {
        // Recarregar configurações quando houver atualização
        const companyId = getCompanyIdFromUrl();
        getPublicSetting("appLogoBackgroundLight", companyId)
          .then((bgLight) => {
            if (bgLight) {
              setBackgroundLight(getBackendUrl() + "/public/" + bgLight);
            } else {
              setBackgroundLight("");
            }
          })
          .catch(() => setBackgroundLight(""));

        getPublicSetting("appLogoBackgroundDark", companyId)
          .then((bgDark) => {
            if (bgDark) {
              setBackgroundDark(getBackendUrl() + "/public/" + bgDark);
            } else {
              setBackgroundDark("");
            }
          })
          .catch(() => setBackgroundDark(""));
      }
    };

    if (window.socket) {
      const onSettingsEvent = () => {
        const companyId = getCompanyIdFromUrl();

        getPublicSetting("appLogoBackgroundLight", companyId)
          .then((bgLight) => {
            if (bgLight) {
              setBackgroundLight(getBackendUrl() + "/public/" + bgLight);
            } else {
              setBackgroundLight("");
            }
          })
          .catch(() => setBackgroundLight(""));

        getPublicSetting("appLogoBackgroundDark", companyId)
          .then((bgDark) => {
            if (bgDark) {
              setBackgroundDark(getBackendUrl() + "/public/" + bgDark);
            } else {
              setBackgroundDark("");
            }
          })
          .catch(() => setBackgroundDark(""));
      };

      window.socket.on("company-settings", onSettingsEvent);
      return () => {
        window.socket.off("company-settings", onSettingsEvent);
      };
    }

    window.addEventListener("message", handleSettingsUpdate);
    return () => {
      window.removeEventListener("message", handleSettingsUpdate);
    };
  }, [getPublicSetting]);


  let finalBackground;
  if (mode === "light") {
    if (backgroundLight) {
      finalBackground = `url(${backgroundLight})`;
    } else {
      finalBackground = theme.palette.light || "#f5f5f5";
    }
  } else {
    if (backgroundDark) {
      finalBackground = `url(${backgroundDark})`;
    } else {
      finalBackground = theme.palette.dark || "#303030";
    }
  }

  finalBackground = String(finalBackground || "#f5f5f5");

  return (
    <>
      <Helmet>
        <title>{appName || "Multi100"}</title>
        <link rel="icon" href={appLogoFavicon || "/default-favicon.ico"} />
      </Helmet>
      <div
        className={clsx(classes.root, "login-page")}
        style={{
          // Backup inline styles - vão sobrescrever qualquer CSS global
          width: "100vw !important",
          height: "100vh !important",
          display: "flex !important",
          alignItems: "center !important",
          justifyContent: "center !important",
          padding: "0 !important",
          margin: "0 !important",
          boxSizing: "border-box !important",
          overflow: "auto !important",
          backgroundColor:
            typeof finalBackground === "string" &&
            finalBackground.includes("url(")
              ? "transparent"
              : finalBackground,
          backgroundImage:
            typeof finalBackground === "string" &&
            finalBackground.includes("url(")
              ? finalBackground
              : "none",
          backgroundRepeat: "no-repeat !important",
          backgroundSize: "cover !important",
          backgroundPosition: "center !important",
        }}
      >

        <Container
          component="main"
          maxWidth="xs"
          className={classes.containerLogin}
          style={{
            // Backup inline styles para forçar centralização
            maxWidth: "444px",
            width: "auto",
            margin: "0 auto",
            padding: "16px",
            position: "relative",
            left: "auto",
            right: "auto",
            transform: "none",
            flex: "none",
          }}
        >
          <CssBaseline />
          <div className={classes.paper}>
            <IconButton
              className={classes.iconButton}
              onClick={colorMode.toggleColorMode}
            >
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <div>
              <img className={classes.logoImg} alt="logo" />
            </div>
            <form className={classes.form} noValidate onSubmit={handlSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label={i18n.t("login.form.email")}
                name="email"
                value={user.email}
                onChange={handleChangeInput}
                autoComplete="email"
                autoFocus
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={i18n.t("login.form.password")}
                type={showPassword ? "text" : "password"}
                id="password"
                value={user.password}
                onChange={handleChangeInput}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                {i18n.t("login.buttons.submit")}
              </Button>
              {allowSignup && (
                <Grid container>
                  <Grid item>
                    <Link
                      href="#"
                      variant="body2"
                      component={RouterLink}
                      to="/signup"
                    >
                      {i18n.t("login.buttons.register")}
                    </Link>
                  </Grid>
                </Grid>
              )}
            </form>
          </div>
        </Container>
      </div>
    </>
  );
};

export default Login;