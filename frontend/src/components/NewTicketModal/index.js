import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import Autocomplete, { createFilterOptions } from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Grid, ListItemText, MenuItem, Select } from "@material-ui/core";
import { Facebook, Instagram, WhatsApp } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { toast } from "react-toastify";
import ShowTicketOpenModal from "../ShowTicketOpenModal";

const useStyles = makeStyles((theme) => ({
  online: {
    fontSize: 11,
    color: "#25d366"
  },
  offline: {
    fontSize: 11,
    color: "#e1306c"
  }
}));

const filter = createFilterOptions({
  trim: true,
});

const NewTicketModal = ({ modalOpen, onClose, initialContact }) => {
  const classes = useStyles();
  const history = useHistory();
  
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  const [whatsapps, setWhatsapps] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({});
  const { user } = useContext(AuthContext);
  const { companyId, whatsappId } = user;

  const [ticketOpenData, setTicketOpenData] = useState(null);
  const [showTicketOpenModal, setShowTicketOpenModal] = useState(false);

  useEffect(() => {
    if (initialContact?.id !== undefined) {
      setOptions([initialContact]);
      setSelectedContact(initialContact);
    }
  }, [initialContact]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/whatsapp", {
          params: { companyId, session: 0 }
        });
        setWhatsapps(data);
      } catch (err) {
        toastError(err);
      }
    };
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (!modalOpen || searchParam.length < 3) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("contacts", {
            params: { searchParam },
          });
          setOptions(data.contacts);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  useEffect(() => {
    if (whatsappId) {
      setSelectedWhatsapp(whatsappId);
    }
    if (user.queues.length === 1) {
      setSelectedQueue(user.queues[0].id);
    }
  }, [whatsappId, user.queues]);

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedContact(null);
    setTicketOpenData(null);
    setShowTicketOpenModal(false);
  };

  const handleSaveTicket = async contactId => {
    if (!contactId) return;
    if (selectedQueue === "") {
      toast.error("Selecione uma fila");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/tickets", {
        contactId,
        queueId: selectedQueue,
        whatsappId: selectedWhatsapp,
        userId: user.id,
        status: "open",
      });
  
      if (data.error && data.type === "TICKET_ALREADY_EXISTS") {
        setTicketOpenData(data.ticket);
        setShowTicketOpenModal(true);
        setLoading(false);
        return;
      }
  
      handleClose();
      // Aqui é a mudança principal - agora usamos o data.id em vez de data.ticket.id
      history.push(`/tickets/${data.id}`);
    } catch (err) {
      setLoading(false);
      if (err.response?.data?.error && err.response.data.type === "TICKET_ALREADY_EXISTS") {
        setTicketOpenData(err.response.data.ticket);
        setShowTicketOpenModal(true);
        return;
      }
      toastError(err);
    }
  };
  const handleSelectOption = (e, newValue) => {
    if (newValue?.number) {
      setSelectedContact(newValue);
    } else if (newValue?.name) {
      setNewContact({ name: newValue.name });
      setContactModalOpen(true);
    }
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

  const handleAddNewContactTicket = contact => {
    setSelectedContact(contact);
  };

  const createAddContactOption = (filterOptions, params) => {
    const filtered = filter(filterOptions, params);
    if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
      filtered.push({
        name: params.inputValue,
      });
    }
    return filtered;
  };

  const renderOption = option => {
    if (option.number) {
      return (
        <>
          {IconChannel(option.channel)}
          <Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
            {option.name} - {option.number}
          </Typography>
        </>
      );
    }
    return `${i18n.t("newTicketModal.add")} ${option.name}`;
  };

  const renderOptionLabel = option => {
    if (option.number) {
      return `${option.name} - ${option.number}`;
    }
    return `${option.name}`;
  };

  const IconChannel = (channel) => {
    switch (channel) {
      case "facebook":
        return <Facebook style={{ color: "#3b5998", verticalAlign: "middle" }} />;
      case "instagram":
        return <Instagram style={{ color: "#e1306c", verticalAlign: "middle" }} />;
      case "whatsapp":
        return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle" }} />
      default:
        return "error";
    }
  };

  const renderContactAutocomplete = () => {
    if (initialContact === undefined || initialContact.id === undefined) {
      return (
        <Grid xs={12} item>
          <Autocomplete
            fullWidth
            options={options}
            loading={loading}
            clearOnBlur
            autoHighlight
            freeSolo
            clearOnEscape
            getOptionLabel={renderOptionLabel}
            renderOption={renderOption}
            filterOptions={createAddContactOption}
            onChange={handleSelectOption}
            renderInput={params => (
              <TextField
                {...params}
                label={i18n.t("newTicketModal.fieldLabel")}
                variant="outlined"
                autoFocus
                onChange={e => setSearchParam(e.target.value)}
                onKeyPress={e => {
                  if (loading || !selectedContact) return;
                  else if (e.key === "Enter") {
                    handleSaveTicket(selectedContact.id);
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </Grid>
      );
    }
    return null;
  };

  return (
    <>
      <Dialog open={modalOpen} onClose={handleClose} maxWidth="lg" scroll="paper">
        <DialogTitle>
          {i18n.t("newTicketModal.title")}
        </DialogTitle>
        <DialogContent dividers>
          <Grid style={{ width: 300 }} container spacing={2}>
            {renderContactAutocomplete()}
            <Grid xs={12} item>
              <Select
                required
                fullWidth
                displayEmpty
                variant="outlined"
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => {
                  if (selectedQueue === "") {
                    return "Selecione uma fila"
                  }
                  const queue = user.queues.find(q => q.id === selectedQueue)
                  return queue.name
                }}
              >
                {user.queues?.length > 0 &&
                  user.queues.map((queue) => (
                    <MenuItem dense key={queue.id} value={queue.id}>
                      <ListItemText primary={queue.name} />
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
            <Grid xs={12} item>
              <Select
                required
                fullWidth
                displayEmpty
                variant="outlined"
                value={selectedWhatsapp}
                onChange={(e) => setSelectedWhatsapp(e.target.value)}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => {
                  if (selectedWhatsapp === "") {
                    return "Selecione uma Conexão"
                  }
                  const whatsapp = whatsapps.find(w => w.id === selectedWhatsapp)
                  return whatsapp?.name
                }}
              >
                {whatsapps.map((whatsapp) => (
                  <MenuItem dense key={whatsapp.id} value={whatsapp.id}>
                    <ListItemText
                      primary={
                        <>
                          {IconChannel(whatsapp.channel)}
                          <Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
                            {whatsapp.name} &nbsp;
                            <p className={whatsapp.status === 'CONNECTED' ? classes.online : classes.offline}>
                              ({whatsapp.status})
                            </p>
                          </Typography>
                        </>
                      }
                    />
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={loading}
            variant="outlined"
          >
            {i18n.t("newTicketModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            variant="contained"
            type="button"
            disabled={!selectedContact}
            onClick={() => handleSaveTicket(selectedContact.id)}
            color="primary"
            loading={loading}
          >
            {i18n.t("newTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </Dialog>
      {contactModalOpen && (
        <ContactModal
          open={contactModalOpen}
          initialValues={newContact}
          onClose={handleCloseContactModal}
          onSave={handleAddNewContactTicket}
        />
      )}
      <ShowTicketOpenModal
        isOpen={showTicketOpenModal}
        handleClose={() => setShowTicketOpenModal(false)}
        ticketData={ticketOpenData}
      />
    </>
  );
};

export default NewTicketModal; 