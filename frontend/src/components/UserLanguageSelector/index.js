import React, { useState, useEffect } from "react";
import { Button, Menu, MenuItem, IconButton, useTheme, useMediaQuery, Tooltip } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { i18n, normalizeLanguageCode } from "../../translate/i18n";

const UserLanguageSelector = ({ iconOnly }) => {
    const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);
    const [currentLanguage, setCurrentLanguage] = useState("pt");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Determina se deve mostrar apenas o ícone com base na prop e no tamanho da tela
    const showIconOnly = iconOnly || isMobile;

    useEffect(() => {
        const savedLanguage = localStorage.getItem("language");
        const normalizedLanguage = normalizeLanguageCode(savedLanguage);
        setCurrentLanguage(normalizedLanguage);
        
        if (savedLanguage !== normalizedLanguage) {
            localStorage.setItem("language", normalizedLanguage);
        }
    }, []);

    const handleOpenLanguageMenu = (e) => {
        setLangueMenuAnchorEl(e.currentTarget);
    };

    const handleChangeLanguage = async (language) => {
        try {
            const normalizedLanguage = normalizeLanguageCode(language);
            localStorage.setItem("language", normalizedLanguage);
            setCurrentLanguage(normalizedLanguage);
            
            await i18n.changeLanguage(normalizedLanguage);
            handleCloseLanguageMenu();
            window.location.reload(false);
        } catch (error) {
            console.error("Erro ao mudar idioma:", error);
            const defaultLang = "pt";
            localStorage.setItem("language", defaultLang);
            setCurrentLanguage(defaultLang);
        }
    };

    const handleCloseLanguageMenu = () => {
        setLangueMenuAnchorEl(null);
    };

    const getLanguageLabel = (lang) => {
        const labels = {
            pt: "Português (Brasil)",
            en: "English",
            es: "Español"
        };
        return labels[normalizeLanguageCode(lang)] || labels.pt;
    };

    const languageButtonContent = showIconOnly ? (
        <IconButton
            color="inherit"
            onClick={handleOpenLanguageMenu}
            aria-label={i18n.t("mainDrawer.appBar.language") || "Selecionar idioma"}
        >
            <TranslateIcon style={{ color: "white" }} />
        </IconButton>
    ) : (
        <Button
            color="inherit"
            onClick={handleOpenLanguageMenu}
            startIcon={<TranslateIcon style={{ color: "white" }} />}
            endIcon={<ExpandMoreIcon style={{ color: "white" }} />}
            style={{ color: "white" }}
        >
            {getLanguageLabel(currentLanguage)}
        </Button>
    );

    return (
        <>
            <Tooltip title={i18n.t("mainDrawer.appBar.language") || "Selecionar idioma"}>
                {languageButtonContent}
            </Tooltip>
            <Menu
                anchorEl={langueMenuAnchorEl}
                keepMounted
                open={Boolean(langueMenuAnchorEl)}
                onClose={handleCloseLanguageMenu}
            >
                <MenuItem onClick={() => handleChangeLanguage("pt")}>
                    Português (Brasil)
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("en")}>
                    English
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("es")}>
                    Español
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserLanguageSelector;