import React, { useEffect, useReducer, useState } from "react";
import api from "../../services/api";
import { Autocomplete, TextField, Chip } from "@mui/material";

import toastError from "../../errors/toastError";
import {  grey } from "@mui/material/colors";
import { makeStyles } from "@material-ui/core";


const reducer = (state, action) => {
    if (action.type === "LOAD_USERS") {
        const users = action.payload;
        const newUsers = [];

        users.forEach((user) => {
            const userIndex = state.findIndex((u) => u.id === user.id);
            if (userIndex !== -1) {
                state[userIndex] = user;
            } else {
                newUsers.push(user);
            }
        });

        return [...state, ...newUsers];
    }

    if (action.type === "UPDATE_USERS") {
        const user = action.payload;
        const userIndex = state.findIndex((u) => u.id === user.id);

        if (userIndex !== -1) {
            state[userIndex] = user;
            return [...state];
        } else {
            return [user, ...state];
        }
    }

    if (action.type === "DELETE_USER") {
        const userId = action.payload;

        const userIndex = state.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
            state.splice(userIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

const useStyles = makeStyles((theme) => ({
  input: {
    marginTop: 10,
    backgroundColor: theme.palette.inputdigita,
    color: theme.palette.primary.main,
    '& .MuiInputLabel-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.main, // Cor do rótulo quando focado
    },
    borderColor: theme.palette.primary.main,
  },
  chip: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
  },
}));

const AutocompleteMultipleUsers = ({ selectedUsers: initialSelectedUsers, onUsersChange, disabled = false }) => {
    const classes = useStyles();
    const [searchParam, setSearchParam] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [users, dispatch] = useReducer(reducer, []);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers || []);

    useEffect(() => {
        setSelectedUsers(initialSelectedUsers);
    }, [initialSelectedUsers]);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchUsers = async () => {
                try {
                    const { data } = await api.get("/users/", {
                        params: { searchParam, pageNumber },
                    });
                    dispatch({ type: "LOAD_USERS", payload: data.users });
                    setHasMore(data.hasMore);
                    setLoading(false);
                } catch (err) {
                    toastError(err);
                }
            };
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber]);

    const handleChange = (event, newValue) => {
        setSelectedUsers(newValue);
        onUsersChange(newValue);
    };

    return (
        <>
            <Autocomplete
                multiple
                disabled={disabled}
                id="autocomplete-multiple-users"
                options={users}
                getOptionLabel={(option) => option.name}
                value={selectedUsers}
                onChange={handleChange}
                filterOptions={(x) => x}
                loading={loading}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Usuários"
                        variant="outlined"
                        onChange={(e) => setSearchParam(e.target.value)}
                        className={classes.input}
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            key={option.id}
                            label={option.name}
                            {...getTagProps({ index })}
                            style={{
                                backgroundColor: "grey",
                                color: "white",
                            }}
                        />
                    ))
                }
                sx={{
                    '& .MuiAutocomplete-tag': {
                        backgroundColor: grey[900],
                        color: "white",
                    },
                }}
            />
        </>
    );
};

export default AutocompleteMultipleUsers;
