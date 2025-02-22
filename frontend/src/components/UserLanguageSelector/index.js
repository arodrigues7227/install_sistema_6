import React, { useContext, useState } from "react";
import { Button, Menu, MenuItem } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { i18n } from "../../translate/i18n";

const UserLanguageSelector = () => {
    const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);

    // Obtém o idioma atual do localStorage
    const currentLanguage = localStorage.getItem("language") || "pt"; // Define um idioma padrão caso não haja nenhum salvo

    const handleOpenLanguageMenu = e => {
        setLangueMenuAnchorEl(e.currentTarget);
    };

    const handleChangeLanguage = async language => {
        localStorage.setItem("language", language);
        handleCloseLanguageMenu();
        window.location.reload(false); // Recarrega a página para aplicar o novo idioma
    };

    const handleCloseLanguageMenu = () => {
        setLangueMenuAnchorEl(null);
    };

    return (
        <>
            <Button
                color="inherit"
                onClick={handleOpenLanguageMenu}
                startIcon={<TranslateIcon />}
                endIcon={<ExpandMoreIcon />}
            >
                {i18n.t(`languages.${currentLanguage}`)}
            </Button>
            <Menu
                anchorEl={langueMenuAnchorEl}
                keepMounted
                open={Boolean(langueMenuAnchorEl)}
                onClose={handleCloseLanguageMenu}
            >
                <MenuItem onClick={() => handleChangeLanguage("pt")}>
                    {i18n.t("languages.pt-BR")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("en")}>
                    {i18n.t("languages.en")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("es")}>
                    {i18n.t("languages.es")}
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserLanguageSelector;