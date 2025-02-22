import React, { useContext, useState } from "react";

import { Button, Menu, MenuItem } from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";

const UserLanguageSelector = () => {
    const [langueMenuAnchorEl, setLangueMenuAnchorEl] = useState(null);

    const { user, socket } = useContext(AuthContext);

    const handleOpenLanguageMenu = e => {
        setLangueMenuAnchorEl(e.currentTarget);
    };

    const handleChangeLanguage = async language => {
        localStorage.setItem("language", language);
        handleCloseLanguageMenu();
        window.location.reload(false);
    };


      const handleCloseLanguageMenu = () => {
        setLanguageAnchorEl(null);
        setLanguageMenuOpen(false);
      };
    

    return (
        <>
            <Button
                color="inherit"
                onClick={handleOpenLanguageMenu}
                startIcon={<TranslateIcon />}
                endIcon={<ExpandMoreIcon />}
            >
                {user.language
                    ? i18n.t(`languages.${user.language}`)
                    : i18n.t(`languages.${user.undefined}`)}
            </Button>
            <Menu
                anchorEl={langueMenuAnchorEl}
                keepMounted
                open={Boolean(langueMenuAnchorEl)}
                onClose={handleCloseLanguageMenu}
            >
                <MenuItem onClick={() => handleChangeLanguage("pt-BR")}>
                    {i18n.t("languages.pt-BR")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("en")}>
                    {i18n.t("languages.en")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("es")}>
                    {i18n.t("languages.es")}
                </MenuItem>
                <MenuItem onClick={() => handleChangeLanguage("tr")}>
                    {i18n.t("languages.tr")}
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserLanguageSelector;
