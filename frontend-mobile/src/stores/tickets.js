import { create } from 'zustand';
import api from '../config/api';

export const useTicketsStore = create((set, get) => ({
  tickets: [],
  currentTicket: null,
  loading: false,
  hasMore: true,
  page: 1,
  searchTerm: '',
  status: 'open',

  // Fetch tickets with filters
  fetchTickets: async (params = {}) => {
    const { page = 1, reset = false } = params;
    const state = get();
    
    if (state.loading) return;
    
    set({ loading: true });

    try {
      const response = await api.get('/tickets', {
        params: {
          searchParam: state.searchTerm,
          pageNumber: page,
          status: state.status,
          withUnreadMessages: false,
          queueIds: [],
          tags: [],
          users: [],
          ...params,
        },
      });

      const { tickets, count, hasMore } = response.data;

      set({
        tickets: reset ? tickets : [...state.tickets, ...tickets],
        hasMore,
        page,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      set({ loading: false });
    }
  },

  // Load more tickets (pagination)
  loadMoreTickets: () => {
    const state = get();
    if (state.hasMore && !state.loading) {
      state.fetchTickets({ page: state.page + 1 });
    }
  },

  // Set current ticket
  setCurrentTicket: (ticket) => {
    set({ currentTicket: ticket });
  },

  // Update ticket in list
  updateTicket: (updatedTicket) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      ),
      currentTicket:
        state.currentTicket?.id === updatedTicket.id
          ? updatedTicket
          : state.currentTicket,
    }));
  },

  // Add new ticket to list
  addTicket: (newTicket) => {
    set((state) => ({
      tickets: [newTicket, ...state.tickets],
    }));
  },

  // Remove ticket from list
  removeTicket: (ticketId) => {
    set((state) => ({
      tickets: state.tickets.filter((ticket) => ticket.id !== ticketId),
      currentTicket:
        state.currentTicket?.id === ticketId ? null : state.currentTicket,
    }));
  },

  // Set search term and reset tickets
  setSearchTerm: (searchTerm) => {
    set({ searchTerm, page: 1 });
    get().fetchTickets({ reset: true, searchParam: searchTerm });
  },

  // Set status filter and reset tickets
  setStatus: (status) => {
    set({ status, page: 1 });
    get().fetchTickets({ reset: true, status });
  },

  // Reset store
  reset: () => {
    set({
      tickets: [],
      currentTicket: null,
      loading: false,
      hasMore: true,
      page: 1,
      searchTerm: '',
      status: 'open',
    });
  },
}));